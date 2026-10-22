#C:\Users\sachi\PycharmProjects\cloud_bloodbank_backendmanage\gps\urls.py
from django.urls import path
from .views import NearbyHospitalLocator

urlpatterns = [
    path('nearby/', NearbyHospitalLocator.as_view(), name='gps-nearby'),
]
