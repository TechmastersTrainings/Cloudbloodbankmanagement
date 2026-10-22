from django.urls import path

from .admin import DonorApprovalView
from .views import (
    DonorRegisterView, DonorProfileView, DonorListView,
    DonationRecordCreateView, DonationRecordListView
)

urlpatterns = [
    path('register/', DonorRegisterView.as_view(), name='donor-register'),
    path('profile/', DonorProfileView.as_view(), name='donor-profile'),
    path('list/', DonorListView.as_view(), name='donor-list'),
    path('donations/add/', DonationRecordCreateView.as_view(), name='donation-add'),
    path('donations/', DonationRecordListView.as_view(), name='donation-list'),
    path("<int:pk>/verify/", DonorApprovalView.as_view(), name="donor-verify"),
]
