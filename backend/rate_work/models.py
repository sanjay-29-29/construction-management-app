import uuid
from django.db import models

from labours import models as labours_models
from sites import models as sites_models


class RateWork(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    name = models.CharField(max_length=100)
    site = models.ForeignKey(
        sites_models.Site,
        on_delete=models.CASCADE,
        related_name="rate_works",
    )
    labour = models.ForeignKey(
        labours_models.Labour,
        on_delete=models.CASCADE,
        related_name="rate_works",
    )
    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    unit = models.CharField(max_length=30)
    cost_per_unit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    is_completed = models.BooleanField(default=False)

    @property
    def total_cost(self):
        return self.quantity * self.amount

    def __str__(self):
        return f"{self.name} {self.labour}"


class Payment(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    date_created = models.DateField(auto_now_add=True)
    note = models.CharField(
        max_length=100,
        default="",
        blank=True,
    )

    def __str__(self):
        return f"{self.date_created} {self.amount}"


class RatePayment(Payment):
    rate_work = models.ForeignKey(
        RateWork,
        on_delete=models.CASCADE,
        related_name="payments",
    )

    def __str__(self):
        return f"{self.rate_work} {super().__str__()}"
