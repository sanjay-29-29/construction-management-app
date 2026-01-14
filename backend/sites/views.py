from rest_framework.generics import ListAPIView
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from users.models import Roles

from .serializers import (
    ListSiteSerializer,
    SiteDropdownSerializer,
    RetrieveSiteSerializer,
    CreateSiteSerializer,
)
from .models import Site


class SiteViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Site.objects.all().reverse()

        if self.action == "retrieve":
            queryset = queryset.prefetch_related("supervisors")

        # Return all sites for head office
        if (
            self.request.user.role == Roles.HEAD_OFFICE
            or self.request.user.role == Roles.ADMIN
        ):
            return queryset

        # Filter based on user
        queryset = queryset.filter(supervisors__in=[self.request.user])

        return queryset

    def get_serializer_class(self):
        if self.action == "list":
            return ListSiteSerializer
        if self.action == "retrieve":
            return RetrieveSiteSerializer
        return CreateSiteSerializer


class SiteDropdown(ListAPIView):
    queryset = Site.objects.filter(is_active=True)
    serializer_class = SiteDropdownSerializer
