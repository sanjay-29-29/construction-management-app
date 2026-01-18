import uuid
from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model
from django_resized import ResizedImageField

from sites.models import Site
from vendors.models import Vendor


class Order(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    number = models.CharField(max_length=150)
    name = models.CharField(max_length=150)

    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name="orders")
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name="orders")

    cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_completed = models.BooleanField(default=False)
    completed_by = models.ForeignKey(
        get_user_model(), null=True, blank=True, on_delete=models.SET_NULL
    )
    completed_at = models.DateTimeField(null=True, blank=True)

    remarks = models.CharField(max_length=300, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if self.is_completed and self.completed_at is None:
            self.completed_at = timezone.now()
        elif not self.is_completed:
            self.completed_at = None
            self.completed_by = None
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} | {self.site}"


class OrderImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="images")
    image = ResizedImageField(quality=80, upload_to="orders/", force_format="webp")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def delete(self, *args, **kwargs):
        if self.image:
            self.image.delete(save=False)
        super().delete(*args, **kwargs)


class Material(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="materials")

    name = models.CharField(max_length=100)
    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )
    received_quantity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    unit = models.CharField(max_length=10)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.quantity} {self.unit})"
