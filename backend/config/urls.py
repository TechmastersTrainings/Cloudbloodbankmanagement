#C:\Users\sachi\PycharmProjects\cloud_bloodbank_backendmanage\config\urls.py
from django.contrib import admin
from django.urls import path, include

# API v1 patterns
api_v1_patterns = [
    path('accounts/', include('accounts.urls')),
    path('hospital/', include('hospital.urls')),
    path('donor/', include('donor.urls')),
    path('receiver/', include('receiver.urls')),
    path('blood/', include('blood.urls')),
    path('gps/', include('gps.urls')),
    path('adminpanel/', include('adminpanel.urls')),
    path('camps/', include('camps.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(api_v1_patterns)),
    # Legacy support - redirect old paths to v1
    path('api/accounts/', include('accounts.urls')),
    path('api/hospital/', include('hospital.urls')),
    path('api/donor/', include('donor.urls')),
    path('api/receiver/', include('receiver.urls')),
    path('api/blood/', include('blood.urls')),
    path('api/gps/', include('gps.urls')),
    path('api/adminpanel/', include('adminpanel.urls')),
    path('api/camps/', include('camps.urls')),
]
