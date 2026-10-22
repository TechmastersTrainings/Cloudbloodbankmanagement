from django.db import models
from django.conf import settings
from hospital.models import HospitalProfile
from donor.models import DonorProfile
from receiver.models import ReceiverProfile
from django.utils import timezone

BLOOD_GROUP_CHOICES = (
    ('A+', 'A+'), ('A-', 'A-'),
    ('B+', 'B+'), ('B-', 'B-'),
    ('O+', 'O+'), ('O-', 'O-'),
    ('AB+', 'AB+'), ('AB-', 'AB-'),
)

class BloodStock(models.Model):
    hospital = models.ForeignKey(HospitalProfile, on_delete=models.CASCADE, related_name='blood_stock_entries')
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUP_CHOICES, db_index=True)
    quantity = models.PositiveIntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('hospital', 'blood_group')
        verbose_name = "Blood Stock"
        indexes = [
            models.Index(fields=['blood_group', 'quantity']),
        ]

    def __str__(self):
        return f"{self.hospital.hospital_name} - {self.blood_group}: {self.quantity} units"


class BloodRequest(models.Model):
    receiver = models.ForeignKey(ReceiverProfile, on_delete=models.CASCADE, related_name='blood_requests')
    hospital = models.ForeignKey(HospitalProfile, on_delete=models.CASCADE, related_name='blood_requests')
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUP_CHOICES, db_index=True)
    quantity_requested = models.PositiveIntegerField(default=1)
    urgency_level = models.CharField(
        max_length=20,
        choices=(('Low', 'Low'), ('Medium', 'Medium'), ('High', 'High')),
        default='Medium'
    )
    status = models.CharField(
        max_length=20,
        choices=(('Pending', 'Pending'), ('Approved', 'Approved'), ('Rejected', 'Rejected'), ('Completed', 'Completed')),
        default='Pending'
    )
    requested_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-requested_at']
        verbose_name = "Blood Request"
        indexes = [
            models.Index(fields=['hospital', 'status']),
            models.Index(fields=['receiver', 'status']),
            models.Index(fields=['blood_group', 'status']),
            models.Index(fields=['status', 'requested_at']),
        ]

    def __str__(self):
        return f"Request {self.receiver.full_name} → {self.hospital.hospital_name} ({self.blood_group})"


class DonationRecord(models.Model):
    donor = models.ForeignKey(DonorProfile, on_delete=models.CASCADE, related_name='blood_donations')
    hospital = models.ForeignKey(HospitalProfile, on_delete=models.CASCADE, related_name='hospital_donations')
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUP_CHOICES, db_index=True)
    quantity = models.PositiveIntegerField(default=1)
    donation_date = models.DateField(auto_now_add=True)
    verified = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-donation_date']
        verbose_name = "Donation Record"
        indexes = [
            models.Index(fields=['donor', 'donation_date']),
            models.Index(fields=['hospital', 'donation_date']),
            models.Index(fields=['blood_group', 'donation_date']),
            models.Index(fields=['verified', 'donation_date']),
        ]

    def __str__(self):
        return f"Donation {self.blood_group} by {self.donor.full_name}"


class DonationAppointment(models.Model):
    donor = models.ForeignKey(DonorProfile, on_delete=models.CASCADE, related_name='appointments')
    hospital = models.ForeignKey(HospitalProfile, on_delete=models.CASCADE, related_name='hospital_appointments')
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUP_CHOICES, db_index=True)
    appointment_date = models.DateField()
    appointment_time = models.TimeField()
    quantity_pints = models.PositiveIntegerField(default=1)
    status = models.CharField(
        max_length=20,
        choices=(('Scheduled', 'Scheduled'), ('Completed', 'Completed'), ('Cancelled', 'Cancelled')),
        default='Scheduled'
    )
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-appointment_date', '-appointment_time']
        verbose_name = "Donation Appointment"
        indexes = [
            models.Index(fields=['donor', 'status']),
            models.Index(fields=['hospital', 'status']),
            models.Index(fields=['appointment_date', 'status']),
            models.Index(fields=['blood_group', 'status']),
        ]

    def __str__(self):
        return f"{self.donor.full_name} @ {self.hospital.hospital_name} on {self.appointment_date}"