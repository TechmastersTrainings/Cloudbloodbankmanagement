from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import ScopedRateThrottle
from geopy.distance import geodesic
from math import radians, cos, sin, asin, sqrt

# Models
from hospital.models import HospitalProfile
from blood.models import BloodStock

# Serializers
from hospital.serializers import (
    HospitalRegistrationSerializer,
    HospitalProfileSerializer,
)

# Permissions
from core.permissions import IsAdminOrHospital, IsHospital

# --- Helper Functions ---

def haversine(lon1, lat1, lon2, lat2):
    """Fallback distance calculation if geopy fails."""
    if None in [lon1, lat1, lon2, lat2]:
        return None
    try:
        lon1, lat1, lon2, lat2 = map(radians, [float(lon1), float(lat1), float(lon2), float(lat2)])
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
        c = 2 * asin(sqrt(a))
        return round(6371 * c, 1)
    except (ValueError, TypeError):
        return None

# --- Hospital Views ---

class HospitalRegisterView(generics.GenericAPIView):
    """Handle Hospital Registration."""
    serializer_class = HospitalRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'register'
    throttle_classes = [ScopedRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            "message": "Hospital registered successfully. Awaiting admin approval.",
            "email": user.email
        }, status=status.HTTP_201_CREATED)


class HospitalProfileView(generics.RetrieveUpdateAPIView):
    """Handle Hospital Profile retrieval and partial updates."""
    serializer_class = HospitalProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsHospital]

    def get_object(self):
        return self.request.user.hospital_profile

    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class HospitalListAdminView(generics.ListAPIView):
    """
    GET /api/hospital/list/
    - Admin: See ALL hospitals (approved + pending)
    - Hospital: See only own hospital profile
    """
    serializer_class = HospitalProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHospital]

    def get_queryset(self):
        user = self.request.user
        if user.role == "ADMIN":
            return HospitalProfile.objects.all().order_by("-created_at")
        return HospitalProfile.objects.filter(user=user)


class HospitalApprovalView(APIView):
    """
    POST /api/hospital/<id>/verify/
    Body: { "action": "approve" } or { "action": "reject" }
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHospital]

    def post(self, request, pk):
        try:
            hospital = HospitalProfile.objects.get(pk=pk)
        except HospitalProfile.DoesNotExist:
            return Response({"detail": "Hospital not found."}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get("action")
        if action not in ["approve", "reject"]:
            return Response({"detail": "Invalid action. Use 'approve' or 'reject'."},
                            status=status.HTTP_400_BAD_REQUEST)

        if action == "approve":
            hospital.is_verified = True
            hospital.save()
            message = f"{hospital.hospital_name} has been approved successfully."
        else:
            hospital.delete()
            message = f"{hospital.hospital_name} registration has been rejected and removed."

        return Response({"detail": message}, status=status.HTTP_200_OK)


# --- The Blood Search View ---

class FindBloodView(APIView):
    """
    Public endpoint to search for hospitals with blood stock.
    Calculates distance and sorts results for the frontend.
    """
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'search'
    throttle_classes = [ScopedRateThrottle]

    def get(self, request):
        blood_group = request.query_params.get("blood_group")
        lat = request.query_params.get("lat")
        lon = request.query_params.get("lon")

        if not blood_group:
            return Response(
                {"detail": "blood_group parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Query verified hospitals with the specific blood group and available stock
        stocks = (
            BloodStock.objects.filter(
                blood_group__iexact=blood_group.strip(),
                quantity__gt=0,
                hospital__is_verified=True
            )
            .select_related("hospital")
        )

        results = []
        for stock in stocks:
            h = stock.hospital
            distance_km = None

            # 2. Distance Calculation with safety checks
            if lat and lon and h.latitude is not None and h.longitude is not None:
                try:
                    user_coords = (float(lat), float(lon))
                    hosp_coords = (float(h.latitude), float(h.longitude))
                    distance_km = round(geodesic(user_coords, hosp_coords).km, 1)
                except (ValueError, TypeError, Exception):
                    # Fallback to haversine if geodesic fails
                    distance_km = haversine(lon, lat, h.longitude, h.latitude)

            # 3. Formulate JSON matching FindBlood.jsx expectations
            results.append({
                "hospital_id": h.id,
                "hospital": h.hospital_name,
                "address": f"{h.address}, {h.city}",
                "latitude": h.latitude,
                "longitude": h.longitude,
                "distance_km": distance_km,
                "stock_info": {
                    "blood_group": stock.blood_group,
                    "available_units": stock.quantity
                }
            })

        # 4. Sorting logic
        if lat and lon:
            # Sort by distance, placing None values at the very end (99999 km away)
            results.sort(key=lambda x: x['distance_km'] if x['distance_km'] is not None else 99999)
        return Response(results, status=status.HTTP_200_OK)