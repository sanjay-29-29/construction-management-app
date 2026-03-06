import uuid
from django.db import models

from sites import models as sites_models
from users import models as users_models
from payroll import models as payroll_models


class Head(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    site = models.ForeignKey(
        to=sites_models.Site,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_common = models.BooleanField(default=False, blank=True)
    is_deleted = models.BooleanField(default=False, blank=True)

    def __str__(self):
        return f"{self.name}"


class Entry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    description = models.CharField(max_length=200)
    head = models.ForeignKey(to=Head, on_delete=models.CASCADE)
    site = models.ForeignKey(to=sites_models.Site, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    payment_type = models.IntegerField(
        choices=payroll_models.PaymentType,
        default=payroll_models.PaymentType.BANK_TRANSFER,
        blank=True,
    )
    reference = models.CharField(max_length=200, default="")
    amount_cr = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )
    amount_db = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )
    created_by = models.ForeignKey(
        to=users_models.CustomUser,
        on_delete=models.CASCADE,
    )

    def __str__(self):
        return f"{self.head.name}-{self.description}-{self.amount_cr}-{self.amount_db}"
