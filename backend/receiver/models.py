from django.db import models
from django.conf import settings

BLOOD_GROUP_CHOICES = (
    ('A+', 'A+'), ('A-', 'A-'),
    ('B+', 'B+'), ('B-', 'B-'),
    ('O+', 'O+'), ('O-', 'O-'),
    ('AB+', 'AB+'), ('AB-', 'AB-')
)

GENDER_CHOICES = (
    ('M', 'Male'),
    ('F', 'Female'),
    ('O', 'Other')
)


class ReceiverProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='receiver_profile'
    )
    full_name = models.CharField(max_length=255)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUP_CHOICES, db_index=True)
    contact_phone = models.CharField(max_length=17)
    address = models.TextField()
    city = models.CharField(max_length=100, db_index=True)
    state = models.CharField(max_length=100, db_index=True)
    pincode = models.CharField(max_length=10)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)

    medical_condition = models.CharField(max_length=255, blank=True, null=True)
    urgency_level = models.CharField(max_length=50, blank=True, null=True)
    hospital_preference = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)

    is_verified = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['blood_group', 'city']),
            models.Index(fields=['blood_group', 'state']),
            models.Index(fields=['is_verified', 'city']),
            models.Index(fields=['is_verified', 'state']),
        ]

    def __str__(self):
        return f"{self.full_name} - {self.blood_group} ({self.city})"
