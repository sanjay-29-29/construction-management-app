from rest_framework import status
from rest_framework.generics import ListAPIView
from django.contrib.auth import get_user_model
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken import views

from .serializers import (
    AuthTokenSerializer,
    UserSerializer,
    UserDropdownSerializer,
    UserUpdateCreateSerializer,
)

from .models import Roles


class LoginView(views.ObtainAuthToken):
    serializer_class = AuthTokenSerializer


class ObtainBaseInfo(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get(self, request, *args, **kwargs):
        serializer = self.serializer_class(request.user)
        return Response(serializer.data)


class UserViewSet(viewsets.ModelViewSet):
    queryset = get_user_model().objects.filter(is_active=True)

    def get_serializer_class(self):
        if self.action == "list" or self.action == "retrieve":
            return UserSerializer
        return UserUpdateCreateSerializer


class SupervisorDropdown(ListAPIView):
    queryset = get_user_model().objects.filter(role=Roles.SITE_ENGINEER, is_active=True)
    serializer_class = UserDropdownSerializer


class HealthCheck(APIView):
    def get(self, request, *args, **kwargs):
        return Response(status=status.HTTP_200_OK)
