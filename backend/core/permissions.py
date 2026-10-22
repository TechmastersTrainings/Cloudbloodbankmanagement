from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """Allow access only to Admin users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')


class IsHospital(permissions.BasePermission):
    """Allow access only to Hospital users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'HOSPITAL')


class IsDonor(permissions.BasePermission):
    """Allow access only to Donor users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'DONOR')


class IsReceiver(permissions.BasePermission):
    """Allow access only to Receiver users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'RECEIVER')


class IsAdminOrHospital(permissions.BasePermission):
    """Allow access to Admin and Hospital users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['ADMIN', 'HOSPITAL'])


class IsAdminOrDonor(permissions.BasePermission):
    """Allow access to Admin and Donor users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['ADMIN', 'DONOR'])


class IsAdminOrReceiver(permissions.BasePermission):
    """Allow access to Admin and Receiver users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['ADMIN', 'RECEIVER'])
