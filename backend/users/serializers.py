from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from django.utils.translation import gettext_lazy as _
from fcm_django.models import FCMDevice

from .models import SiteSupervisor

from rest_framework import serializers


class AuthTokenSerializer(serializers.Serializer):
    email = serializers.CharField(label=_("E-mail"), write_only=True)
    password = serializers.CharField(
        label=_("Password"),
        style={"input_type": "password"},
        trim_whitespace=False,
        write_only=True,
    )
    token = serializers.CharField(label=_("Token"), read_only=True)
    fcm_token = serializers.CharField(write_only=True, required=False)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")
        fcm_token = attrs.get("fcm_token")

        if email and password:
            user = authenticate(
                request=self.context.get("request"),
                email=email,
                password=password,
            )

            # The authenticate call simply returns None for is_active=False
            # users. (Assuming the default ModelBackend authentication
            # backend.)
            if not user:
                msg = _("Unable to log in with provided credentials.")
                raise serializers.ValidationError(msg, code="authorization")
        else:
            msg = _('Must include "username" and "password".')
            raise serializers.ValidationError(msg, code="authorization")

        if fcm_token:
            FCMDevice.objects.update_or_create(
                registration_id=fcm_token,
                defaults={
                    "user": user,
                    "active": True,
                },
            )

        attrs["user"] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = get_user_model()
        fields = (
            "first_name",
            "last_name",
            "phone",
            "email",
            "role",
            "id",
            "is_active",
        )


class UserUpdateCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = get_user_model()
        fields = (
            "first_name",
            "last_name",
            "phone",
            "email",
            "role",
            "id",
            "is_active",
            "password",
        )

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = get_user_model()(**validated_data)

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        is_active = validated_data.pop("is_active", None)

        if is_active is not None and is_active is False:
            FCMDevice.objects.filter(user=instance).delete()
            SiteSupervisor.objects.filter(user=instance).delete()

        instance.save()
        return instance


class UserDropdownSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()
    value = serializers.CharField(source="id")

    class Meta:
        model = get_user_model()
        fields = (
            "label",
            "value",
        )

    def get_label(self, obj):
        return f"{obj.first_name} {obj.last_name}"
