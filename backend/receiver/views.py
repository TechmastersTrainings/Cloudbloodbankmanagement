# ✅ receiver/views.py (final optimized version)
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from receiver.serializers import (
    ReceiverRegistrationSerializer,
    ReceiverProfileSerializer
)
from receiver.models import ReceiverProfile
from receiver.permissions import IsReceiver
from core.permissions import IsAdminOrHospital


# 🔹 Public — Register a new receiver
class ReceiverRegisterView(generics.GenericAPIView):
    """
    Public endpoint for Receiver Registration.
    POST /api/receiver/register/
    """
    serializer_class = ReceiverRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'register'
    throttle_classes = [ScopedRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # 🔸 Get the receiver profile (auto-created in serializer)
        profile = getattr(user, "receiver_profile", None)

        return Response({
            "message": "Receiver registered successfully.",
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role
            },
            "profile": {
                "id": profile.id if profile else None,
                "full_name": profile.full_name if profile else None,
                "blood_group": profile.blood_group if profile else None,
                "city": profile.city if profile else None,
                "state": profile.state if profile else None,
            }
        }, status=status.HTTP_201_CREATED)


# 🔹 Receiver — Retrieve & Update Profile
class ReceiverProfileView(generics.RetrieveUpdateAPIView):
    """
    GET /api/receiver/profile/
    PATCH /api/receiver/profile/
    """
    serializer_class = ReceiverProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsReceiver]

    def get_object(self):
        return self.request.user.receiver_profile

    def patch(self, request, *args, **kwargs):
        """Partial update for receiver details."""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


# 🔹 Admin/Hospital — View all verified receivers
class ReceiverListView(generics.ListAPIView):
    """
    List all verified receivers (for Admin/Hospital use).
    GET /api/receiver/list/
    """
    queryset = ReceiverProfile.objects.filter(is_verified=True)
    serializer_class = ReceiverProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHospital]
