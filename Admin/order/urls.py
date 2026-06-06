from django.urls import path

from . import views

urlpatterns = [
    path('', views.order),
    path('tracker/', views.tracker),
    path('<int:hid>', views.order_detail),
]
