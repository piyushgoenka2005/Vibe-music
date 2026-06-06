from django.shortcuts import render
from Admin.views import admin_login_required
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
import json

@admin_login_required
def realtime_dashboard(request):
    """Real-time admin dashboard view"""
    return render(request, 'admin/realtime_dashboard.html')

@admin_login_required
def enhanced_realtime_dashboard(request):
    """Enhanced real-time admin dashboard view"""
    return render(request, 'admin/enhanced_realtime_dashboard.html')

class DashboardDataAPI(View):
    """API endpoint for dashboard data"""
    
    @method_decorator(csrf_exempt)
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)
    
    def get(self, request):
        """Get dashboard statistics"""
        from django.db.models import Count, Sum, Q
        from datetime import datetime, timedelta
        from Admin.product.models import productModel
        from User.models import add_to_cart, A_User
        
        now = datetime.now()
        today = now.date()
        yesterday = today - timedelta(days=1)
        this_month_start = today.replace(day=1)
        
        # Basic stats
        total_products = productModel.objects.count()
        total_users = A_User.objects.count()
        total_orders = add_to_cart.objects.count()
        
        # Legacy model compatibility: use created_at filters only when available.
        if hasattr(add_to_cart, 'created_at'):
            today_orders = add_to_cart.objects.filter(created_at__date=today).count()
            monthly_orders = add_to_cart.objects.filter(created_at__date__gte=this_month_start).count()
            recent_orders = add_to_cart.objects.select_related('user', 'product_id').order_by('-created_at')[:10]
        else:
            today_orders = total_orders
            monthly_orders = total_orders
            recent_orders = add_to_cart.objects.select_related('user', 'product_id').order_by('-id')[:10]

        recent_users = A_User.objects.order_by('-date_joined')[:5]
        
        # Product stats
        low_stock_products = productModel.objects.filter(
            total_quantity__lt=5
        ).count()
        
        # Top selling products
        top_products = productModel.annotate(
            order_count=Count('add_to_cart')
        ).order_by('-order_count')[:5]
        
        data = {
            'total_products': total_products,
            'total_users': total_users,
            'total_orders': total_orders,
            'today_orders': today_orders,
            'monthly_orders': monthly_orders,
            'low_stock_products': low_stock_products,
            'recent_orders': [
                {
                    'id': order.id,
                    'user': order.user.username if order.user else 'Guest',
                    'product': order.product_id.productname,
                    'quantity': order.quantity,
                    'created_at': getattr(order, 'created_at', now).strftime('%Y-%m-%d %H:%M:%S')
                }
                for order in recent_orders
            ],
            'recent_users': [
                {
                    'username': user.username,
                    'email': user.email,
                    'created_at': user.date_joined.strftime('%Y-%m-%d %H:%M:%S')
                }
                for user in recent_users
            ],
            'top_products': [
                {
                    'name': product.productname,
                    'price': float(product.pro_price),
                    'stock': product.total_quantity,
                    'orders': product.order_count
                }
                for product in top_products
            ],
            'last_updated': now.strftime('%Y-%m-%d %H:%M:%S')
        }
        
        return JsonResponse(data)

class InventoryAPI(View):
    """API endpoint for inventory data"""
    
    @method_decorator(csrf_exempt)
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)
    
    def get(self, request):
        """Get inventory data"""
        from Admin.product.models import productModel
        from datetime import datetime
        
        products = productModel.objects.select_related('catname_id').order_by('-total_quantity')[:20]
        
        data = [
            {
                'id': product.id,
                'name': product.productname,
                'stock': product.total_quantity,
                'price': float(product.pro_price),
                'category': product.catname_id.cat_name if product.catname_id else 'Uncategorized',
                'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            for product in products
        ]
        
        return JsonResponse({'data': data})

@csrf_exempt
def update_product_stock(request):
    """Update product stock via API"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            product_id = data.get('product_id')
            new_stock = data.get('stock')
            
            from Admin.product.models import productModel
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            
            product = productModel.objects.get(id=product_id)
            product.total_quantity = new_stock
            product.save()
            
            # Send WebSocket notification
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                'inventory_updates',
                {
                    'type': 'inventory_update',
                    'data': {
                        'product_id': product.id,
                        'name': product.productname,
                        'stock': new_stock,
                        'updated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    }
                }
            )
            
            return JsonResponse({'success': True, 'message': 'Stock updated successfully'})
            
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})
