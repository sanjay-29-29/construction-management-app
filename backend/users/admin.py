from django.contrib import admin
from django import forms
from phonenumber_field.widgets import PhoneNumberPrefixWidget

from .models import CustomUser, SiteSupervisor


@admin.register(CustomUser)
class UserAdmin(admin.ModelAdmin):
    list_display = ("email", "username", "is_staff", "is_active")

    def save_model(self, request, obj, form, change):
        if not change:
            obj.set_password(obj.password)
        elif "password" in form.changed_data:
            obj.set_password(obj.password)
        super().save_model(request, obj, form, change)


@admin.register(SiteSupervisor)
class SiteSupervisorAdmin(admin.ModelAdmin):
    pass
