import uuid
from django.db import models
from django_resized import ResizedImageField

from sites import models as sites_models


class LabourType(models.IntegerChoices):
    DAILY_WORK = 1, "Daily Work"
    RATE_WORK = 2, "Rate Work"


class GenderType(models.IntegerChoices):
    MALE = 1, "Male"
    FEMALE = 2, "Female"


class Labour(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    site = models.ForeignKey(
        sites_models.Site,
        on_delete=models.CASCADE,
        related_name="labours",
    )
    name = models.CharField(max_length=150)
    previous_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    pan_number = models.CharField(max_length=12, blank=True)
    aadhar_number = models.CharField(max_length=12, blank=True)
    bank_account_number = models.CharField(max_length=24, blank=True)
    ifsc_code = models.CharField(max_length=30, blank=True)
    branch_name = models.CharField(max_length=30, blank=True)
    type = models.IntegerField(choices=LabourType.choices)
    gender = models.IntegerField(choices=GenderType.choices)
    photo = ResizedImageField(
        quality=80,
        upload_to="labours/pfp/",
        force_format="webp",
        blank=True,
    )

    def __str__(self):
        return f"{self.name} {self.site}"


class LabourDocument(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    labour = models.ForeignKey(
        Labour,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    file_name = models.CharField(max_length=100, blank=True)
    document = models.FileField(
        upload_to="labours/documents/",
        blank=True,
    )

    def __str__(self):
        return f"{self.labour} {self.id}"
