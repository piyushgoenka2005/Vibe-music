import os
import requests
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.conf import settings

from Admin.product.models import productModel


def get_env(name):
    val = os.environ.get(name)
    if not val:
        raise RuntimeError(f"Environment variable {name} is required")
    return val


class Command(BaseCommand):
    help = 'Sync products from a WooCommerce store (Vibe Music). Uses env vars VIBE_WC_URL, VIBE_WC_KEY, VIBE_WC_SECRET'

    def add_arguments(self, parser):
        parser.add_argument('--page-size', type=int, default=50)
        parser.add_argument('--download-images', action='store_true', help='Download product images into MEDIA_ROOT')

    def handle(self, *args, **options):
        base_url = get_env('VIBE_WC_URL').rstrip('/')
        key = get_env('VIBE_WC_KEY')
        secret = get_env('VIBE_WC_SECRET')
        per_page = options['page_size']
        download_images = options['download_images']

        page = 1
        imported = 0
        self.stdout.write('Starting WooCommerce sync from %s' % base_url)

        while True:
            url = f"{base_url}/wp-json/wc/v3/products"
            params = {'per_page': per_page, 'page': page, 'consumer_key': key, 'consumer_secret': secret}
            self.stdout.write(f'Fetching page {page}...')
            resp = requests.get(url, params=params, timeout=30)
            if resp.status_code != 200:
                self.stderr.write(f'Error fetching products: {resp.status_code} {resp.text}')
                break

            products = resp.json()
            if not products:
                break

            for p in products:
                # mapping: use sku if available, else remote id
                sku = p.get('sku') or f"wc-{p.get('id')}"
                name = p.get('name') or ''
                description = p.get('description') or ''
                price = p.get('price') or p.get('regular_price') or 0
                try:
                    price_int = int(float(price))
                except Exception:
                    price_int = 0
                stock_quantity = None
                if p.get('stock_quantity') is not None:
                    try:
                        stock_quantity = int(p.get('stock_quantity'))
                    except Exception:
                        stock_quantity = 0

                # map or create category and brand
                wc_cats = p.get('categories') or []
                if wc_cats:
                    # take first category as primary
                    primary_cat = wc_cats[0].get('name')
                    if primary_cat:
                        from Admin.category.models import categoryModel
                        cat_obj = categoryModel.objects.filter(cat_name__iexact=primary_cat).first()
                        if not cat_obj:
                            cat_obj = categoryModel(cat_name=primary_cat)
                            cat_obj.save()
                        obj.catname_id = cat_obj

                wc_attrs = p.get('attributes') or []
                # try to map a brand via attribute named "brand" or "Brand"
                brand_name = None
                for a in wc_attrs:
                    if a.get('name', '').lower() == 'brand' and a.get('options'):
                        brand_name = a.get('options')[0]
                        break
                if not brand_name:
                    # fallback to tags or manufacturer fields
                    tags = p.get('tags') or []
                    if tags:
                        brand_name = tags[0].get('name')

                if brand_name:
                    from Admin.subcategory.models import brandModel
                    br = brandModel.objects.filter(brand_name__iexact=brand_name).first()
                    if not br:
                        br = brandModel(brand_name=brand_name)
                        br.save()
                    obj.brand = br

                # find existing product by pro_code (use numeric part of sku) or name
                obj = None
                code_int = None
                if sku:
                    try:
                        code_int = int(''.join(ch for ch in sku if ch.isdigit()))
                    except Exception:
                        code_int = None
                    if code_int:
                        obj = productModel.objects.filter(pro_code=code_int).first()

                if not obj:
                    obj = productModel.objects.filter(productname__iexact=name).first()

                if obj:
                    self.stdout.write(f'Updating product: {name[:40]}')
                else:
                    self.stdout.write(f'Creating product: {name[:40]}')
                    obj = productModel()

                obj.productname = name[:50]
                obj.pro_description = description
                if code_int:
                    obj.pro_code = code_int
                if stock_quantity is not None:
                    obj.total_quantity = stock_quantity
                obj.pro_price = price_int

                # minimal defaults to avoid nulls
                if not getattr(obj, 'pro_colour', None):
                    obj.pro_colour = ''
                if getattr(obj, 'return_product', None) is None:
                    obj.return_product = 'no'

                obj.save()
                imported += 1

                # images: attempt to set main, back, feature from first 3 images
                if download_images:
                    images = p.get('images') or []
                    for idx, img in enumerate(images[:3]):
                        src = img.get('src')
                        if not src:
                            continue
                        try:
                            r = requests.get(src, timeout=30)
                            if r.status_code == 200:
                                filename = os.path.basename(src.split('?')[0])
                                if idx == 0:
                                    obj.pro_image.save(filename, ContentFile(r.content), save=True)
                                elif idx == 1:
                                    obj.pro_back_image.save(filename, ContentFile(r.content), save=True)
                                elif idx == 2:
                                    obj.feature_image.save(filename, ContentFile(r.content), save=True)
                        except Exception as e:
                            self.stderr.write(f'Image download failed for {src}: {e}')

            page += 1

        self.stdout.write(self.style.SUCCESS(f'Sync finished. Imported/updated {imported} products.'))
