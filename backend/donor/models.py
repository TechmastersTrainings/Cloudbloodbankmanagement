from django.db import models
from django.conf import settings
from django.core.validators import RegexValidator

BLOOD_GROUP_CHOICES = (
    ('A+', 'A+'), ('A-', 'A-'),
    ('B+', 'B+'), ('B-', 'B-'),
    ('O+', 'O+'), ('O-', 'O-'),
    ('AB+', 'AB+'), ('AB-', 'AB-'),
)

GENDER_CHOICES = (
    ('M', 'Male'),
    ('F', 'Female'),
    ('O', 'Other'),
)


class DonorProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='donor_profile'
    )
    full_name = models.CharField(max_length=255)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUP_CHOICES, db_index=True)

    # Physical stats (Nullable as per your form requirements)
    weight_kg = models.FloatField(blank=True, null=True)
    height_cm = models.FloatField(blank=True, null=True)

    contact_phone = models.CharField(max_length=17, validators=[RegexValidator(
        regex=r'^\+?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )])
    alternate_phone = models.CharField(max_length=17, blank=True, null=True)

    address = models.TextField()
    city = models.CharField(max_length=100, db_index=True)
    state = models.CharField(max_length=100, db_index=True)
    pincode = models.CharField(max_length=10)

    medical_history = models.TextField(blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)
    recent_illnesses = models.TextField(blank=True, null=True)
    lifestyle = models.TextField(blank=True, null=True)

    last_donation_date = models.DateField(blank=True, null=True)
    total_donations = models.PositiveIntegerField(default=0)
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
        return f"{self.full_name} ({self.blood_group})"