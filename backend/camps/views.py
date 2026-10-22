from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction

from camps.models import DonationCamp, CampRegistration
from camps.serializers import DonationCampSerializer, CampRegistrationSerializer
from notifications.services.email_service import send_email_notification
from blood.permissions import IsDonor, IsHospital, IsAdmin


# ───────────────────────────────
# 🔹 PUBLIC — View Approved Camps
# ───────────────────────────────
class PublicCampListView(generics.ListAPIView):
    """List all approved blood donation camps (public view)."""
    queryset = DonationCamp.objects.filter(is_approved=True).order_by("start_date")
    serializer_class = DonationCampSerializer
    permission_classes = [permissions.AllowAny]


# ───────────────────────────────
# 🔹 DONOR — Register & Manage Camps
# ───────────────────────────────
class CampRegisterView(APIView):
    """Donor registers for an approved camp."""
    permission_classes = [permissions.IsAuthenticated, IsDonor]

    def post(self, request, pk):
        donor = request.user.donor_profile
        try:
            camp = DonationCamp.objects.get(pk=pk, is_approved=True)
        except DonationCamp.DoesNotExist:
            return Response({"detail": "Camp not found or not approved."}, status=status.HTTP_404_NOT_FOUND)

        if CampRegistration.objects.filter(camp=camp, donor=donor).exists():
            return Response({"detail": "Already registered for this camp."}, status=status.HTTP_400_BAD_REQUEST)

        CampRegistration.objects.create(camp=camp, donor=donor, status="Pending")

        # Email Notification to Hospital
        send_email_notification(
            camp.hospital.user,
            "🩸 New Donor Registration",
            f"A donor {donor.full_name} has registered for {camp.camp_name}."
        )

        return Response({"detail": "Registered successfully!"}, status=status.HTTP_201_CREATED)


class DonorCampRegistrationsView(generics.ListAPIView):
    """Donor views their camp registration history."""
    serializer_class = CampRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated, IsDonor]

    def get_queryset(self):
        return CampRegistration.objects.filter(
            donor=self.request.user.donor_profile
        ).select_related("camp", "camp__hospital").order_by("-registered_at")


class DonorMarkDonationView(APIView):
    """Donor marks themselves as 'Donated' after approval."""
    permission_classes = [permissions.IsAuthenticated, IsDonor]

    @transaction.atomic
    def post(self, request, pk):
        try:
            registration = CampRegistration.objects.select_for_update().get(
                id=pk, donor=request.user.donor_profile
            )
        except CampRegistration.DoesNotExist:
            return Response({"detail": "Registration not found."}, status=status.HTTP_404_NOT_FOUND)

        if registration.status != "Approved":
            return Response({"detail": "You can only mark approved registrations as donated."}, status=status.HTTP_400_BAD_REQUEST)

        registration.status = "Donated"
        registration.save()

        donor = registration.donor
        donor.total_donations += 1
        donor.last_donation_date = registration.camp.end_date
        donor.save()

        send_email_notification(
            donor.user,
            "🎉 Donation Recorded",
            f"Thank you {donor.full_name} for donating at {registration.camp.camp_name}!"
        )

        return Response({"detail": "Donation marked as completed!"}, status=status.HTTP_200_OK)


# ───────────────────────────────
# 🔹 HOSPITAL — Manage Camps & Donor Requests
# ───────────────────────────────
class HospitalCampListCreateView(generics.ListCreateAPIView):
    """Hospital can view and create their own camps."""
    serializer_class = DonationCampSerializer
    permission_classes = [permissions.IsAuthenticated, IsHospital]

    def get_queryset(self):
        return DonationCamp.objects.filter(
            hospital=self.request.user.hospital_profile
        ).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(hospital=self.request.user.hospital_profile)


class HospitalCampRegistrationsView(generics.ListAPIView):
    """Hospital views all donor registrations for their camps."""
    serializer_class = CampRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated, IsHospital]

    def get_queryset(self):
        return CampRegistration.objects.filter(
            camp__hospital=self.request.user.hospital_profile
        ).select_related("donor", "camp").order_by("-registered_at")


class CampRegistrationActionView(APIView):
    """Hospital approves or rejects donor camp registration."""
    permission_classes = [permissions.IsAuthenticated, IsHospital]

    @transaction.atomic
    def post(self, request, pk):
        try:
            registration = CampRegistration.objects.select_for_update().get(
                id=pk, camp__hospital=request.user.hospital_profile
            )
        except CampRegistration.DoesNotExist:
            return Response({"detail": "Registration not found."}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get("action")
        if action not in ["approve", "reject"]:
            return Response({"detail": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)

        registration.status = "Approved" if action == "approve" else "Rejected"
        registration.save()

        subject = (
            f"✅ Approved: {registration.camp.camp_name}"
            if action == "approve"
            else f"❌ Rejected: {registration.camp.camp_name}"
        )
        message = f"Your registration for {registration.camp.camp_name} has been {registration.status.lower()}."
        send_email_notification(registration.donor.user, subject, message)

        return Response({"detail": f"Registration {registration.status}."}, status=status.HTTP_200_OK)


# ───────────────────────────────
# 🔹 ADMIN — Manage Camps
# ───────────────────────────────
class AdminManageCampsView(generics.ListAPIView):
    """Admin can view all created camps."""
    queryset = DonationCamp.objects.all().order_by("-created_at")
    serializer_class = DonationCampSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]


class CampApprovalActionView(APIView):
    """Admin can approve or reject (delete) a camp."""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            camp = DonationCamp.objects.get(id=pk)
        except DonationCamp.DoesNotExist:
            return Response({"detail": "Camp not found."}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get("action")
        if action == "approve":
            camp.is_approved = True
            camp.save()
            return Response({"detail": "Camp approved successfully."}, status=status.HTTP_200_OK)
        elif action == "reject":
            camp.delete()
            return Response({"detail": "Camp rejected and deleted."}, status=status.HTTP_200_OK)

        return Response({"detail": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)
