#C:\Users\sachi\PycharmProjects\cloud_bloodbank_backendmanage\donor\serializers.py

from rest_framework import serializers

from django.contrib.auth import get_user_model
from donor.models import DonorProfile, BLOOD_GROUP_CHOICES, GENDER_CHOICES
from blood.models import DonationRecord

User = get_user_model()


# ─────────────── DONOR REGISTRATION SERIALIZER ─────────────── #
class DonorRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    full_name = serializers.CharField(max_length=255)
    date_of_birth = serializers.DateField()
    gender = serializers.ChoiceField(choices=GENDER_CHOICES)
    blood_group = serializers.ChoiceField(choices=BLOOD_GROUP_CHOICES)

    # Allow nulls for physical stats
    weight_kg = serializers.FloatField(required=False, allow_null=True)
    height_cm = serializers.FloatField(required=False, allow_null=True)

    contact_phone = serializers.CharField(max_length=17)
    alternate_phone = serializers.CharField(max_length=17, required=False, allow_blank=True)

    address = serializers.CharField()
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    pincode = serializers.CharField(max_length=10)

    medical_history = serializers.CharField(required=False, allow_blank=True)
    allergies = serializers.CharField(required=False, allow_blank=True)
    recent_illnesses = serializers.CharField(required=False, allow_blank=True)
    lifestyle = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value

    def create(self, validated_data):
        try:
            # 1. Create User
            user = User.objects.create_user(
                email=validated_data['email'],
                password=validated_data['password'],
                full_name=validated_data['full_name'],
                role='DONOR'
            )

            # 2. Extract Profile Data
            # We filter out email/password/role, everything else goes to profile
            profile_keys = [
                'full_name', 'date_of_birth', 'gender', 'blood_group',
                'weight_kg', 'height_cm', 'contact_phone', 'alternate_phone',
                'address', 'city', 'state', 'pincode',
                'medical_history', 'allergies', 'recent_illnesses', 'lifestyle'
            ]

            profile_data = {key: validated_data.get(key) for key in profile_keys}

            # 3. Create Donor Profile
            profile = DonorProfile.objects.create(user=user, **profile_data)

            # ✅ CRITICAL FIX: Return the Profile Instance, NOT a dictionary.
            # This allows the view to serialize the response correctly.
            return profile

        except Exception as e:
            # Cleanup user if profile creation failed to avoid orphan accounts
            if 'user' in locals():
                user.delete()
            raise serializers.ValidationError({"error": str(e)})

    # Helper to format the output response after creation
    def to_representation(self, instance):
        return {
            "user_id": instance.user.id,
            "email": instance.user.email,
            "full_name": instance.full_name,
            "message": "Donor registered successfully"
        }


# ─────────────── DONOR PROFILE SERIALIZER ─────────────── #
class DonorProfileSerializer(serializers.ModelSerializer):
    age = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DonorProfile
        fields = [
            'id', 'full_name', 'date_of_birth', 'age', 'gender', 'blood_group',
            'weight_kg', 'height_cm', 'contact_phone', 'alternate_phone',
            'address', 'city', 'state', 'pincode',
            'medical_history', 'allergies', 'recent_illnesses', 'lifestyle',
            'last_donation_date', 'total_donations',
            'is_verified', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'age', 'is_verified', 'created_at', 'updated_at', 'total_donations']

    def get_age(self, obj):
        import datetime
        today = datetime.date.today()
        dob = obj.date_of_birth
        # Handle string date
        if isinstance(dob, str):
            try:
                dob = datetime.date.fromisoformat(dob)
            except ValueError:
                return None
        if dob:
            return today.year - dob.year - (
                    (today.month, today.day) < (dob.month, dob.day)
            )
        return None


# ─────────────── DONATION RECORD SERIALIZER ─────────────── #
class DonationRecordSerializer(serializers.ModelSerializer):
    donor_name = serializers.CharField(source='donor.full_name', read_only=True)
    hospital_name = serializers.CharField(source='hospital.hospital_name', read_only=True)

    class Meta:
        model = DonationRecord
        fields = [
            'id', 'donor', 'donor_name', 'hospital', 'hospital_name',
            'blood_group', 'quantity',
            'donation_date', 'verified', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'donor_name', 'hospital_name']