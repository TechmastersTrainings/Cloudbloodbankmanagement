#C:\Users\sachi\PycharmProjects\cloud_bloodbank_backendmanage\donor\admin.py
from django.contrib import admin
from donor.models import DonorProfile
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from core.permissions import IsAdmin

@admin.register(DonorProfile)
class DonorProfileAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'user', 'blood_group', 'city', 'state', 'is_verified')
    search_fields = ('full_name', 'user__email', 'city', 'state')
    list_filter = ('blood_group', 'state')

class DonorApprovalView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = DonorProfile.objects.all()

    def patch(self, request, *args, **kwargs):
        donor = self.get_object()
        donor.is_verified = request.data.get("is_verified", donor.is_verified)
        donor.save()
        return Response({"detail": "Donor status updated successfully."}, status=status.HTTP_200_OK)
