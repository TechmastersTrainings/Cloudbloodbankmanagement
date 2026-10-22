from django.contrib import admin
from camps.models import DonationCamp, CampRegistration


@admin.register(DonationCamp)
class DonationCampAdmin(admin.ModelAdmin):
    list_display = ('camp_name', 'hospital', 'city', 'state', 'start_date', 'end_date', 'is_approved')
    list_filter = ('is_approved', 'state', 'start_date')
    search_fields = ('camp_name', 'hospital__hospital_name', 'city', 'state')
    ordering = ('-start_date',)
    readonly_fields = ('created_at',)


@admin.register(CampRegistration)
class CampRegistrationAdmin(admin.ModelAdmin):
    list_display = ('donor', 'camp', 'status', 'registered_at')
    list_filter = ('status', 'camp__hospital')
    search_fields = ('donor__full_name', 'camp__camp_name')
    ordering = ('-registered_at',)
    readonly_fields = ('registered_at',)