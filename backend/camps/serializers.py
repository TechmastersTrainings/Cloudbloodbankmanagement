from rest_framework import serializers
from .models import DonationCamp, CampRegistration


# ───────────────────────────────
# 🔹 DonationCamp Serializer
# ───────────────────────────────
class DonationCampSerializer(serializers.ModelSerializer):
    hospital_name = serializers.CharField(source="hospital.hospital_name", read_only=True)
    total_registrations = serializers.IntegerField(source="registrations.count", read_only=True)

    class Meta:
        model = DonationCamp
        fields = [
            "id",
            "camp_name",
            "description",
            "address",
            "city",
            "state",
            "pincode",
            "start_date",
            "end_date",
            "start_time",
            "end_time",
            "hospital",
            "hospital_name",
            "is_approved",
            "total_registrations",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "hospital",
            "hospital_name",
            "is_approved",
            "total_registrations",
            "created_at",
        ]

    def validate(self, data):
        import datetime

        start_date = data.get("start_date")
        end_date = data.get("end_date")
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError("End date cannot be before start date.")

        # Optional: ensure times are valid
        start_time = data.get("start_time")
        end_time = data.get("end_time")
        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError("End time must be after start time.")

        return data


# ───────────────────────────────
# 🔹 CampRegistration Serializer
# ───────────────────────────────
class CampRegistrationSerializer(serializers.ModelSerializer):
    donor_name = serializers.CharField(source="donor.full_name", read_only=True)
    camp_name = serializers.CharField(source="camp.camp_name", read_only=True)
    hospital_name = serializers.CharField(source="camp.hospital.hospital_name", read_only=True)
    city = serializers.CharField(source="camp.city", read_only=True)
    start_date = serializers.DateField(source="camp.start_date", read_only=True)
    end_date = serializers.DateField(source="camp.end_date", read_only=True)

    class Meta:
        model = CampRegistration
        fields = [
            "id",
            "camp",
            "camp_name",
            "hospital_name",
            "city",
            "start_date",
            "end_date",
            "donor",
            "donor_name",
            "status",
            "registered_at",
        ]
        read_only_fields = [
            "id",
            "camp_name",
            "hospital_name",
            "city",
            "start_date",
            "end_date",
            "donor_name",
            "registered_at",
        ]
