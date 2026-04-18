"""ecommerce URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an implogin_timerort:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib.auth import views as auth_views
from django.urls import path, include

from .views import *
from . import views_realtime
from . import views_product_management

urlpatterns = [
    path('', dashboard),
    path('realtime/', views_realtime.realtime_dashboard, name='realtime_dashboard'),
    path('enhanced-realtime/', views_realtime.enhanced_realtime_dashboard, name='enhanced_realtime_dashboard'),
    path('product-management/', views_product_management.product_management, name='product_management'),
    path('api/product-upload/', views_product_management.ProductUploadAPI.as_view(), name='product_upload_api'),
    path('api/product-update/', views_product_management.ProductUpdateAPI.as_view(), name='product_update_api'),
    path('api/product-delete/', views_product_management.ProductDeleteAPI.as_view(), name='product_delete_api'),
    path('api/products/', views_product_management.ProductListAPI.as_view(), name='product_list_api'),
    path('api/products/<int:product_id>/', views_product_management.ProductDetailAPI.as_view(), name='product_detail_api'),
    path('api/bulk-upload/', views_product_management.bulk_product_upload, name='bulk_upload_api'),
    path('api/dashboard/', views_realtime.DashboardDataAPI.as_view(), name='dashboard_api'),
    path('api/inventory/', views_realtime.InventoryAPI.as_view(), name='inventory_api'),
    path('api/update-stock/', views_realtime.update_product_stock, name='update_stock_api'),
    path('login_timer/', some_view),
    path('loginurl/', geturl),
    path('logout/', logout),
    path('category/', include('Admin.category.urls')),
    path('brand/', include('Admin.subcategory.urls')),
    path('product/', include('Admin.product.urls')),
    path('slider/', include('Admin.slider.urls')),
    path('filter/', include('Admin.filter.urls')),
    path('order/', include('Admin.order.urls')),
    path('address/', include('Admin.address_master.urls')),
    path('accounts/login/', login_attempt, name='login'),
    path('logoutt/',
         auth_views.LogoutView.as_view(),
         name='logout'
         ),
    path(
        'change-password/',
        auth_views.PasswordChangeView.as_view(
            template_name='admin/change-password-1.html',
            success_url='/admin/',
        ),
        name='change_password'
    ),

    path('password-reset/', passwardd,
         name='password_reset'
         ),

    path('password-reset-confirm/<uidb64>/<token>/',
         auth_views.PasswordResetConfirmView.as_view(
             template_name='admin/password_reset_confirm.html',
             success_url='/admin/password-reset-complete/'
         ),
         name='password_reset_confirma'
         ),

    path('password-reset-complete/',
         auth_views.PasswordResetCompleteView.as_view(
             template_name='admin/password_reset_complete.html'
         ),
         name='password_reset_complete'
         ),
]
