from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.auth.models import User
from Admin.product.models import productModel
from User.models import add_to_cart, A_User
from datetime import datetime
import json

@receiver(post_save, sender=add_to_cart)
def order_created_signal(sender, instance, created, **kwargs):
    """Send real-time notification when a new order is created"""
    if created:
        channel_layer = get_channel_layer()
        created_ts = getattr(instance, 'created_at', datetime.now())
        
        # Send to order tracking WebSocket
        async_to_sync(channel_layer.group_send)(
            "order_tracking",
            {
                'type': 'order_update',
                'data': {
                    'order_id': instance.id,
                    'user': instance.user.username if instance.user else 'Guest',
                    'product': instance.product_id.productname,
                    'quantity': instance.quantity,
                    'price': float(instance.product_id.pro_price),
                    'total': float(instance.product_id.pro_price * instance.quantity),
                    'status': 'Processing',
                    'created_at': created_ts.isoformat(),
                    'updated_at': created_ts.isoformat()
                }
            }
        )
        
        # Send to notifications WebSocket
        async_to_sync(channel_layer.group_send)(
            "admin_notifications",
            {
                'type': 'notification_broadcast',
                'data': {
                    'id': f"order_{instance.id}",
                    'type': 'info',
                    'title': 'New Order',
                    'message': f'{instance.user.username if instance.user else "Guest"} ordered {instance.product_id.productname}',
                    'timestamp': created_ts.isoformat(),
                    'read': False,
                    'action_url': f'/admin/order/{instance.id}/'
                }
            }
        )
        
        # Send to user activity WebSocket
        async_to_sync(channel_layer.group_send)(
            "user_activity",
            {
                'type': 'user_activity_update',
                'data': {
                    'id': f"order_{instance.id}",
                    'type': 'order_placed',
                    'user': instance.user.username if instance.user else 'Guest',
                    'action': 'Order placed',
                    'timestamp': created_ts.isoformat(),
                    'details': f'{instance.quantity}x {instance.product_id.productname}'
                }
            }
        )
        
        # Send to sales analytics WebSocket
        async_to_sync(channel_layer.group_send)(
            "sales_analytics",
            {
                'type': 'sales_update',
                'data': {
                    'order_id': instance.id,
                    'product_id': instance.product_id.id,
                    'product_name': instance.product_id.productname,
                    'price': float(instance.product_id.pro_price),
                    'quantity': instance.quantity,
                    'total': float(instance.product_id.pro_price * instance.quantity),
                    'category': instance.product_id.catname_id.cat_name if instance.product_id.catname_id else 'Uncategorized',
                    'timestamp': created_ts.isoformat()
                }
            }
        )

@receiver(post_save, sender=productModel)
def product_updated_signal(sender, instance, created, **kwargs):
    """Send real-time notification when product is updated"""
    channel_layer = get_channel_layer()
    
    # Check if stock is low
    if instance.total_quantity < 5:
        async_to_sync(channel_layer.group_send)(
            "admin_notifications",
            {
                'type': 'notification_broadcast',
                'data': {
                    'id': f"stock_{instance.id}",
                    'type': 'warning',
                    'title': 'Low Stock Alert',
                    'message': f'{instance.productname} has only {instance.total_quantity} items left',
                    'timestamp': datetime.now().isoformat(),
                    'read': False,
                    'action_url': f'/admin/product/{instance.id}/'
                }
            }
        )
    
    # Send inventory update
    async_to_sync(channel_layer.group_send)(
        "inventory_updates",
        {
            'type': 'inventory_update',
            'data': {
                'product_id': instance.id,
                'name': instance.productname,
                'stock': instance.total_quantity,
                'price': float(instance.pro_price),
                'category': instance.catname_id.cat_name if instance.catname_id else 'Uncategorized',
                'updated_at': datetime.now().isoformat()
            }
        }
    )

@receiver(post_save, sender=A_User)
def user_created_signal(sender, instance, created, **kwargs):
    """Send real-time notification when a new user registers"""
    if created:
        channel_layer = get_channel_layer()
        created_ts = getattr(instance, 'date_joined', datetime.now())
        
        async_to_sync(channel_layer.group_send)(
            "user_activity",
            {
                'type': 'user_activity_update',
                'data': {
                    'id': f"user_{instance.id}",
                    'type': 'user_registration',
                    'user': instance.username,
                    'action': 'New user registration',
                    'timestamp': created_ts.isoformat(),
                    'details': f'User {instance.username} ({instance.email}) registered'
                }
            }
        )
        
        async_to_sync(channel_layer.group_send)(
            "admin_notifications",
            {
                'type': 'notification_broadcast',
                'data': {
                    'id': f"user_{instance.id}",
                    'type': 'success',
                    'title': 'New User Registration',
                    'message': f'{instance.username} ({instance.email}) has registered',
                    'timestamp': created_ts.isoformat(),
                    'read': False,
                    'action_url': f'/admin/user/{instance.id}/'
                }
            }
        )

@receiver(post_delete, sender=add_to_cart)
def order_deleted_signal(sender, instance, **kwargs):
    """Send real-time notification when an order is deleted"""
    channel_layer = get_channel_layer()
    
    async_to_sync(channel_layer.group_send)(
        "order_tracking",
        {
            'type': 'order_update',
            'data': {
                'order_id': instance.id,
                'status': 'Cancelled',
                'updated_at': datetime.now().isoformat()
            }
        }
    )
