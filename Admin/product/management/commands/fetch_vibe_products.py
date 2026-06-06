import requests
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand
from decimal import Decimal
from Admin.product.models import productModel
from Admin.category.models import categoryModel
from Admin.subcategory.models import brandModel
import time
import re

class Command(BaseCommand):
    help = 'Fetch all products from vibemusic.in and update database'

    def handle(self, *args, **options):
        self.stdout.write('Fetching all products from vibemusic.in...')
        
        # Base URL
        base_url = "https://vibemusic.in/shop/"
        
        try:
            # Fetch webpage
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(base_url, headers=headers)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Parse all products from the page content
            products = self.parse_all_products(soup)
            
            # Update database with fetched products
            self.update_products(products)
            
            self.stdout.write(self.style.SUCCESS(f'Successfully imported {len(products)} products from vibemusic.in'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error fetching products: {str(e)}'))

    def parse_all_products(self, soup):
        """Parse all products from vibemusic.in shop page"""
        products = []
        
        # Find all product sections from the parsed content
        # The content shows products in a specific format with headers
        content_text = soup.get_text()
        
        # Extract product information using regex patterns
        # Pattern to match product name, price, and URL
        product_pattern = r'([A-Z\s&\s;\s]+[A-Za-z\s0-9\s&\s;\.\-]+)\s*\n\[Sale!\s*\n\s*₹([\d,]+)\.00\s*Original price was:\s*₹([\d,]+)\.00\s*₹([\d,]+)\.00Current price is:\s*₹([\d,]+)\.00.\]\s*\n\((https://vibemusic\.in/product/[^\)]+)\)'
        
        matches = re.findall(product_pattern, content_text)
        
        for match in matches:
            if len(match) >= 5:
                product_name = match[1].strip()
                original_price = int(match[2].replace(',', ''))
                sale_price = int(match[3].replace(',', ''))
                current_price = int(match[4].replace(',', ''))
                product_url = match[5]
                
                # Extract product slug from URL
                product_slug = product_url.split('/')[-1] if product_url else ''
                
                # Determine category based on product name
                category = self.determine_category(product_name)
                
                # Download image if available
                image_url = self.download_product_image(product_slug, product_name)
                
                products.append({
                    'name': product_name,
                    'original_price': original_price,
                    'price': current_price,
                    'strike_price': original_price,  # Use original as strike price
                    'description': f'Professional {product_name} imported from Vibe Music',
                    'image_url': image_url,
                    'category': category,
                    'url': product_url,
                    'slug': product_slug
                })
                
        return products

    def determine_category(self, product_name):
        """Determine category based on product name"""
        name_lower = product_name.lower()
        
        if any(keyword in name_lower for keyword in ['microphone', 'mic', 'recorder']):
            return 'Audio Recording'
        elif any(keyword in name_lower for keyword in ['guitar', 'pedal', 'effect', 'lab']):
            return 'Guitar & Effects'
        elif any(keyword in name_lower for keyword in ['mixer', 'interface']):
            return 'Mixing & Interface'
        elif any(keyword in name_lower for keyword in ['drum', 'cymbal', 'clamp', 'holder', 'hardware']):
            return 'Drums & Percussion'
        elif any(keyword in name_lower for keyword in ['amplifier', 'amp']):
            return 'Amplifiers'
        else:
            return 'Audio Equipment'

    def download_product_image(self, product_slug, product_name):
        """Download product image from vibemusic.in"""
        try:
            # Try to get the product page to find the image
            product_url = f"https://vibemusic.in/product/{product_slug}/"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(product_url, headers=headers, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Look for product image
                img_element = soup.find('img', class_='wp-post-image')
                if img_element and img_element.get('src'):
                    return img_element.get('src')
                
                # Fallback to any image in the content
                img_elements = soup.find_all('img')
                for img in img_elements:
                    src = img.get('src')
                    if src and ('product' in src.lower() or product_slug in src.lower()):
                        return src
                        
        except Exception as e:
            print(f"Could not download image for {product_name}: {str(e)}")
            
        # Return placeholder if no image found
        return f"https://via.placeholder.com/300x300/cccccc/000000?text={product_name.replace(' ', '+')}"

    def update_products(self, products):
        """Update database with fetched products"""
        for product_data in products:
            try:
                # Get or create category
                category, created = categoryModel.objects.get_or_create(
                    cat_name=product_data['category'],
                    defaults={'cat_img': 'default_category.jpg'}
                )
                
                # Get or create brand (using 'Vibe Music' as default brand)
                brand, created = brandModel.objects.get_or_create(
                    brand_name='Vibe Music',
                    defaults={'brand_img': 'default_brand.jpg'}
                )
                
                # Check if product already exists
                existing_product = productModel.objects.filter(
                    productname=product_data['name']
                ).first()
                
                if existing_product:
                    # Update existing product
                    existing_product.pro_price = product_data['price']
                    existing_product.strike_price = product_data.get('strike_price')
                    existing_product.pro_description = product_data['description']
                    existing_product.save()
                    print(f"Updated existing product: {product_data['name']}")
                else:
                    # Create new product
                    new_product = productModel.objects.create(
                        catname_id=category,
                        brand=brand,
                        productname=product_data['name'],
                        pro_description=product_data['description'],
                        pro_price=product_data['price'],
                        strike_price=product_data.get('strike_price'),
                        pro_colour='Black',  # Default color
                        total_quantity=15,  # Default quantity
                        return_product='Yes',
                        return_period_days=7
                    )
                    print(f"Created new product: {product_data['name']}")
                    
            except Exception as e:
                print(f"Error updating product {product_data.get('name', 'Unknown')}: {str(e)}")
