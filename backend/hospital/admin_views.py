from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from hospital.models import HospitalProfile
from hospital.serializers import HospitalProfileSerializer
from core.permissions import IsAdminOrHospital


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
