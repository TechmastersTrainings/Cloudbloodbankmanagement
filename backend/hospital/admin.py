from django.contrib import admin
from hospital.models import HospitalProfile


@admin.register(HospitalProfile)
class HospitalProfileAdmin(admin.ModelAdmin):
    list_display = ('hospital_name', 'registration_number', 'city', 'state', 'is_verified')
    search_fields = ('hospital_name', 'registration_number', 'city', 'state')
    list_filter = ('state', 'is_verified')
