from rest_framework import serializers
from blood.models import BloodStock, BloodRequest, DonationRecord, DonationAppointment

class BloodStockSerializer(serializers.ModelSerializer):
    hospital_name = serializers.CharField(source='hospital.hospital_name', read_only=True)

    class Meta:
        model = BloodStock
        fields = ['id', 'hospital', 'hospital_name', 'blood_group', 'quantity', 'last_updated']
        read_only_fields = ['id', 'hospital', 'hospital_name', 'last_updated']


class BloodRequestSerializer(serializers.ModelSerializer):
    receiver_name = serializers.CharField(source='receiver.full_name', read_only=True)
    hospital_name = serializers.CharField(source='hospital.hospital_name', read_only=True)

    class Meta:
        model = BloodRequest
        fields = [
            'id', 'receiver', 'receiver_name', 'hospital', 'hospital_name',
            'blood_group', 'quantity_requested', 'urgency_level',
            'status', 'requested_at', 'updated_at'
        ]
        read_only_fields = ['id', 'receiver', 'status', 'requested_at', 'updated_at', 'receiver_name', 'hospital_name']


class DonationRecordSerializer(serializers.ModelSerializer):
    donor_name = serializers.CharField(source='donor.full_name', read_only=True)
    hospital_name = serializers.CharField(source='hospital.hospital_name', read_only=True)

    class Meta:
        model = DonationRecord
        fields = [
            'id', 'donor', 'donor_name', 'hospital', 'hospital_name',
            'blood_group', 'quantity', 'donation_date', 'verified', 'created_at'
        ]
        read_only_fields = ['id', 'donation_date', 'created_at', 'donor_name', 'hospital_name']


class DonationAppointmentSerializer(serializers.ModelSerializer):
    donor_name = serializers.CharField(source='donor.full_name', read_only=True)
    hospital_name = serializers.CharField(source='hospital.hospital_name', read_only=True)

    class Meta:
        model = DonationAppointment
        fields = [
            'id', 'donor', 'donor_name', 'hospital', 'hospital_name',
            'blood_group', 'appointment_date', 'appointment_time',
            'quantity_pints', 'status', 'remarks', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'donor_name', 'hospital_name', 'donor']