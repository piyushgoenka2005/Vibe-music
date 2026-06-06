import os
import re
from decimal import Decimal, InvalidOperation

import requests
from bs4 import BeautifulSoup
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from Admin.category.models import categoryModel
from Admin.product.models import productModel
from Admin.subcategory.models import brandModel


def _parse_price_to_int(raw_price):
    if raw_price is None:
        return 0

    if isinstance(raw_price, (int, float, Decimal)):
        try:
            return int(Decimal(str(raw_price)))
        except (InvalidOperation, ValueError):
            return 0

    text = str(raw_price).strip().replace(",", "")
    if not text:
        return 0

    try:
        return int(Decimal(text))
    except (InvalidOperation, ValueError):
        return 0


def _price_from_store_api(product):
    prices = product.get("prices") or {}
    value = prices.get("price")
    minor_unit = prices.get("currency_minor_unit", 2)

    if value is None:
        return 0

    try:
        amount = Decimal(str(value))
        divisor = Decimal(10) ** int(minor_unit)
        return int(amount / divisor)
    except (InvalidOperation, ValueError, ZeroDivisionError):
        return 0


def _first_category_name(product):
    cats = product.get("categories") or []
    if not cats:
        return None
    first = cats[0]
    return first.get("name") if isinstance(first, dict) else str(first)


def _detect_brand_name(product):
    attributes = product.get("attributes") or []
    for attr in attributes:
        name = (attr.get("name") or "").strip().lower()
        options = attr.get("options") or []
        if name == "brand" and options:
            return str(options[0]).strip()

    tags = product.get("tags") or []
    if tags:
        first = tags[0]
        return (first.get("name") or "").strip() if isinstance(first, dict) else str(first).strip()
    return None


class Command(BaseCommand):
    help = (
        "Sync products from Vibe Music WooCommerce. "
        "Uses v3 API when VIBE_WC_KEY and VIBE_WC_SECRET are present; "
        "falls back to Store API, then real-time HTML scraping."
    )

    USER_AGENT = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36"
    )

    def add_arguments(self, parser):
        parser.add_argument("--page-size", type=int, default=50)
        parser.add_argument("--download-images", action="store_true", help="Download first 3 product images")
        parser.add_argument("--max-pages", type=int, default=60, help="Max pages for HTML fallback")
        parser.add_argument("--max-api-pages", type=int, default=0, help="Cap API pages for test runs (0 = no limit)")

    def _headers(self):
        return {
            "User-Agent": self.USER_AGENT,
            "Accept": "application/json,text/html,application/xhtml+xml,*/*",
            "Referer": "https://vibemusic.in/",
        }

    def _fetch_page(self, base_url, page, per_page):
        key = os.environ.get("VIBE_WC_KEY", "").strip()
        secret = os.environ.get("VIBE_WC_SECRET", "").strip()
        timeout = 30

        if key and secret:
            url = f"{base_url}/wp-json/wc/v3/products"
            params = {
                "per_page": per_page,
                "page": page,
                "consumer_key": key,
                "consumer_secret": secret,
            }
            response = requests.get(url, params=params, timeout=timeout, headers=self._headers())
            response.raise_for_status()
            return response.json(), "v3"

        url = f"{base_url}/wp-json/wc/store/v1/products"
        params = {"per_page": per_page, "page": page}
        response = requests.get(url, params=params, timeout=timeout, headers=self._headers())
        response.raise_for_status()
        return response.json(), "store"

    def _fetch_html_products(self, base_url, max_pages):
        products = []
        seen_urls = set()

        for page in range(1, max_pages + 1):
            page_url = f"{base_url}/shop/" if page == 1 else f"{base_url}/shop/?product-page={page}"
            try:
                response = requests.get(page_url, timeout=30, headers=self._headers())
                response.raise_for_status()
            except requests.RequestException:
                break

            soup = BeautifulSoup(response.text, "html.parser")

            anchors = soup.select('a[href*="/product/"]')
            page_items = 0
            for a in anchors:
                href = a.get("href") or ""
                if "/product/" not in href:
                    continue
                if href in seen_urls:
                    continue

                text = " ".join(a.get_text(" ", strip=True).split())
                if not text:
                    continue

                current_match = re.search(r"Current price is:\s*₹([\d,]+(?:\.\d+)?)", text, flags=re.IGNORECASE)
                any_price = re.findall(r"₹([\d,]+(?:\.\d+)?)", text)
                original_match = re.search(r"Original price was:\s*₹([\d,]+(?:\.\d+)?)", text, flags=re.IGNORECASE)

                if current_match:
                    current_price = current_match.group(1)
                elif any_price:
                    current_price = any_price[-1]
                else:
                    current_price = "0"

                original_price = original_match.group(1) if original_match else None

                cleaned_name = re.sub(r"^SALE!?\s*", "", text, flags=re.IGNORECASE)
                cleaned_name = re.sub(r"Original price was:.*$", "", cleaned_name, flags=re.IGNORECASE)
                cleaned_name = re.sub(r"₹[\d,]+(?:\.\d+)?", "", cleaned_name)
                cleaned_name = cleaned_name.replace("Current price is:", "").strip(" .:-")
                cleaned_name = cleaned_name[:120] if cleaned_name else f"Product {len(products)+1}"

                image_src = None
                img = a.find("img")
                if img:
                    image_src = img.get("data-src") or img.get("src")

                products.append({
                    "id": None,
                    "sku": None,
                    "name": cleaned_name,
                    "description": cleaned_name,
                    "price": current_price,
                    "regular_price": original_price,
                    "stock_quantity": 25,
                    "categories": [],
                    "attributes": [],
                    "tags": [],
                    "images": [{"src": image_src}] if image_src else [],
                    "source_url": href,
                })
                seen_urls.add(href)
                page_items += 1

            if page_items == 0:
                break

            self.stdout.write(f"Parsed page {page} via HTML fallback ({page_items} items)")

        return products

    def _get_or_create_category(self, name):
        if not name:
            return None
        category = categoryModel.objects.filter(cat_name__iexact=name).first()
        if category:
            return category
        category = categoryModel(cat_name=name)
        category.save()
        return category

    def _get_or_create_brand(self, name):
        if not name:
            return None
        brand = brandModel.objects.filter(brand_name__iexact=name).first()
        if brand:
            return brand
        brand = brandModel(brand_name=name)
        brand.save()
        return brand

    def _download_images(self, obj, images):
        for idx, image in enumerate(images[:3]):
            src = image.get("src") if isinstance(image, dict) else None
            if not src:
                continue
            try:
                img_response = requests.get(src, timeout=30, headers=self._headers())
                if img_response.status_code != 200:
                    continue
                filename = os.path.basename(src.split("?")[0]) or f"product-{obj.id}-{idx}.jpg"
                content = ContentFile(img_response.content)
                if idx == 0:
                    obj.pro_image.save(filename, content, save=False)
                elif idx == 1:
                    obj.pro_back_image.save(filename, content, save=False)
                else:
                    obj.feature_image.save(filename, content, save=False)
            except requests.RequestException:
                continue
        obj.save()

    def _upsert_products(self, products, source, download_images):
        total_upserts = 0
        for remote in products:
            remote_id = remote.get("id")
            sku = remote.get("sku") or (f"wc-{remote_id}" if remote_id else None)
            name = (remote.get("name") or "").strip()
            description = remote.get("description") or remote.get("short_description") or ""

            if source == "store":
                price_int = _price_from_store_api(remote)
                regular = remote.get("prices", {}).get("regular_price")
                strike_int = _parse_price_to_int(regular)
                stock_quantity = 0 if not remote.get("is_in_stock", True) else 25
            else:
                price_int = _parse_price_to_int(remote.get("price") or remote.get("regular_price"))
                strike_int = _parse_price_to_int(remote.get("regular_price"))
                stock_quantity = remote.get("stock_quantity")

            code_int = None
            if sku:
                digits = "".join(ch for ch in str(sku) if ch.isdigit())
                if digits:
                    try:
                        code_int = int(digits)
                    except ValueError:
                        code_int = None

            obj = productModel.objects.filter(pro_code=code_int).first() if code_int else None
            if not obj and name:
                obj = productModel.objects.filter(productname__iexact=name[:50]).first()
            if not obj:
                obj = productModel()

            obj.productname = (name or f"Product {remote_id or total_upserts + 1}")[:50]
            obj.pro_description = description
            obj.pro_price = price_int
            obj.strike_price = strike_int if strike_int > 0 else None
            obj.total_quantity = int(stock_quantity) if stock_quantity is not None else 0
            obj.pro_code = code_int
            obj.pro_colour = obj.pro_colour or "Standard"
            obj.return_product = obj.return_product or "Yes"
            obj.return_period_days = obj.return_period_days or 7

            category_name = _first_category_name(remote)
            category = self._get_or_create_category(category_name)
            if category:
                obj.catname_id = category

            brand_name = _detect_brand_name(remote)
            brand = self._get_or_create_brand(brand_name)
            if brand:
                obj.brand = brand

            obj.save()

            if download_images:
                images = remote.get("images") or []
                self._download_images(obj, images)

            total_upserts += 1

        return total_upserts

    def handle(self, *args, **options):
        base_url = os.environ.get("VIBE_WC_URL", "https://vibemusic.in").strip().rstrip("/")
        per_page = options["page_size"]
        download_images = options["download_images"]
        max_pages = options["max_pages"]
        max_api_pages = options["max_api_pages"]

        self.stdout.write(f"Starting product sync from {base_url}")

        total_upserts = 0
        page = 1
        source = None

        while True:
            try:
                products, source = self._fetch_page(base_url, page, per_page)
            except requests.RequestException as exc:
                self.stdout.write(self.style.WARNING(f"API mode unavailable ({exc}). Switching to HTML fallback..."))
                products = self._fetch_html_products(base_url, max_pages)
                source = "html"
                if not products:
                    self.stderr.write(self.style.ERROR("No products found via API or HTML fallback."))
                    raise SystemExit(1)
                total_upserts += self._upsert_products(products, source, download_images)
                break

            if not products:
                break

            self.stdout.write(f"Fetched page {page} from {source} API ({len(products)} items)")
            total_upserts += self._upsert_products(products, source, download_images)
            if max_api_pages and page >= max_api_pages:
                self.stdout.write(self.style.WARNING(f"Stopped after {max_api_pages} API pages by request."))
                break
            page += 1

        self.stdout.write(self.style.SUCCESS(f"Sync complete. Upserted {total_upserts} products."))
