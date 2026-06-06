from django.core.management.base import BaseCommand
from Admin.product.models import productModel
from Admin.category.models import categoryModel
from Admin.subcategory.models import brandModel

class Command(BaseCommand):
    help = 'Import all products from vibemusic.in manually'

    def handle(self, *args, **options):
        self.stdout.write('Importing products from vibemusic.in...')
        
        # Manual product data from vibemusic.in/shop/
        products_data = [
            {
                'name': 'AVUS- THUDSTORM 16" CYMBAL',
                'price': 9175,
                'strike_price': 9675,
                'category': 'Drums & Percussion',
                'description': 'Professional 16" cymbal with premium sound quality',
                'slug': 'avus-thudstorm-16-cymbal'
            },
            {
                'name': 'Zoom GCE-3 Guitar Lab Circuit Emulator Pocket-Sized. Unlimited Effects.',
                'price': 11799,
                'strike_price': 12498,
                'category': 'Guitar & Effects',
                'description': 'Pocket-sized guitar circuit emulator with unlimited effects',
                'slug': 'zoom-gce-3-guitar-lab-circuit-emulator'
            },
            {
                'name': 'ZOOM L-12 (L12) LiveTrak Mixer/Recorder',
                'price': 79320,
                'strike_price': 83820,
                'category': 'Mixing & Interface',
                'description': 'Professional 12-channel mixer and recorder',
                'slug': 'zoom-l-12-livetrak-mixer-recorder'
            },
            {
                'name': 'Zoom PodTrak P2 USB Mic Recorder',
                'price': 11999,
                'strike_price': 12733,
                'category': 'Audio Recording',
                'description': 'USB microphone recorder for podcasting and streaming',
                'slug': 'zoom-podtrak-p2-usb-mic-recorder'
            },
            {
                'name': 'ZOOM SGV-6 Vocal Mic for V6 and V3 Vocal Processors',
                'price': 11000,
                'strike_price': 11883,
                'category': 'Audio Recording',
                'description': 'Professional vocal microphone for vocal processors',
                'slug': 'zoom-sgv-6-vocal-mic'
            },
            {
                'name': 'ZOOM H6studio Handy Recorder',
                'price': 46999,
                'strike_price': 49112,
                'category': 'Audio Recording',
                'description': 'Professional handheld recorder with studio quality',
                'slug': 'zoom-h6studio-handy-recorder'
            },
            {
                'name': 'Zoom F1-LP Field Recorder and Lavalier Microphone',
                'price': 18500,
                'strike_price': 19661,
                'category': 'Audio Recording',
                'description': 'Field recorder with lavalier microphone kit',
                'slug': 'zoom-f1-lp-field-recorder'
            },
            {
                'name': 'ZOOM PodTrak P8',
                'price': 39000,
                'strike_price': 41709,
                'category': 'Audio Recording',
                'description': 'Professional 8-channel podcast recorder',
                'slug': 'zoom-podtrak-p8'
            },
            {
                'name': 'Zoom PodTrak P4next Audio Interface',
                'price': 19500,
                'strike_price': 20251,
                'category': 'Mixing & Interface',
                'description': 'Next-generation audio interface for recording',
                'slug': 'zoom-podtrak-p4next-audio-interface'
            },
            {
                'name': 'ZOOM ZUM-2 Plug & Play USB Microphone',
                'price': 3475,
                'strike_price': 3675,
                'category': 'Audio Recording',
                'description': 'Plug and play USB microphone for easy recording',
                'slug': 'zoom-zum-2-usb-microphone'
            },
            {
                'name': 'Zoom R12 MultiTrak Recorder with Touchscreen',
                'price': 38000,
                'strike_price': 40382,
                'category': 'Audio Recording',
                'description': 'Multi-track recorder with touchscreen interface',
                'slug': 'zoom-r12-multitrak-recorder'
            },
            {
                'name': 'Zoom Am7 Rotating Mid-Side Stereo Microphone for Android',
                'price': 11100,
                'strike_price': 11760,
                'category': 'Audio Recording',
                'description': 'Rotating stereo microphone for Android devices',
                'slug': 'zoom-am7-stereo-microphone-android'
            },
            {
                'name': 'Boss RV-500 Reverb Pedal',
                'price': 47000,
                'strike_price': 51747,
                'category': 'Guitar & Effects',
                'description': 'Professional reverb effects pedal',
                'slug': 'boss-rv-500-reverb-pedal'
            },
            {
                'name': 'Gibraltar SC-SBLAM L-Arm Tom Holder Clamp',
                'price': 5360,
                'strike_price': 5660,
                'category': 'Drums & Percussion',
                'description': 'L-arm tom holder clamp for drum kits',
                'slug': 'gibraltar-sc-sblam-tom-holder-clamp'
            },
            {
                'name': 'Gibraltar SC-LBBT 18" Cymbal Boom Arm with Gearless Brake Tilter',
                'price': 6788,
                'strike_price': 7138,
                'category': 'Drums & Percussion',
                'description': '18" cymbal boom arm with gearless brake tilter',
                'slug': 'gibraltar-sc-lbbt-cymbal-boom-arm'
            },
            {
                'name': 'Gibraltar SC-GRSRA 1.5" Black Right Angle Drum Rack Clamp',
                'price': 0,  # No price shown
                'strike_price': 0,
                'category': 'Drums & Percussion',
                'description': 'Right angle drum rack clamp for mounting hardware',
                'slug': 'gibraltar-sc-grsra-drum-rack-clamp'
            },
            {
                'name': 'Gibraltar SC-GRSQS 1.5" Black Quick Set Adjustable Drum Rack Clamp',
                'price': 4575,
                'strike_price': 4975,
                'category': 'Drums & Percussion',
                'description': 'Quick set adjustable drum rack clamp',
                'slug': 'gibraltar-sc-grsqs-drum-rack-clamp'
            },
            {
                'name': 'Gibraltar SC-HCW10 Hardware Cleaning Wipes, 10 Pack',
                'price': 0,  # No price shown
                'strike_price': 0,
                'category': 'Drums & Percussion',
                'description': 'Hardware cleaning wipes for drum equipment',
                'slug': 'gibraltar-hcw10-cleaning-wipes'
            }
        ]
        
        imported_count = 0
        for product_data in products_data:
            try:
                # Get or create category
                category, created = categoryModel.objects.get_or_create(
                    cat_name=product_data['category'],
                    defaults={'cat_img': 'default_category.jpg'}
                )
                
                # Get or create brand (using 'Vibe Music' as default brand)
                brand, created = brandModel.objects.get_or_create(
                    brand_name='Vibe Music'
                )
                
                # Check if product already exists
                existing_product = productModel.objects.filter(
                    productname=product_data['name']
                ).first()
                
                if existing_product:
                    # Update existing product
                    existing_product.pro_price = product_data['price']
                    existing_product.strike_price = product_data.get('strike_price', 0)
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
                        strike_price=product_data.get('strike_price', 0),
                        pro_colour='Black',  # Default color
                        total_quantity=15,  # Default quantity
                        return_product='Yes',
                        return_period_days=7
                    )
                    print(f"Created new product: {product_data['name']}")
                    imported_count += 1
                    
            except Exception as e:
                print(f"Error importing product {product_data.get('name', 'Unknown')}: {str(e)}")
        
        self.stdout.write(self.style.SUCCESS(f'Successfully imported {imported_count} new products from vibemusic.in'))
