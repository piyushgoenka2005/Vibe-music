"""music_club URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path,include, re_path
from django.shortcuts import redirect
from django.conf import settings
from django.contrib import admin
from User.views import home, myaccount
from django.views.static import serve

urlpatterns = [

    path('', home ),
    # legacy link used in templates: redirect to the user category listing
    path('shop/by-category/', lambda request: redirect('/user/category/')),
    path('admin_side/', admin.site.urls),
    path('user/', include('User.urls')),
    path('admin/', include('Admin.urls')),
    path('myaccount/', myaccount),
    path('login/', lambda request: redirect('/user/accounts/login/')),
    re_path(r'^static/(?P<path>.*)$', serve, {'document_root': str(settings.BASE_DIR / 'static')}),
    re_path(r'^uploads/(?P<path>.*)$', serve,{'document_root':settings.MEDIA_ROOT}),

]

# +static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

handler404 = "User.views.page_not_found_view"
