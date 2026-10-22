# accounts/urls.py
from django.urls import path
from .views import RegisterView, LoginView, UserListView, SystemStatsView  # <-- Added SystemStatsView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # 🔹 User management
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('users/', UserListView.as_view(), name='users'),

    # 🔹 Homepage Stats
    path('stats/', SystemStatsView.as_view(), name='system-stats'), # <-- Added this route

    # 🔹 JWT Token handling
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]