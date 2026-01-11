from rest_framework.permissions import BasePermission

from users.models import Roles


class IsHeadOffice(BasePermission):
    message = "Only Head Office users can create sites."

    def has_permission(self, request, view):
        if (
            view.action == "create"
            or view.action == "delete"
            or view.action == "update"
            or view.action == "partial_update"
        ):
            return request.user.role != Roles.HEAD_OFFICE
        return True
