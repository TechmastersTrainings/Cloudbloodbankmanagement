from django.contrib import admin
from receiver.models import ReceiverProfile

@admin.register(ReceiverProfile)
class ReceiverProfileAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'user', 'blood_group', 'city', 'state', 'pincode')
    search_fields = ('full_name', 'user__email', 'city', 'state')
    list_filter = ('blood_group', 'state')
