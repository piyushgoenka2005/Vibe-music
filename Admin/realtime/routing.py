from django.urls import re_path
from . import consumers
from . import enhanced_consumers

websocket_urlpatterns = [
    # Original consumers
    re_path(r'ws/admin/dashboard/$', consumers.AdminDashboardConsumer.as_asgi()),
    re_path(r'ws/admin/orders/$', consumers.OrderStatusConsumer.as_asgi()),
    re_path(r'ws/admin/inventory/$', consumers.InventoryConsumer.as_asgi()),
    
    # Enhanced real-time consumers
    re_path(r'ws/admin/notifications/$', enhanced_consumers.NotificationConsumer.as_asgi()),
    re_path(r'ws/admin/order-tracking/$', enhanced_consumers.OrderTrackingConsumer.as_asgi()),
    re_path(r'ws/admin/user-activity/$', enhanced_consumers.UserActivityConsumer.as_asgi()),
    re_path(r'ws/admin/sales-analytics/$', enhanced_consumers.SalesAnalyticsConsumer.as_asgi()),
    re_path(r'ws/admin/product-management/$', enhanced_consumers.ProductManagementConsumer.as_asgi()),
]
