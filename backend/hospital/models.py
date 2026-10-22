from django.db import models
from django.conf import settings


class HospitalProfile(models.Model):
    """
    Stores hospital details linked to a User (role='HOSPITAL').
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="hospital_profile"
    )
    hospital_name = models.CharField(max_length=255)
    registration_number = models.CharField(max_length=100, unique=True)
    contact_number = models.CharField(max_length=20, default="N/A")  # standardized field
    address = models.TextField()
    city = models.CharField(max_length=100, db_index=True)
    state = models.CharField(max_length=100, db_index=True)
    pincode = models.CharField(max_length=10)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    is_verified = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    hospital_type = models.CharField(max_length=50, blank=True, null=True)
    number_of_beds = models.PositiveIntegerField(blank=True, null=True)
    blood_storage_capacity_pints = models.PositiveIntegerField(blank=True, null=True)
    operating_hours = models.CharField(max_length=100, blank=True, null=True)
    email_official = models.EmailField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    contact_person = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        ordering = ["hospital_name"]
        verbose_name = "Hospital"
        verbose_name_plural = "Hospitals"
        indexes = [
            models.Index(fields=['city', 'state']),
            models.Index(fields=['is_verified', 'city']),
            models.Index(fields=['is_verified', 'state']),
        ]

    def __str__(self):
        return f"{self.hospital_name} ({self.city})"
