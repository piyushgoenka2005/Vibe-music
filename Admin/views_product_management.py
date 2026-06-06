from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.db.models import Q
from django.core.paginator import Paginator
from django.conf import settings
import json
import os
from datetime import datetime


def _to_int(value, default=0):
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default

from Admin.views import admin_login_required
from Admin.product.models import productModel
from Admin.category.models import categoryModel
from Admin.subcategory.models import brandModel
from User.models import add_to_cart
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

@admin_login_required
def product_management(request):
    """Main product management page with real-time features"""
    
    # Get search query
    search_query = request.GET.get('q', '').strip()
    
    # Filter products
    products = productModel.objects.all().select_related('catname_id').order_by('-id')
    
    if search_query:
        products = products.filter(
            Q(productname__icontains=search_query) |
            Q(pro_description__icontains=search_query) |
            Q(catname_id__cat_name__icontains=search_query)
        )
    
    # Pagination
    paginator = Paginator(products, 20)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)
    
    # Get categories for dropdown
    categories = categoryModel.objects.all()
    brands = brandModel.objects.all()
    
    context = {
        'products': page_obj,
        'categories': categories,
        'brands': brands,
        'search_query': search_query,
        'total_products': products.count(),
    }
    
    return render(request, 'admin/product_management.html', context)

class ProductUploadAPI(View):
    """API for real-time product upload"""
    
    @method_decorator(csrf_exempt)
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)
    
    def post(self, request):
        try:
            # Get form data
            product_name = request.POST.get('product_name', '').strip()
            description = request.POST.get('description', '').strip()
            price = request.POST.get('price', '0')
            quantity = request.POST.get('quantity', '0')
            category_id = request.POST.get('category_id')
            brand_id = request.POST.get('brand_id')
            strike_price = request.POST.get('strike_price', '0')
            
            condition = request.POST.get('condition', 'New')
            material = request.POST.get('material', '').strip()
            skill_level = request.POST.get('skill_level', '').strip()
            pro_code = _to_int(request.POST.get('pro_code', '0'))
            color = request.POST.get('color', 'Default').strip()
            
            # Validation
            if not product_name:
                return JsonResponse({'success': False, 'error': 'Product name is required'})
            
            price_value = _to_int(price, default=0)
            quantity_value = _to_int(quantity, default=0)
            strike_price_value = _to_int(strike_price, default=0)

            if price_value <= 0:
                return JsonResponse({'success': False, 'error': 'Valid price is required'})

            if quantity_value < 0:
                return JsonResponse({'success': False, 'error': 'Quantity cannot be negative'})
            
            if not category_id:
                return JsonResponse({'success': False, 'error': 'Category is required'})
            
            # Get category
            try:
                category = categoryModel.objects.get(id=category_id)
            except categoryModel.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Invalid category'})
            
            # Get brand (optional)
            brand = None
            if brand_id:
                try:
                    brand = brandModel.objects.get(id=brand_id)
                except brandModel.DoesNotExist:
                    pass
            
            # Handle image upload
            product_image = None
            if 'product_image' in request.FILES:
                image_file = request.FILES['product_image']
                # Validate image
                if not image_file.name.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                    return JsonResponse({'success': False, 'error': 'Invalid image format'})
                
                # Save image
                product_image = image_file
            
            # Create product
            product = productModel.objects.create(
                productname=product_name,
                pro_description=description,
                pro_price=price_value,
                total_quantity=quantity_value,
                catname_id=category,
                brand=brand,
                strike_price=strike_price_value if strike_price_value > 0 else None,
                pro_colour=color if color else 'Default',
                instrument_condition=condition,
                instrument_material=material,
                skill_level=skill_level,
                pro_code=pro_code if pro_code > 0 else None
            )
            
            # Ensure image file is saved to storage and attached to the model.
            # Some upload flows (tests or certain clients) may not persist file on create,
            # so explicitly save the FieldFile when an uploaded file is present.
            if product_image:
                # Save image explicitly to default storage and attach path to the model.
                # Using default_storage avoids edge cases where FieldFile.save may not
                # persist uploaded streams consistently in some environments.
                from django.core.files.base import ContentFile
                from django.core.files.storage import default_storage
                import os

                filename = f"product_{product.id}_{getattr(product_image, 'name', 'image') }"
                rel_path = os.path.join('Admin', 'ProductImage', 'Main', filename)
                # Ensure file pointer is at start, then read bytes for reliable saves.
                try:
                    product_image.seek(0)
                except Exception:
                    pass
                saved_path = default_storage.save(rel_path, ContentFile(product_image.read()))
                # Attach saved path to model and persist
                product.pro_image.name = saved_path
                product.save()
            # Broadcast real-time update
            channel_layer = get_channel_layer()
            product_data = {
                'id': product.id,
                'name': product.productname,
                'description': product.pro_description,
                'price': float(product.pro_price),
                'quantity': product.total_quantity,
                'category': category.cat_name,
                'brand': brand.brand_name if brand else None,
                'strike_price': float(product.strike_price) if product.strike_price else None,
                'image_url': product.pro_image.url if product.pro_image else None,
                'created_at': datetime.utcnow().isoformat(),
                'action': 'created'
            }
            
            # Send to all WebSocket groups
            async_to_sync(channel_layer.group_send)(
                "admin_dashboard",
                {
                    'type': 'product_update',
                    'data': product_data
                }
            )
            
            async_to_sync(channel_layer.group_send)(
                "inventory_updates",
                {
                    'type': 'inventory_update',
                    'data': product_data
                }
            )
            
            async_to_sync(channel_layer.group_send)(
                "sales_analytics",
                {
                    'type': 'product_added',
                    'data': product_data
                }
            )
            
            return JsonResponse({
                'success': True,
                'message': 'Product uploaded successfully',
                'product': product_data
            })
            
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

class ProductUpdateAPI(View):
    """API for real-time product updates"""
    
    @method_decorator(csrf_exempt)
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)
    
    def post(self, request):
        try:
            product_id = request.POST.get('product_id')
            
            if not product_id:
                return JsonResponse({'success': False, 'error': 'Product ID is required'})
            
            product = get_object_or_404(productModel, id=product_id)
            
            # Update fields
            if 'product_name' in request.POST:
                product.productname = request.POST.get('product_name', '').strip()
            
            if 'description' in request.POST:
                product.pro_description = request.POST.get('description', '').strip()
            
            if 'price' in request.POST:
                price = request.POST.get('price', '0')
                if float(price) > 0:
                    product.pro_price = float(price)
            
            if 'quantity' in request.POST:
                product.total_quantity = int(request.POST.get('quantity', '0'))
            
            if 'category_id' in request.POST:
                try:
                    category = categoryModel.objects.get(id=request.POST.get('category_id'))
                    product.catname_id = category
                except categoryModel.DoesNotExist:
                    return JsonResponse({'success': False, 'error': 'Invalid category'})
            
            if 'brand_id' in request.POST:
                brand_id = request.POST.get('brand_id')
                if brand_id:
                    try:
                        brand = brandModel.objects.get(id=brand_id)
                        product.brand = brand
                    except brandModel.DoesNotExist:
                        pass
                else:
                    product.brand = None
            
            if 'strike_price' in request.POST:
                strike_price = request.POST.get('strike_price', '0')
                product.strike_price = float(strike_price) if strike_price else None
            
            # Handle image update
            if 'product_image' in request.FILES:
                image_file = request.FILES['product_image']
                if image_file.name.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                    # Delete old image if exists
                    if product.pro_image:
                        if default_storage.exists(product.pro_image.name):
                            default_storage.delete(product.pro_image.name)
                    
                    product.pro_image = image_file
            
            product.save()
            
            # Broadcast real-time update
            channel_layer = get_channel_layer()
            product_data = {
                'id': product.id,
                'name': product.productname,
                'description': product.pro_description,
                'price': float(product.pro_price),
                'quantity': product.total_quantity,
                'category': product.catname_id.cat_name,
                'brand': product.brand.brand_name if product.brand else None,
                'strike_price': float(product.strike_price) if product.strike_price else None,
                'image_url': product.pro_image.url if product.pro_image else None,
                'updated_at': datetime.utcnow().isoformat(),
                'action': 'updated'
            }
            
            async_to_sync(channel_layer.group_send)(
                "admin_dashboard",
                {
                    'type': 'product_update',
                    'data': product_data
                }
            )
            
            async_to_sync(channel_layer.group_send)(
                "inventory_updates",
                {
                    'type': 'inventory_update',
                    'data': product_data
                }
            )
            
            return JsonResponse({
                'success': True,
                'message': 'Product updated successfully',
                'product': product_data
            })
            
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

class ProductDeleteAPI(View):
    """API for real-time product deletion"""
    
    @method_decorator(csrf_exempt)
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)
    
    def post(self, request):
        try:
            product_id = request.POST.get('product_id')
            
            if not product_id:
                return JsonResponse({'success': False, 'error': 'Product ID is required'})
            
            product = get_object_or_404(productModel, id=product_id)
            
            # Store product data for WebSocket broadcast
            product_data = {
                'id': product.id,
                'name': product.productname,
                'action': 'deleted'
            }
            
            # Delete image if exists
            if product.pro_image:
                if default_storage.exists(product.pro_image.name):
                    default_storage.delete(product.pro_image.name)
            
            product.delete()
            
            # Broadcast real-time update
            channel_layer = get_channel_layer()
            
            async_to_sync(channel_layer.group_send)(
                "admin_dashboard",
                {
                    'type': 'product_update',
                    'data': product_data
                }
            )
            
            async_to_sync(channel_layer.group_send)(
                "inventory_updates",
                {
                    'type': 'inventory_update',
                    'data': product_data
                }
            )
            
            return JsonResponse({
                'success': True,
                'message': 'Product deleted successfully',
                'product': product_data
            })
            
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

class ProductListAPI(View):
    """API for real-time product listing"""
    
    def get(self, request):
        try:
            search_query = request.GET.get('q', '').strip()
            category_id = request.GET.get('category_id', '')
            page = int(request.GET.get('page', 1))
            
            # Filter products
            products = productModel.objects.all().select_related('catname_id', 'brand').order_by('-id')
            
            if search_query:
                products = products.filter(
                    Q(productname__icontains=search_query) |
                    Q(pro_description__icontains=search_query)
                )
            
            if category_id:
                products = products.filter(catname_id_id=category_id)
            
            # Pagination
            paginator = Paginator(products, 20)
            page_obj = paginator.get_page(page)
            
            # Format product data
            product_list = []
            for product in page_obj:
                description = product.pro_description or ''
                product_data = {
                    'id': product.id,
                    'name': product.productname,
                    'description': description[:100] + '...' if len(description) > 100 else description,
                    'price': float(product.pro_price),
                    'quantity': product.total_quantity,
                    'category': product.catname_id.cat_name,
                    'category_id': product.catname_id.id,
                    'brand': product.brand.brand_name if product.brand else None,
                    'brand_id': product.brand.id if product.brand else None,
                    'strike_price': float(product.strike_price) if product.strike_price else None,
                    'image_url': product.pro_image.url if product.pro_image else None,
                    'created_at': datetime.utcnow().isoformat(),
                    'orders_count': add_to_cart.objects.filter(product_id=product).count()
                }
                product_list.append(product_data)
            
            return JsonResponse({
                'success': True,
                'products': product_list,
                'pagination': {
                    'current_page': page_obj.number,
                    'total_pages': page_obj.paginator.num_pages,
                    'has_next': page_obj.has_next(),
                    'has_previous': page_obj.has_previous(),
                    'total_items': page_obj.paginator.count
                }
            })
            
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})


class ProductDetailAPI(View):
    """API for single product details used by edit modal"""

    def get(self, request, product_id):
        try:
            product = get_object_or_404(productModel.objects.select_related('catname_id', 'brand'), id=product_id)
            return JsonResponse({
                'success': True,
                'product': {
                    'id': product.id,
                    'name': product.productname,
                    'description': product.pro_description or '',
                    'price': float(product.pro_price or 0),
                    'quantity': product.total_quantity or 0,
                    'category': product.catname_id.cat_name if product.catname_id else '',
                    'category_id': product.catname_id.id if product.catname_id else None,
                    'brand': product.brand.brand_name if product.brand else None,
                    'brand_id': product.brand.id if product.brand else None,
                    'strike_price': float(product.strike_price) if product.strike_price else None,
                    'image_url': product.pro_image.url if product.pro_image else None,
                }
            })
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

@csrf_exempt
def bulk_product_upload(request):
    """Handle bulk product upload via CSV/Excel"""
    if request.method == 'POST':
        try:
            # This is a placeholder for bulk upload functionality
            # In a real implementation, you'd parse CSV/Excel files
            return JsonResponse({
                'success': True,
                'message': 'Bulk upload functionality coming soon'
            })
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})
