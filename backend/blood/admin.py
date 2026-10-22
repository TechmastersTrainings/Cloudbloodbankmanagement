from django.contrib import admin
from blood.models import BloodStock, BloodRequest, DonationRecord, DonationAppointment

@admin.register(BloodStock)
class BloodStockAdmin(admin.ModelAdmin):
    list_display = ('hospital', 'blood_group', 'quantity', 'last_updated')
    list_filter = ('hospital', 'blood_group')

@admin.register(BloodRequest)
class BloodRequestAdmin(admin.ModelAdmin):
    list_display = ('receiver', 'hospital', 'blood_group', 'quantity_requested', 'status')
    list_filter = ('status', 'blood_group')

@admin.register(DonationRecord)
class DonationRecordAdmin(admin.ModelAdmin):
    list_display = ('donor', 'hospital', 'blood_group', 'quantity', 'verified')
    list_filter = ('verified', 'blood_group')

@admin.register(DonationAppointment)
class DonationAppointmentAdmin(admin.ModelAdmin):
    list_display = ('donor', 'hospital', 'blood_group', 'appointment_date', 'status')
    list_filter = ('status', 'blood_group')