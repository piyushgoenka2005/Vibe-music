import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from Admin.product.models import productModel
from User.models import add_to_cart, A_User
from datetime import datetime, timedelta
from django.db.models import Count, Sum, Q, Avg
from decimal import Decimal
import asyncio

class NotificationConsumer(AsyncWebsocketConsumer):
    """Real-time notification system for admin"""
    
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_authenticated and self.user.is_superuser:
            await self.accept()
            self.notification_group_name = "admin_notifications"
            
            await self.channel_layer.group_add(
                self.notification_group_name,
                self.channel_name
            )
            
            # Send initial notifications
            await self.send_initial_notifications()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'notification_group_name'):
            await self.channel_layer.group_discard(
                self.notification_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'mark_read':
            await self.mark_notification_read(data.get('notification_id'))
        elif message_type == 'clear_all':
            await self.clear_all_notifications()

    async def send_initial_notifications(self):
        notifications = await self.get_unread_notifications()
        await self.send(text_data=json.dumps({
            'type': 'notifications_update',
            'data': notifications
        }))

    async def notification_broadcast(self, event):
        """Broadcast new notification to all connected admins"""
        await self.send(text_data=json.dumps({
            'type': 'new_notification',
            'data': event['data']
        }))

    @database_sync_to_async
    def get_unread_notifications(self):
        # Get recent system events as notifications
        notifications = []
        
        # Low stock alerts
        low_stock_products = productModel.objects.filter(total_quantity__lt=5)
        for product in low_stock_products:
            notifications.append({
                'id': f"stock_{product.id}",
                'type': 'warning',
                'title': 'Low Stock Alert',
                'message': f'{product.productname} has only {product.total_quantity} items left',
                'timestamp': datetime.now().isoformat(),
                'read': False,
                'action_url': f'/admin/product/{product.id}/'
            })
        
        # Recent orders
        recent_orders = add_to_cart.objects.filter(
            created_at__gte=datetime.now() - timedelta(hours=1)
        ).select_related('user', 'product_id')
        
        for order in recent_orders:
            notifications.append({
                'id': f"order_{order.id}",
                'type': 'info',
                'title': 'New Order',
                'message': f'{order.user.username if order.user else "Guest"} ordered {order.product_id.productname}',
                'timestamp': order.created_at.isoformat(),
                'read': False,
                'action_url': f'/admin/order/{order.id}/'
            })
        
        return sorted(notifications, key=lambda x: x['timestamp'], reverse=True)[:10]

    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        # In a real implementation, you'd save this to database
        pass

    @database_sync_to_async
    def clear_all_notifications(self):
        # In a real implementation, you'd clear all notifications for this user
        pass

class OrderTrackingConsumer(AsyncWebsocketConsumer):
    """Real-time order tracking and status updates"""
    
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_authenticated and self.user.is_superuser:
            await self.accept()
            self.order_group_name = "order_tracking"
            
            await self.channel_layer.group_add(
                self.order_group_name,
                self.channel_name
            )
            
            # Send initial order data
            await self.send_order_updates()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'order_group_name'):
            await self.channel_layer.group_discard(
                self.order_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data.get('type') == 'update_order_status':
            updated = await self.update_order_status_record(data.get('order_id'), data.get('status'))
            if updated:
                await self.channel_layer.group_send(
                    "order_tracking",
                    {
                        'type': 'order_update',
                        'data': {
                            'order_id': data.get('order_id'),
                            'status': data.get('status'),
                            'updated_at': datetime.now().isoformat()
                        }
                    }
                )

    async def send_order_updates(self):
        order_data = await self.get_order_statistics()
        await self.send(text_data=json.dumps({
            'type': 'order_updates',
            'data': order_data
        }))

    async def order_update(self, event):
        """Handle real-time order updates"""
        await self.send(text_data=json.dumps({
            'type': 'order_status_update',
            'data': event['data']
        }))

    @database_sync_to_async
    def get_order_statistics(self):
        now = datetime.now()
        today = now.date()
        this_month_start = today.replace(day=1)
        last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
        
        # Order statistics
        today_orders = add_to_cart.objects.filter(created_at__date=today)
        monthly_orders = add_to_cart.objects.filter(created_at__date__gte=this_month_start)
        last_month_orders = add_to_cart.objects.filter(
            created_at__date__gte=last_month_start,
            created_at__date__lt=this_month_start
        )
        
        # Revenue calculations
        today_revenue = today_orders.aggregate(
            total=Sum('product_id__pro_price')
        )['total'] or Decimal('0')
        
        monthly_revenue = monthly_orders.aggregate(
            total=Sum('product_id__pro_price')
        )['total'] or Decimal('0')
        
        # Order status breakdown
        recent_orders = add_to_cart.objects.select_related('user', 'product_id').order_by('-created_at')[:20]
        
        return {
            'today_stats': {
                'count': today_orders.count(),
                'revenue': float(today_revenue),
                'average_order': float(today_revenue / max(today_orders.count(), 1))
            },
            'monthly_stats': {
                'count': monthly_orders.count(),
                'revenue': float(monthly_revenue),
                'average_order': float(monthly_revenue / max(monthly_orders.count(), 1))
            },
            'growth': {
                'orders_growth': self.calculate_growth(monthly_orders.count(), last_month_orders.count()),
                'revenue_growth': self.calculate_growth(float(monthly_revenue), float(last_month_orders.aggregate(total=Sum('product_id__pro_price'))['total'] or Decimal('0')))
            },
            'recent_orders': [
                {
                    'id': order.id,
                    'user': order.user.username if order.user else 'Guest',
                    'product': order.product_id.productname,
                    'quantity': order.quantity,
                    'price': float(order.product_id.pro_price),
                    'total': float(order.product_id.pro_price * order.quantity),
                    'status': 'Processing',  # You would track actual status
                    'created_at': order.created_at.isoformat(),
                    'updated_at': order.created_at.isoformat()
                }
                for order in recent_orders
            ]
        }

    def calculate_growth(self, current, previous):
        if previous == 0:
            return 100 if current > 0 else 0
        return round(((current - previous) / previous) * 100, 2)

    @database_sync_to_async
    def update_order_status_record(self, order_id, status):
        try:
            add_to_cart.objects.get(id=order_id)
            # In a real implementation, you'd update the order status
            # order.status = status
            # order.save()
            return True
        except add_to_cart.DoesNotExist:
            return False

class UserActivityConsumer(AsyncWebsocketConsumer):
    """Real-time user activity monitoring"""
    
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_authenticated and self.user.is_superuser:
            await self.accept()
            self.activity_group_name = "user_activity"
            
            await self.channel_layer.group_add(
                self.activity_group_name,
                self.channel_name
            )
            
            # Send initial activity data
            await self.send_activity_data()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'activity_group_name'):
            await self.channel_layer.group_discard(
                self.activity_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data.get('type') == 'refresh_activity':
            await self.send_activity_data()

    async def send_activity_data(self):
        activity_data = await self.get_user_activity()
        activity_data['top_users'] = await self.get_top_users()
        await self.send(text_data=json.dumps({
            'type': 'activity_update',
            'data': activity_data
        }))

    async def user_activity_update(self, event):
        """Handle real-time user activity updates"""
        await self.send(text_data=json.dumps({
            'type': 'new_activity',
            'data': event['data']
        }))

    @database_sync_to_async
    def get_user_activity(self):
        now = datetime.now()
        
        # Recent user registrations
        recent_users = A_User.objects.filter(
            created_at__gte=now - timedelta(hours=24)
        ).order_by('-created_at')[:10]
        
        # Active users (users with orders in last 24 hours)
        active_users = add_to_cart.objects.filter(
            created_at__gte=now - timedelta(hours=24)
        ).values_list('user__username', flat=True).distinct()
        
        # User sessions (simplified - in real implementation you'd track actual sessions)
        total_users = A_User.objects.count()
        online_users = active_users.count()
        
        # Recent activity log
        recent_activity = []
        
        # Recent registrations
        for user in recent_users:
            recent_activity.append({
                'id': f"user_{user.id}",
                'type': 'user_registration',
                'user': user.username,
                'action': 'New user registration',
                'timestamp': user.created_at.isoformat(),
                'details': f'User {user.username} ({user.email}) registered'
            })
        
        # Recent orders
        recent_orders = add_to_cart.objects.select_related('user', 'product_id').order_by('-created_at')[:10]
        for order in recent_orders:
            recent_activity.append({
                'id': f"order_{order.id}",
                'type': 'order_placed',
                'user': order.user.username if order.user else 'Guest',
                'action': 'Order placed',
                'timestamp': order.created_at.isoformat(),
                'details': f'{order.quantity}x {order.product_id.productname}'
            })
        
        # Sort by timestamp
        recent_activity.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return {
            'user_stats': {
                'total_users': total_users,
                'online_users': online_users,
                'new_users_today': recent_users.count(),
                'active_rate': round((online_users / max(total_users, 1)) * 100, 2)
            },
            'recent_activity': recent_activity[:20]
        }

    @database_sync_to_async
    def get_top_users(self):
        # Get users with most orders
        top_users = A_User.annotate(
            order_count=Count('add_to_cart'),
            total_spent=Sum('add_to_cart__product_id__pro_price')
        ).filter(order_count__gt=0).order_by('-order_count')[:10]
        
        return [
            {
                'username': user.username,
                'email': user.email,
                'orders': user.order_count,
                'spent': float(user.total_spent or 0),
                'joined': user.created_at.isoformat()
            }
            for user in top_users
        ]

class SalesAnalyticsConsumer(AsyncWebsocketConsumer):
    """Real-time sales analytics dashboard"""
    
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_authenticated and self.user.is_superuser:
            await self.accept()
            self.analytics_group_name = "sales_analytics"
            
            await self.channel_layer.group_add(
                self.analytics_group_name,
                self.channel_name
            )
            
            # Send initial analytics data
            await self.send_analytics_data()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'analytics_group_name'):
            await self.channel_layer.group_discard(
                self.analytics_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data.get('type') == 'refresh_analytics':
            await self.send_analytics_data()
        elif data.get('type') == 'get_period_data':
            await self.send_period_data(data.get('period', '7d'))

    async def send_analytics_data(self):
        analytics_data = await self.get_sales_analytics()
        analytics_data['conversion_metrics'] = await self.get_conversion_metrics()
        await self.send(text_data=json.dumps({
            'type': 'analytics_update',
            'data': analytics_data
        }))

    async def sales_update(self, event):
        """Handle real-time sales updates"""
        await self.send(text_data=json.dumps({
            'type': 'new_sale',
            'data': event['data']
        }))

    @database_sync_to_async
    def get_sales_analytics(self):
        now = datetime.now()
        
        # Daily sales for last 30 days
        daily_sales = []
        for i in range(30):
            date = (now - timedelta(days=i)).date()
            orders = add_to_cart.objects.filter(created_at__date=date)
            revenue = orders.aggregate(total=Sum('product_id__pro_price'))['total'] or Decimal('0')
            
            daily_sales.append({
                'date': date.isoformat(),
                'orders': orders.count(),
                'revenue': float(revenue)
            })
        
        # Category performance
        category_performance = []
        from Admin.category.models import categoryModel
        
        for category in categoryModel.objects.all():
            category_orders = add_to_cart.objects.filter(product_id__catname_id=category)
            revenue = category_orders.aggregate(total=Sum('product_id__pro_price'))['total'] or Decimal('0')
            
            if category_orders.count() > 0:
                category_performance.append({
                    'category': category.cat_name,
                    'orders': category_orders.count(),
                    'revenue': float(revenue),
                    'avg_order_value': float(revenue / category_orders.count())
                })
        
        # Top products
        top_products = productModel.annotate(
            orders_count=Count('add_to_cart'),
            revenue=Sum('add_to_cart__product_id__pro_price')
        ).filter(orders_count__gt=0).order_by('-revenue')[:10]
        
        # Sales trends
        this_month = now.replace(day=1)
        last_month = (this_month - timedelta(days=1)).replace(day=1)
        
        this_month_orders = add_to_cart.objects.filter(created_at__date__gte=this_month)
        last_month_orders = add_to_cart.objects.filter(
            created_at__date__gte=last_month,
            created_at__date__lt=this_month
        )
        
        return {
            'daily_sales': list(reversed(daily_sales)),
            'category_performance': sorted(category_performance, key=lambda x: x['revenue'], reverse=True),
            'top_products': [
                {
                    'name': product.productname,
                    'orders': product.orders_count,
                    'revenue': float(product.revenue or 0),
                    'category': product.catname_id.cat_name if product.catname_id else 'Uncategorized'
                }
                for product in top_products
            ],
            'monthly_comparison': {
                'this_month': {
                    'orders': this_month_orders.count(),
                    'revenue': float(this_month_orders.aggregate(total=Sum('product_id__pro_price'))['total'] or Decimal('0'))
                },
                'last_month': {
                    'orders': last_month_orders.count(),
                    'revenue': float(last_month_orders.aggregate(total=Sum('product_id__pro_price'))['total'] or Decimal('0'))
                }
            }
        }

    @database_sync_to_async
    def get_conversion_metrics(self):
        total_users = A_User.objects.count()
        users_with_orders = add_to_cart.objects.values('user').distinct().count()
        
        return {
            'registration_to_order_rate': round((users_with_orders / max(total_users, 1)) * 100, 2),
            'total_conversions': users_with_orders,
            'total_visitors': total_users  # Simplified - using registrations as proxy
        }

class ProductManagementConsumer(AsyncWebsocketConsumer):
    """Real-time product management WebSocket consumer"""
    
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_authenticated and self.user.is_superuser:
            await self.accept()
            self.product_group_name = "product_management"
            
            await self.channel_layer.group_add(
                self.product_group_name,
                self.channel_name
            )
            
            # Send initial product data
            await self.send_product_data()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'product_group_name'):
            await self.channel_layer.group_discard(
                self.product_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'refresh_products':
            await self.send_product_data()
        elif message_type == 'search_products':
            products = await self.search_products_data(data.get('query', ''))
            await self.send(text_data=json.dumps({
                'type': 'search_results',
                'data': products
            }))
        elif message_type == 'filter_by_category':
            products = await self.filter_by_category_data(data.get('category_id', ''))
            await self.send(text_data=json.dumps({
                'type': 'filter_results',
                'data': products
            }))

    async def send_product_data(self):
        product_data = await self.get_product_statistics()
        await self.send(text_data=json.dumps({
            'type': 'product_data_update',
            'data': product_data
        }))

    async def product_update(self, event):
        """Handle real-time product updates"""
        await self.send(text_data=json.dumps({
            'type': 'product_update',
            'data': event['data']
        }))

    @database_sync_to_async
    def get_product_statistics(self):
        from django.db.models import Count, Sum, Q
        from datetime import datetime, timedelta
        from Admin.category.models import categoryModel
        
        now = datetime.now()
        
        # Basic product stats
        total_products = productModel.objects.count()
        low_stock_products = productModel.objects.filter(total_quantity__lt=5).count()
        out_of_stock_products = productModel.objects.filter(total_quantity__lte=0).count()
        
        # Recent products
        if hasattr(productModel, 'created_at'):
            recent_products = productModel.objects.select_related('catname_id', 'brand').order_by('-created_at')[:10]
        else:
            recent_products = productModel.objects.select_related('catname_id', 'brand').order_by('-id')[:10]
        
        # Category distribution
        category_stats = {}
        for category in categoryModel.objects.all():
            product_count = productModel.objects.filter(catname_id=category).count()
            if product_count > 0:
                category_stats[category.cat_name] = product_count
        
        # Top selling products
        top_products = productModel.annotate(
            order_count=Count('add_to_cart')
        ).filter(order_count__gt=0).order_by('-order_count')[:5]
        
        return {
            'total_products': total_products,
            'low_stock_products': low_stock_products,
            'out_of_stock_products': out_of_stock_products,
            'recent_products': [
                {
                    'id': product.id,
                    'name': product.productname,
                    'price': float(product.pro_price),
                    'quantity': product.total_quantity,
                    'category': product.catname_id.cat_name,
                    'brand': product.brand.brand_name if product.brand else None,
                    'created_at': getattr(product, 'created_at', now).isoformat()
                }
                for product in recent_products
            ],
            'category_stats': category_stats,
            'top_products': [
                {
                    'id': product.id,
                    'name': product.productname,
                    'price': float(product.pro_price),
                    'orders': product.order_count
                }
                for product in top_products
            ],
            'last_updated': now.isoformat()
        }

    @database_sync_to_async
    def search_products_data(self, query):
        products = productModel.objects.filter(
            Q(productname__icontains=query) |
            Q(pro_description__icontains=query) |
            Q(catname_id__cat_name__icontains=query)
        ).select_related('catname_id', 'brand')[:20]

        return [
            {
                'id': product.id,
                'name': product.productname,
                'price': float(product.pro_price),
                'quantity': product.total_quantity,
                'category': product.catname_id.cat_name,
                'brand': product.brand.brand_name if product.brand else None
            }
            for product in products
        ]

    @database_sync_to_async
    def filter_by_category_data(self, category_id):
        products = productModel.objects.filter(catname_id_id=category_id).select_related('catname_id', 'brand')[:20]

        return [
            {
                'id': product.id,
                'name': product.productname,
                'price': float(product.pro_price),
                'quantity': product.total_quantity,
                'category': product.catname_id.cat_name,
                'brand': product.brand.brand_name if product.brand else None
            }
            for product in products
        ]
