from django.db import models
from hospital.models import HospitalProfile
from donor.models import DonorProfile


class DonationCamp(models.Model):
    hospital = models.ForeignKey(
        HospitalProfile,
        on_delete=models.CASCADE,
        related_name="camps"
    )
    camp_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    address = models.TextField()
    city = models.CharField(max_length=100, db_index=True)
    state = models.CharField(max_length=100, db_index=True)
    pincode = models.CharField(max_length=10)
    start_date = models.DateField()
    end_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    # ✅ Add this new field
    is_approved = models.BooleanField(default=False, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['city', 'state']),
            models.Index(fields=['is_approved', 'start_date']),
            models.Index(fields=['is_approved', 'city']),
            models.Index(fields=['is_approved', 'state']),
        ]

    def __str__(self):
        return f"{self.camp_name} ({self.city})"


class CampRegistration(models.Model):
    camp = models.ForeignKey(DonationCamp, on_delete=models.CASCADE, related_name="registrations")
    donor = models.ForeignKey(DonorProfile, on_delete=models.CASCADE, related_name="camp_registrations")
    status = models.CharField(
        max_length=20,
        choices=[("Pending", "Pending"), ("Approved", "Approved"), ("Rejected", "Rejected")],
        default="Pending",
        db_index=True
    )
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['camp', 'status']),
            models.Index(fields=['donor', 'status']),
            models.Index(fields=['status', 'registered_at']),
        ]

    def __str__(self):
        return f"{self.donor.full_name} → {self.camp.camp_name} ({self.status})"
