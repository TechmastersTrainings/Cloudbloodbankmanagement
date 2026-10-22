from django.urls import path
from .views import (
    BloodStockListCreateView, BloodStockUpdateView,
    BloodRequestListCreateView, HospitalRequestListView,
    DonationRecordListView, BloodRequestApproveRejectView,
    DonationAppointmentListCreateView,
    HospitalAppointmentListView,
    DonationAppointmentStatusUpdateView,
)

urlpatterns = [
    path('stock/', BloodStockListCreateView.as_view(), name='blood-stock'),
    path('stock/<int:pk>/', BloodStockUpdateView.as_view(), name='blood-stock-update'),
    path('request/', BloodRequestListCreateView.as_view(), name='blood-request'),
    path('requests/hospital/', HospitalRequestListView.as_view(), name='hospital-requests'),
    path('requests/<int:pk>/action/', BloodRequestApproveRejectView.as_view(), name='blood-request-action'),
    path('donations/', DonationRecordListView.as_view(), name='donation-list'),
    path('appointments/', DonationAppointmentListCreateView.as_view(), name='donation-appointments'),
    path('appointments/hospital/', HospitalAppointmentListView.as_view(), name='hospital-appointments'),
    path('appointments/<int:pk>/update/', DonationAppointmentStatusUpdateView.as_view(), name='appointment-status-update'),
]