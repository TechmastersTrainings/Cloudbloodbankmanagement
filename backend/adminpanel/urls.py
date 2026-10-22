from django.urls import path
from .views import (
    SystemOverviewView,
    BloodAvailabilityView,
    RecentActivityView,
    LowStockAlertView,
    DonationTrendView,
    HospitalListView,
    HospitalDetailView,
    DonorListView,
    DonorDetailView,
    ReceiverAdminListView,
    ReceiverAdminDetailView,
    VerifyEntityView,
)

urlpatterns = [
    # Analytics
    path("overview/", SystemOverviewView.as_view(), name="system-overview"),
    path("availability/", BloodAvailabilityView.as_view(), name="blood-availability"),
    path("recent/", RecentActivityView.as_view(), name="recent-activity"),
    path("low-stock/", LowStockAlertView.as_view(), name="low-stock"),
    path("donations/trend/", DonationTrendView.as_view(), name="donation-trend"),

    # Hospital Admin CRUD
    path("hospitals/", HospitalListView.as_view(), name="admin-hospitals"),
    path("hospitals/<int:pk>/", HospitalDetailView.as_view(), name="admin-hospital-detail"),

    # Donor Admin CRUD
    path("donors/", DonorListView.as_view(), name="admin-donors"),
    path("donors/<int:pk>/", DonorDetailView.as_view(), name="admin-donor-detail"),

    # Receiver Admin CRUD
    path("receivers/", ReceiverAdminListView.as_view(), name="admin-receivers"),
    path("receivers/<int:pk>/", ReceiverAdminDetailView.as_view(), name="admin-receiver-detail"),

    # Verification
    path("verify/", VerifyEntityView.as_view(), name="admin-verify"),
    path("donor/<int:id>/verify/", VerifyEntityView.as_view(), name="admin-donor-verify"),
]
