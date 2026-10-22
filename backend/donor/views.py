from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from donor.models import DonorProfile
from blood.models import DonationRecord
from .serializers import (
    DonorRegistrationSerializer,
    DonorProfileSerializer,
    DonationRecordSerializer,
)
from .permissions import IsDonor
from core.permissions import IsAdminOrHospital


# ─────────────────────────────
# 🔹 Donor Registration
# ─────────────────────────────
class DonorRegisterView(generics.CreateAPIView):
    """
    Public registration for new donors.
    """
    serializer_class = DonorRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'register'
    throttle_classes = [ScopedRateThrottle]


# ─────────────────────────────
# 🔹 Donor Profile (GET + PATCH)
# ─────────────────────────────
class DonorProfileView(generics.RetrieveUpdateAPIView):
    """
    GET: Retrieve donor profile
    PATCH: Update donor profile (personal + medical)
    """
    serializer_class = DonorProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsDonor]

    def get_object(self):
        return self.request.user.donor_profile

    def patch(self, request, *args, **kwargs):
        """Allow donor to partially update their profile."""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


# ─────────────────────────────
# 🔹 Donor List (Admin or Hospital)
# ─────────────────────────────
class DonorListView(generics.ListAPIView):
    """
    List all donors (only accessible to Admin/Hospital).
    """
    queryset = DonorProfile.objects.all().order_by("-created_at")
    serializer_class = DonorProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHospital]


# ─────────────────────────────
# 🔹 Create Donation Record
# ─────────────────────────────
class DonationRecordCreateView(generics.CreateAPIView):
    """
    Donor can record a donation (manual entry or via hospital confirmation).
    """
    serializer_class = DonationRecordSerializer
    permission_classes = [permissions.IsAuthenticated, IsDonor]

    def perform_create(self, serializer):
        donor_profile = self.request.user.donor_profile
        serializer.save(donor=donor_profile)

        # Update donor statistics
        donor_profile.total_donations += 1
        donor_profile.last_donation_date = serializer.validated_data.get("donation_date")
        donor_profile.save()


# ─────────────────────────────
# 🔹 List Donation Records
# ─────────────────────────────
class DonationRecordListView(generics.ListAPIView):
    """
    List donations based on role:
    - Donor → their own records
    - Hospital/Admin → all records
    """
    serializer_class = DonationRecordSerializer
    permission_classes = [permissions.IsAuthenticated, IsDonor | IsAdminOrHospital]

    def get_queryset(self):
        user = self.request.user
        if user.role == "DONOR":
            return DonationRecord.objects.filter(donor=user.donor_profile).order_by("-donation_date")
        elif user.role in ["ADMIN", "HOSPITAL"]:
            return DonationRecord.objects.all().order_by("-donation_date")
        return DonationRecord.objects.none()
