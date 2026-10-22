from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView  # <-- Added for the stats view
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db import transaction
from .models import User
from .serializers import UserSerializer, RegisterSerializer
from hospital.models import HospitalProfile
from donor.models import DonorProfile
from receiver.models import ReceiverProfile


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer that embeds user info into token response.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["email"] = user.email
        token["full_name"] = user.full_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        # Include user details in the response
        data["user"] = {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        }
        return data


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    throttle_scope = 'login'
    throttle_classes = [ScopedRateThrottle]


class RegisterView(generics.CreateAPIView):
    """
    Handles user registration. 
    Note: For HOSPITAL, DONOR, RECEIVER roles, use dedicated endpoints:
    - /api/hospital/register/
    - /api/donor/register/
    - /api/receiver/register/
    This endpoint only creates the base User.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'register'
    throttle_classes = [ScopedRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Profile creation is handled by dedicated registration endpoints:
        # - /api/hospital/register/ for HOSPITAL
        # - /api/donor/register/ for DONOR
        # - /api/receiver/register/ for RECEIVER
        # This endpoint only creates the base User.

        return Response(
            {"message": f"{user.role} registered successfully!"},
            status=status.HTTP_201_CREATED,
        )


class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


# --- 🔹 Added Stats View for the Homepage ---

class SystemStatsView(APIView):
    """
    Public endpoint to get total counts for the homepage.
    GET /api/accounts/stats/
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            # Filtering hospitals to only show verified ones
            hospitals_count = HospitalProfile.objects.filter(is_verified=True).count()
            donors_count = DonorProfile.objects.count()
            receivers_count = ReceiverProfile.objects.count()

            return Response({
                "donors": donors_count,
                "hospitals": hospitals_count,
                "receivers": receivers_count
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )