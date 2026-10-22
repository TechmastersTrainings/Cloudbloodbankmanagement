from django.urls import path
from .views import ReceiverRegisterView, ReceiverProfileView, ReceiverListView

urlpatterns = [
    path('register/', ReceiverRegisterView.as_view(), name='receiver-register'),
    path('profile/', ReceiverProfileView.as_view(), name='receiver-profile'),
    path('list/', ReceiverListView.as_view(), name='receiver-list'),
]