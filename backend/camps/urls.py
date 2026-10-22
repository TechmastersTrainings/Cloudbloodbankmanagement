from django.urls import path
from .views import (
    PublicCampListView,
    HospitalCampListCreateView,
    CampRegisterView,
    HospitalCampRegistrationsView,
    CampRegistrationActionView,
    DonorCampRegistrationsView,
    AdminManageCampsView,
    CampApprovalActionView, DonorMarkDonationView,
)

urlpatterns = [
    # Public
    path("", PublicCampListView.as_view(), name="camp-list"),

    # Hospital
    path("hospital/", HospitalCampListCreateView.as_view(), name="hospital-camps"),
    path("hospital/camp-requests/", HospitalCampRegistrationsView.as_view(), name="hospital-camp-requests"),

    # Donor
    path("<int:pk>/register/", CampRegisterView.as_view(), name="camp-register"),
    path("donor/mark-donation/<int:pk>/", DonorMarkDonationView.as_view(), name="donor-mark-donation"),
    path("donor/my-camps/", DonorCampRegistrationsView.as_view(), name="donor-my-camps"),

    # Hospital Actions
    path("registration/<int:pk>/action/", CampRegistrationActionView.as_view(), name="camp-registration-action"),

    # Admin
    path("admin/manage/", AdminManageCampsView.as_view(), name="admin-camp-list"),
    path("admin/<int:pk>/verify/", CampApprovalActionView.as_view(), name="admin-camp-verify"),
]
