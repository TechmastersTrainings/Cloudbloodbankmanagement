#C:\Users\sachi\PycharmProjects\cloud_bloodbank_backendmanage\adminpanel\serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from hospital.models import HospitalProfile
from donor.models import DonorProfile
from blood.models import BloodStock, DonationRecord

# ✅ Get the active User model safely
User = get_user_model()

# ───── MANAGEMENT SERIALIZERS ─────

class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # ✅ REMOVED 'date_joined' to fix the FieldError
        fields = ['id', 'email', 'full_name', 'role', 'is_active']
        read_only_fields = ['id', 'email', 'role']

class HospitalVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = HospitalProfile
        fields = [
            'id', 'hospital_name', 'registration_number',
            'city', 'state', 'is_verified', 'latitude', 'longitude'
        ]
        read_only_fields = ['id', 'latitude', 'longitude']

class DonorVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonorProfile
        fields = ['id', 'full_name', 'blood_group', 'city', 'state', 'is_verified']
        read_only_fields = ['id']

# ───── ANALYTICS SERIALIZERS ─────

class AnalyticsSerializer(serializers.Serializer):
    total_hospitals = serializers.IntegerField()
    verified_hospitals = serializers.IntegerField()
    total_donors = serializers.IntegerField()
    verified_donors = serializers.IntegerField()
    total_receivers = serializers.IntegerField()
    total_blood_stock_units = serializers.IntegerField()
    total_donations = serializers.IntegerField()