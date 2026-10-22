# C:\Users\sachi\PycharmProjects\cloud_bloodbank_backendmanage\adminpanel\views.py

import requests
from datetime import timedelta, date
from django.db.models import Count, Sum
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

# Models
from hospital.models import HospitalProfile
from donor.models import DonorProfile
from receiver.models import ReceiverProfile
from blood.models import BloodStock, BloodRequest, DonationRecord

# Serializers
from receiver.serializers import ReceiverProfileSerializer
from donor.serializers import DonorProfileSerializer  # ✅ Full donor serializer
from .serializers import (
    HospitalVerificationSerializer,
    UserListSerializer,
)

User = get_user_model()


# ───────────────────────────────
#   PERMISSIONS
# ───────────────────────────────
class IsAdmin(permissions.BasePermission):
    """Custom permission for Admin-only access."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


# ───────────────────────────────
#   SECTION 1: SYSTEM ANALYTICS
# ───────────────────────────────
class SystemOverviewView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        total_hospitals = HospitalProfile.objects.count()
        total_donors = DonorProfile.objects.count()
        total_receivers = ReceiverProfile.objects.count()
        total_blood_units = BloodStock.objects.aggregate(Sum("quantity"))["quantity__sum"] or 0
        total_requests = BloodRequest.objects.count()
        total_donations = DonationRecord.objects.count()

        data = {
            "total_hospitals": total_hospitals,
            "total_donors": total_donors,
            "total_receivers": total_receivers,
            "total_blood_units": total_blood_units,
            "total_requests": total_requests,
            "total_donations": total_donations,
        }
        return Response(data, status=status.HTTP_200_OK)


class BloodAvailabilityView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        stocks = (
            BloodStock.objects.values("blood_group")
            .annotate(total_units=Sum("quantity"), hospitals=Count("hospital", distinct=True))
            .order_by("blood_group")
        )
        return Response(stocks, status=status.HTTP_200_OK)


class RecentActivityView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        recent_donations = DonationRecord.objects.select_related("donor", "hospital").order_by(
            "-donation_date"
        )[:10]
        recent_requests = BloodRequest.objects.select_related("receiver", "hospital").order_by(
            "-requested_at"
        )[:10]

        donations_data = [
            {
                "donor": d.donor.full_name,
                "hospital": d.hospital.hospital_name,
                "blood_group": d.blood_group,
                "quantity": d.quantity,
                "date": d.donation_date,
                "verified": d.verified,
            }
            for d in recent_donations
        ]

        requests_data = [
            {
                "receiver": r.receiver.full_name,
                "hospital": r.hospital.hospital_name,
                "blood_group": r.blood_group,
                "quantity_requested": r.quantity_requested,
                "status": r.status,
                "urgency": r.urgency_level,
                "requested_at": r.requested_at,
            }
            for r in recent_requests
        ]

        return Response(
            {"recent_donations": donations_data, "recent_requests": requests_data},
            status=status.HTTP_200_OK,
        )


class LowStockAlertView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        low_stocks = BloodStock.objects.filter(quantity__lte=5).select_related("hospital")
        alerts = [
            {
                "hospital": stock.hospital.hospital_name,
                "blood_group": stock.blood_group,
                "available_units": stock.quantity,
                "last_updated": stock.last_updated,
            }
            for stock in low_stocks
        ]
        return Response(alerts, status=status.HTTP_200_OK)


class DonationTrendView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        today = date.today()
        last_30_days = today - timedelta(days=30)
        donations = (
            DonationRecord.objects.filter(donation_date__gte=last_30_days)
            .values("donation_date")
            .annotate(total_units=Sum("quantity"))
            .order_by("donation_date")
        )
        data = [{"date": d["donation_date"], "total_units": d["total_units"]} for d in donations]
        return Response(data, status=status.HTTP_200_OK)


# ───────────────────────────────
#   SECTION 2: MANAGEMENT & VERIFICATION
# ───────────────────────────────

# ✅ HOSPITAL ADMIN CRUD
class HospitalListView(generics.ListCreateAPIView):
    queryset = HospitalProfile.objects.all().order_by("-id")
    serializer_class = HospitalVerificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]


class HospitalDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = HospitalProfile.objects.all()
    serializer_class = HospitalVerificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]


# ✅ DONOR ADMIN CRUD
class DonorListView(generics.ListCreateAPIView):
    """Admin: List all donors or create new"""
    queryset = DonorProfile.objects.all().order_by("-id")
    serializer_class = DonorProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]


class DonorDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin: Retrieve, update, or delete a donor"""
    queryset = DonorProfile.objects.all()
    serializer_class = DonorProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]


# ✅ RECEIVER ADMIN CRUD
class ReceiverAdminListView(generics.ListCreateAPIView):
    """Admin: List all receivers or create new"""
    queryset = ReceiverProfile.objects.all().order_by("-created_at")
    serializer_class = ReceiverProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]


class ReceiverAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin: Retrieve, update, or delete a receiver"""
    queryset = ReceiverProfile.objects.all()
    serializer_class = ReceiverProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]


# ✅ ENTITY VERIFICATION
class VerifyEntityView(APIView):
    """Handles verification for donors, hospitals, and receivers."""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def patch(self, request, id=None):
        """Used for donor-specific verification"""
        is_verified = request.data.get("is_verified")
        if is_verified is None:
            return Response(
                {"error": "Missing 'is_verified' field"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            donor = DonorProfile.objects.get(id=id)
            donor.is_verified = is_verified
            donor.save()
            return Response(
                {"message": "Donor verification updated successfully."},
                status=status.HTTP_200_OK,
            )
        except DonorProfile.DoesNotExist:
            return Response({"error": "Donor not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        """Generic verification handler for hospitals and donors"""
        entity_type = request.data.get("entity_type")
        entity_id = request.data.get("id")
        action = request.data.get("action")

        if not all([entity_type, entity_id, action]):
            return Response(
                {"error": "Missing required fields."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            if entity_type == "hospital":
                profile = HospitalProfile.objects.get(id=entity_id)
                if action == "verify" and not (profile.latitude and profile.longitude):
                    self.fetch_gps_coordinates(profile)
            elif entity_type == "donor":
                profile = DonorProfile.objects.get(id=entity_id)
            else:
                return Response({"error": "Invalid entity type"}, status=status.HTTP_400_BAD_REQUEST)

            profile.is_verified = action == "verify"
            profile.save()

            return Response(
                {"message": f"{entity_type.capitalize()} {action}ed successfully."},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def fetch_gps_coordinates(self, profile):
        """Fetch coordinates from OpenStreetMap"""
        try:
            if profile.address == "N/A" or profile.city == "N/A":
                return
            query = f"{profile.address}, {profile.city}, {profile.state}"
            headers = {"User-Agent": "CloudBloodBank/1.0"}
            response = requests.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": query, "format": "json", "limit": 1},
                headers=headers,
                timeout=5,
            )
            data = response.json()
            if data:
                profile.latitude = float(data[0]["lat"])
                profile.longitude = float(data[0]["lon"])
        except Exception as e:
            print(f"GPS Fetch Error: {e}")
