from rest_framework import serializers
from django.contrib.auth import get_user_model
from receiver.models import ReceiverProfile
from django.db import transaction

User = get_user_model()

class ReceiverProfileSerializer(serializers.ModelSerializer):
    """
    Used for viewing/updating the profile after login.
    """
    class Meta:
        model = ReceiverProfile
        fields = [
            'id', 'full_name', 'date_of_birth', 'gender', 'blood_group',
            'contact_phone', 'address', 'city', 'state', 'pincode',
            'latitude', 'longitude', 'medical_condition', 'urgency_level',
            'hospital_preference', 'email', 'is_verified', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_verified', 'created_at', 'updated_at']


class ReceiverRegistrationSerializer(serializers.Serializer):
    """
    Handles incoming registration data.
    """
    # 1. User Account Fields
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    full_name = serializers.CharField(max_length=255)

    # 2. Profile Fields
    date_of_birth = serializers.DateField()
    gender = serializers.ChoiceField(choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')])
    blood_group = serializers.ChoiceField(
        choices=[('A+', 'A+'), ('A-', 'A-'), ('B+', 'B+'), ('B-', 'B-'),
                 ('O+', 'O+'), ('O-', 'O-'), ('AB+', 'AB+'), ('AB-', 'AB-')]
    )
    contact_phone = serializers.CharField(max_length=17)
    address = serializers.CharField()
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    pincode = serializers.CharField(max_length=10)

    # 3. Optional Fields (Marked required=False to prevent 400 Error if missing)
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)
    medical_condition = serializers.CharField(required=False, allow_blank=True, max_length=255)
    urgency_level = serializers.CharField(required=False, allow_blank=True, max_length=50)
    hospital_preference = serializers.CharField(required=False, allow_blank=True, max_length=255)

    def validate_email(self, value):
        """Check if email already exists"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        """
        Atomic transaction to create User AND Profile together.
        If one fails, both fail.
        """
        with transaction.atomic():
            # Create User
            user = User.objects.create_user(
                email=validated_data['email'],
                password=validated_data['password'],
                full_name=validated_data['full_name'],
                role='RECEIVER'  # Force role
            )

            # Create Profile
            ReceiverProfile.objects.create(
                user=user,
                full_name=validated_data['full_name'],
                date_of_birth=validated_data['date_of_birth'],
                gender=validated_data['gender'],
                blood_group=validated_data['blood_group'],
                contact_phone=validated_data['contact_phone'],
                address=validated_data['address'],
                city=validated_data['city'],
                state=validated_data['state'],
                pincode=validated_data['pincode'],
                # Use .get() for optional fields to avoid KeyErrors
                latitude=validated_data.get('latitude'),
                longitude=validated_data.get('longitude'),
                medical_condition=validated_data.get('medical_condition', ''),
                urgency_level=validated_data.get('urgency_level', ''),
                hospital_preference=validated_data.get('hospital_preference', ''),
                email=validated_data['email'] # redundancy if needed by model
            )
            return user