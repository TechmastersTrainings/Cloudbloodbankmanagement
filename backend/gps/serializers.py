#C:\Users\sachi\PycharmProjects\cloud_bloodbank_backendmanage\gps\serializers.py

from rest_framework import serializers


class NearbyHospitalSerializer(serializers.Serializer):
    hospital_id = serializers.IntegerField()
    hospital_name = serializers.CharField()
    hospital_type = serializers.CharField()
    address = serializers.CharField()
    city = serializers.CharField()
    state = serializers.CharField()
    pincode = serializers.CharField()
    contact_person = serializers.CharField()
    contact_phone = serializers.CharField()
    blood_group = serializers.CharField()
    available_units = serializers.IntegerField()
    distance_km = serializers.FloatField()
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
