from rest_framework import permissions

class IsHospital(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'HOSPITAL')


class IsAdminOrHospital(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.role == 'ADMIN' or request.user.role == 'HOSPITAL')
        )
