from django.urls import path
from . import views
urlpatterns = [
   path('analyze/', views.analyze, name='analyze'),
   path('analyze/history/', views.HistoryView.as_view(), name='history'),
   path('usage/', views.UsageView.as_view(), name='usage'),
   path('upgradepro/', views.UpgradeproView.as_view(), name='upgradepro'),
   path('create_order/', views.CreateOrderView.as_view(), name='create_order'),
   path('verify_payment/', views.VerifyPaymentView.as_view(), name='verify_payment'),
]
