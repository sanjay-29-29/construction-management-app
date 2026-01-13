import uuid
from django.db import models

from payroll import models as payroll_models


class VendorPayment(payroll_models.Payment):
    vendor = models.ForeignKey(
        "Vendor",
        on_delete=models.CASCADE,
        related_name="payments",
    )

    def __str__(self):
        return f"{self.vendor} {super().__str__()}"


class Vendor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=30)
    address = models.CharField(max_length=300)
    notes = models.CharField(max_length=1000, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name}"
