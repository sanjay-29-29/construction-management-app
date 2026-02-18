import uuid
from django.db import models

from rate_work import models as rate_work_models


class VendorPayment(rate_work_models.Payment):
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
    bank_account_number = models.CharField(max_length=24, blank=True)
    gst_number = models.CharField(max_length=15, blank=True)
    ifsc_code = models.CharField(max_length=30, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name}"
