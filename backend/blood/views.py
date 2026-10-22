from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from django.db import transaction
from hospital.models import HospitalProfile

# Models
from blood.models import (
    BloodStock,
    BloodRequest,
    DonationRecord,
    DonationAppointment
)

# Serializers
from .serializers import (
    BloodStockSerializer,
    BloodRequestSerializer,
    DonationRecordSerializer,
    DonationAppointmentSerializer
)

# Permissions
from .permissions import IsHospital, IsReceiver, IsDonor

# Services
from notifications.services.email_service import send_email_notification


# ───── BLOOD STOCK (Hospital CRUD) ─────

class BloodStockListCreateView(generics.ListCreateAPIView):
    serializer_class = BloodStockSerializer
    permission_classes = [permissions.IsAuthenticated, IsHospital]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "hospital_profile"):
            return BloodStock.objects.filter(hospital=user.hospital_profile)
        return BloodStock.objects.none()

    def create(self, request, *args, **kwargs):
        """
        Custom create method:
        - If stock exists: Add new quantity to existing quantity.
        - If stock is new: Create it.
        """
        user = self.request.user

        # 1. Ensure Hospital Profile Exists
        hospital_profile, created = HospitalProfile.objects.get_or_create(
            user=user,
            defaults={
                "hospital_name": getattr(user, "full_name", "Unnamed Hospital"),
                "contact_person": getattr(user, "full_name", "Unknown"),
                "contact_phone": "N/A",
                "address": "N/A",
                "city": "N/A",
                "state": "N/A",
                "pincode": "000000",
                "hospital_type": "Private",
            },
        )

        # 2. Get data
        blood_group = request.data.get('blood_group')
        quantity = request.data.get('quantity')

        if not blood_group or quantity is None:
            return Response(
                {"detail": "Blood group and quantity are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Check for existing stock
        existing_stock = BloodStock.objects.filter(
            hospital=hospital_profile,
            blood_group=blood_group
        ).first()

        if existing_stock:
            # UPDATE: Add new quantity to previous quantity
            existing_stock.quantity += int(quantity)
            existing_stock.save()

            serializer = self.get_serializer(existing_stock)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            # CREATE: New entry
            stock = BloodStock.objects.create(
                hospital=hospital_profile,
                blood_group=blood_group,
                quantity=int(quantity)
            )
            serializer = self.get_serializer(stock)
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class BloodStockUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = BloodStockSerializer
    permission_classes = [permissions.IsAuthenticated, IsHospital]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, "hospital_profile"):
            return BloodStock.objects.filter(hospital=user.hospital_profile)
        return BloodStock.objects.none()

    def perform_update(self, serializer):
        stock = serializer.save()
        if stock.quantity < 5:
            subject = "Low Blood Stock Alert"
            message = (
                f"Dear {self.request.user.full_name},\n\n"
                f"Blood group {stock.blood_group} is critically low ({stock.quantity} units remaining).\n"
                "Please replenish immediately.\n\n"
                "Regards,\nCloud Blood Bank System"
            )
            send_email_notification(self.request.user, subject, message)


# ───── BLOOD REQUEST (Receiver CRUD) ─────

class BloodRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = BloodRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsReceiver]

    def get_queryset(self):
        return BloodRequest.objects.filter(receiver=self.request.user.receiver_profile)

    def perform_create(self, serializer):
        request_obj = serializer.save(receiver=self.request.user.receiver_profile)
        hospital_user = request_obj.hospital.user
        subject = "New Blood Request"
        message = (
            f"Dear {hospital_user.full_name},\n\n"
            f"You have received a new blood request from {self.request.user.full_name}.\n"
            f"Blood Group: {request_obj.blood_group}\n"
            f"Quantity: {request_obj.quantity_requested} units.\n"
            f"Urgency: {request_obj.urgency_level}.\n\n"
            "Please review and respond via your dashboard.\n\n"
            "Best Regards,\nCloud Blood Bank System"
        )
        send_email_notification(hospital_user, subject, message)


# ───── HOSPITAL REQUEST MANAGEMENT ─────

class HospitalRequestListView(generics.ListAPIView):
    serializer_class = BloodRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsHospital]

    def get_queryset(self):
        return BloodRequest.objects.filter(hospital=self.request.user.hospital_profile).order_by("-requested_at")


class BloodRequestApproveRejectView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsHospital]

    @transaction.atomic
    def post(self, request, pk):
        try:
            blood_request = BloodRequest.objects.select_for_update().get(
                pk=pk, hospital=request.user.hospital_profile
            )
        except BloodRequest.DoesNotExist:
            return Response({"detail": "Blood request not found."}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get("action")
        if action not in ["approve", "reject"]:
            return Response({"detail": "Invalid action. Use 'approve' or 'reject'."},
                            status=status.HTTP_400_BAD_REQUEST)

        receiver_user = blood_request.receiver.user
        blood_stock = BloodStock.objects.filter(
            hospital=request.user.hospital_profile, blood_group=blood_request.blood_group
        ).first()

        # Reject Case
        if action == "reject":
            blood_request.status = "Rejected"
            blood_request.save()
            send_email_notification(
                receiver_user,
                "Blood Request Rejected",
                f"Dear {receiver_user.full_name},\n\n"
                f"Your blood request for {blood_request.blood_group} ({blood_request.quantity_requested} units) "
                f"has been rejected by {request.user.full_name}.\n\n"
                "Regards,\nCloud Blood Bank System",
            )
            return Response({"detail": "Blood request rejected."}, status=status.HTTP_200_OK)

        # Approve Case
        if not blood_stock or blood_stock.quantity < blood_request.quantity_requested:
            return Response(
                {"detail": "Insufficient blood stock to approve this request."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update stock
        blood_stock.quantity -= blood_request.quantity_requested
        blood_stock.save()

        # Mark as approved
        blood_request.status = "Approved"
        blood_request.save()

        send_email_notification(
            receiver_user,
            "Blood Request Approved",
            f"Dear {receiver_user.full_name},\n\n"
            f"Good news! Your blood request for {blood_request.blood_group} "
            f"({blood_request.quantity_requested} units) has been approved by {request.user.full_name}.\n\n"
            "Please contact the hospital to collect it.\n\n"
            "Regards,\nCloud Blood Bank System",
        )

        return Response({"detail": "Blood request approved successfully."}, status=status.HTTP_200_OK)


# ───── DONATION RECORDS ─────

class DonationRecordListView(generics.ListAPIView):
    serializer_class = DonationRecordSerializer
    permission_classes = [permissions.IsAuthenticated, IsDonor]

    def get_queryset(self):
        return DonationRecord.objects.filter(donor=self.request.user.donor_profile)


# ───── APPOINTMENT MANAGEMENT ─────

class DonationAppointmentListCreateView(generics.ListCreateAPIView):
    serializer_class = DonationAppointmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsDonor]

    def get_queryset(self):
        return DonationAppointment.objects.filter(donor=self.request.user.donor_profile)

    def perform_create(self, serializer):
        appointment = serializer.save(donor=self.request.user.donor_profile)
        hospital_user = appointment.hospital.user

        send_email_notification(
            hospital_user,
            "New Donation Appointment Scheduled",
            f"Dear {hospital_user.full_name},\n\n"
            f"Donor {self.request.user.full_name} has scheduled a blood donation.\n"
            f"Date: {appointment.appointment_date}\n"
            f"Time: {appointment.appointment_time}\n"
            f"Blood Group: {appointment.blood_group}\n"
            f"Quantity: {appointment.quantity_pints} unit(s).\n\n"
            "Please prepare your staff for the appointment."
        )


class HospitalAppointmentListView(generics.ListAPIView):
    serializer_class = DonationAppointmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsHospital]

    def get_queryset(self):
        return DonationAppointment.objects.filter(hospital=self.request.user.hospital_profile)


class DonationAppointmentStatusUpdateView(generics.UpdateAPIView):
    serializer_class = DonationAppointmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsHospital]

    def get_queryset(self):
        return DonationAppointment.objects.filter(hospital=self.request.user.hospital_profile)

    def perform_update(self, serializer):
        appointment = serializer.save()
        donor_user = appointment.donor.user

        if appointment.status == "Completed":
            DonationRecord.objects.create(
                donor=appointment.donor,
                hospital=appointment.hospital,
                blood_group=appointment.blood_group,
                quantity=appointment.quantity_pints,
                verified=True,
            )
            stock, _ = BloodStock.objects.get_or_create(
                hospital=appointment.hospital,
                blood_group=appointment.blood_group,
                defaults={"quantity": 0},
            )
            stock.quantity += appointment.quantity_pints
            stock.save()

            send_email_notification(
                donor_user,
                "Donation Completed Successfully",
                f"Dear {donor_user.full_name},\n\n"
                f"Thank you for donating {appointment.quantity_pints} unit(s) of {appointment.blood_group} blood.\n"
                f"Your contribution has been recorded at {appointment.hospital.hospital_name}.\n\n"
                "We appreciate your generosity.\n\n"
                "Regards,\nCloud Blood Bank System",
            )
        elif appointment.status == "Cancelled":
            send_email_notification(
                donor_user,
                "Donation Appointment Cancelled",
                f"Dear {donor_user.full_name},\n\n"
                f"Your appointment on {appointment.appointment_date} at {appointment.hospital.hospital_name} "
                f"has been cancelled.\n\nPlease reschedule if required.",
            )