from django.contrib.auth import views as auth_views
from django.urls import path

from .views import *
from Admin.product.views import filter_products_by_price

urlpatterns = [
    path('classify-image/', classify_image, name='classify-image'),
    path('api/classify-image/', classify_image_api, name='classify-image-api'),

    path('', home, name="home"),
    path('filter-products/', filter_products_by_price, name='filter_products_by_price'),
    path('tracker/', tracker, name='tracker'),
    path('change-password/', change_password, name='change_passwordd'),
    path('accounts/login/', login_attempt, name="login_attempt"),
    path('logout/', logout, name='logout'),

    path('register/', register_attempt, name="register_attempt"),
    path('token', token_send, name="token_send"),
    path('verify/<auth_token>', verify, name="verify"),

    path('password-reset/', forget_password, name="password_resett"),

    path('quickview/', quickview),
    path('quickview1/', quickviesw),

    path('category/<int:hid>', category),
    path('category/', cat_page),

    path('product/<int:pid>', product),
    path('product/', pro_page),

    path('dashboard/', dashboard),

    path('address/', address),

    path('orderrrr/', myorderrr),
    path('myaccount/', myaccount),
    # Header/Top bar informational sections
    path('used/', used_gear, name='used_gear'),
    path('integration/', integration_page, name='integration_page'),
    path('studios/', studios_page, name='studios_page'),
    path('content-creators/', content_creators_page, name='content_creators'),
    path('home-audio/', home_audio_page, name='home_audio'),
    path('house-of-worship/', house_of_worship_page, name='house_of_worship'),
    path('immersive/', immersive_page, name='immersive'),
    path('address/updete/', updateaddress),
    path('address/remove/', remove_address),

    path('myorder/', myorder),
    path('order/<int:hid>/<int:sid>', myorder1),

    path('gocart/', gocart),
    path('cart/', addCart),
    path('review/', review),

    path('checkout/', checkouut),
    path('success/', payment_status, name='payment_status'),

    path('password-reset-confirm/<uidb64>/<token>/',
         auth_views.PasswordResetConfirmView.as_view(
             template_name='user/password_reset_confirm.html',
             success_url='/user/password-reset-complete/'
         ),
         name='password_reset_confirmm'
         ),

    path('password-reset-complete/',
         auth_views.PasswordResetCompleteView.as_view(
             template_name='user/password_reset_complete.html'
         ),
         name='password_reset_complete'
         ),

]

# handler404 = 'User.views.error_404'
