from rest_framework import serializers
from django.contrib.auth import get_user_model
from hospital.models import HospitalProfile
from blood.models import BloodStock

User = get_user_model()


class HospitalRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    full_name = serializers.CharField(max_length=255)
    hospital_name = serializers.CharField(max_length=255)
    registration_number = serializers.CharField(max_length=100)
    contact_number = serializers.CharField(max_length=20)
    address = serializers.CharField()
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    pincode = serializers.CharField(max_length=10)
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)
    hospital_type = serializers.CharField(max_length=50, required=False, allow_blank=True, allow_null=True)
    number_of_beds = serializers.IntegerField(required=False, allow_null=True)
    blood_storage_capacity_pints = serializers.IntegerField(required=False, allow_null=True)
    operating_hours = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    email_official = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    website = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    contact_person = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            full_name=validated_data["full_name"],
            role="HOSPITAL"
        )

        HospitalProfile.objects.create(
            user=user,
            hospital_name=validated_data["hospital_name"],
            registration_number=validated_data["registration_number"],
            contact_number=validated_data["contact_number"],
            address=validated_data["address"],
            city=validated_data["city"],
            state=validated_data["state"],
            pincode=validated_data["pincode"],
            latitude=validated_data.get("latitude"),
            longitude=validated_data.get("longitude"),
            hospital_type=validated_data.get("hospital_type"),
            number_of_beds=validated_data.get("number_of_beds"),
            blood_storage_capacity_pints=validated_data.get("blood_storage_capacity_pints"),
            operating_hours=validated_data.get("operating_hours"),
            email_official=validated_data.get("email_official"),
            website=validated_data.get("website"),
            contact_person=validated_data.get("contact_person"),
        )
        return user


class HospitalProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    role = serializers.CharField(source="user.role", read_only=True)

    class Meta:
        model = HospitalProfile
        fields = [
            "id", "email", "full_name", "role",
            "hospital_name", "registration_number", "contact_number",
            "address", "city", "state", "pincode",
            "latitude", "longitude", "is_verified", "created_at",
            "hospital_type", "number_of_beds", "blood_storage_capacity_pints",
            "operating_hours", "email_official", "website", "contact_person"
        ]
        read_only_fields = ["id", "email", "full_name", "role", "is_verified", "created_at"]


class BloodStockSerializer(serializers.ModelSerializer):
    hospital_name = serializers.CharField(source="hospital.hospital_name", read_only=True)

    class Meta:
        model = BloodStock
        fields = ["id", "hospital", "hospital_name", "blood_group", "quantity", "last_updated"]
        read_only_fields = ["id", "hospital", "hospital_name", "last_updated"]
