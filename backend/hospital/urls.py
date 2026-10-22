from django.urls import path
from .views import (
    HospitalRegisterView,
    HospitalProfileView,
    FindBloodView,
    HospitalListAdminView,
    HospitalApprovalView,
)

urlpatterns = [
    path('register/', HospitalRegisterView.as_view(), name='hospital-register'),
    path('profile/', HospitalProfileView.as_view(), name='hospital-profile'),
    path('list/', HospitalListAdminView.as_view(), name='hospital-list'),
    path('find-blood/', FindBloodView.as_view(), name='find-blood'),
    path('hospitals/nearby/', FindBloodView.as_view(), name='find-blood-nearby'),
    path('<int:pk>/verify/', HospitalApprovalView.as_view(), name='hospital-verify'),
]