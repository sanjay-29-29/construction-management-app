import uuid
from django.contrib.auth import get_user_model
from django.db import models
from phonenumber_field.modelfields import PhoneNumberField
from django.contrib.auth.models import AbstractUser


from sites.models import Site

from .managers import CustomUserManager


class Roles(models.IntegerChoices):
    HEAD_OFFICE = 1, "Head Office"
    SITE_ENGINEER = 2, "Site Engineer"


class CustomUser(AbstractUser):
    REQUIRED_FIELDS = []
    USERNAME_FIELD = "email"

    username = None

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.IntegerField(choices=Roles.choices, default=Roles.SITE_ENGINEER)
    email = models.EmailField(null=False, blank=False, unique=True)
    phone = PhoneNumberField(region="IN", null=True)
    sites = models.ManyToManyField(
        Site, through="SiteSupervisor", related_name="supervisors"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class SiteSupervisor(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    site = models.ForeignKey(Site, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.user} {self.site}"
