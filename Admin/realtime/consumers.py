import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from Admin.product.models import productModel
from User.models import add_to_cart, A_User
from datetime import datetime, timedelta
import asyncio
from django.db.models import Count, Sum, Q, Avg
from decimal import Decimal

class AdminDashboardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_authenticated and self.user.is_superuser:
            await self.accept()
            self.admin_group_name = "admin_dashboard"
            
            # Join admin group
            await self.channel_layer.group_add(
                self.admin_group_name,
                self.channel_name
            )
            
            # Send initial data
            await self.send_dashboard_data()
        else:
            await self.close()

    async def disconnect(self close_code):
        # Leave admin group
        if hasattr(self, 'admin_group_name'):
            await self.channel_layer.group_discard(
                self.admin_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')
        
        if message_type == 'refresh_data':
            await self.send_dashboard_data()

    async def send_dashboard_data(self):
        # Get real-time dashboard data
        dashboard_data = await self.get_dashboard_stats()
        
        await self.send(text_data=json.dumps({
            'type': 'dashboard_update',
            'data': dashboard_data
        }))

    @database_sync_to_async
    def get_dashboard_stats(self):
        from django.db.models import Count, Sum, Q
        from datetime import datetime, timedelta
        
        now = datetime.now()
        today = now.date()
        yesterday = today - timedelta(days=1)
        this_month_start = today.replace(day=1)
        
        # Basic stats
        total_products = productModel.objects.count()
        total_users = A_User.objects.count()
        total_orders = add_to_cart.objects.count()
        
        # add_to_cart may not include created_at in legacy databases.
        # Fall back to total orders to keep dashboard responsive.
        if hasattr(add_to_cart, 'created_at'):
            today_orders = add_to_cart.objects.filter(created_at__date=today).count()
        else:
            today_orders = total_orders
        
        if hasattr(add_to_cart, 'created_at'):
            monthly_orders = add_to_cart.objects.filter(created_at__date__gte=this_month_start).count()
        else:
            monthly_orders = total_orders
        
        # Recent activity
        if hasattr(add_to_cart, 'created_at'):
            recent_orders = add_to_cart.objects.select_related('user').order_by('-created_at')[:10]
        else:
            recent_orders = add_to_cart.objects.select_related('user').order_by('-id')[:10]

        recent_users = A_User.objects.order_by('-date_joined')[:5]
        
        # Product stats
        low_stock_products = productModel.objects.filter(
            total_quantity__lt=5
        ).count()
        
        # Top selling products
        top_products = productModel.annotate(
            order_count=Count('add_to_cart')
        ).order_by('-order_count')[:5]
        
        return {
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

class OrderStatusConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_authenticated and self.user.is_superuser:
            await self.accept()
            self.order_group_name = "order_updates"
            
            await self.channel_layer.group_add(
                self.order_group_name,
                self.channel_name
            )
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'order_group_name'):
            await self.channel_layer.group_discard(
                self.order_group_name,
                self.channel_name
            )

    async def order_update(self, event):
        # Send order update to connected admin
        await self.send(text_data=json.dumps({
            'type': 'order_update',
            'data': event['data']
        }))

class InventoryConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_authenticated and self.user.is_superuser:
            await self.accept()
            self.inventory_group_name = "inventory_updates"
            
            await self.channel_layer.group_add(
                self.inventory_group_name,
                self.channel_name
            )
            
            # Send current inventory data
            inventory_data = await self.get_inventory_data()
            await self.send(text_data=json.dumps({
                'type': 'inventory_data',
                'data': inventory_data
            }))
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'inventory_group_name'):
            await self.channel_layer.group_discard(
                self.inventory_group_name,
                self.channel_name
            )

    async def inventory_update(self, event):
        # Send inventory update to connected admin
        await self.send(text_data=json.dumps({
            'type': 'inventory_update',
            'data': event['data']
        }))

    @database_sync_to_async
    def get_inventory_data(self):
        products = productModel.objects.all().order_by('-total_quantity')[:20]

        return [
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
