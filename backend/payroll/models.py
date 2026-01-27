import uuid
from datetime import timedelta

from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from labours import models as labours_models
from sites import models as sites_models


class PaymentType(models.IntegerChoices):
    BANK_TRANSFER = 1, "Bank Transfer"
    CASH = 2, "Cash"


class DailyEntry(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    week = models.ForeignKey(
        "Week",
        related_name="days",
        on_delete=models.CASCADE,
    )
    date = models.DateField()
    # Admin uses this to reopen a day
    admin_unlocked = models.BooleanField(default=False, blank=True)
    is_saved = models.BooleanField(default=False)

    @property
    def is_editable(self):
        # Editable if it's today OR if an admin specifically unlocked it
        if self.admin_unlocked:
            return True
        return self.date == timezone.now().date() and not self.is_saved

    class Meta:
        unique_together = ["week", "date"]
        ordering = ["date"]

    def __str__(self):
        return f"{self.date} - {self.week}"


class Week(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    site = models.ForeignKey(
        sites_models.Site,
        related_name="week",
        on_delete=models.CASCADE,
    )
    start_date = models.DateField(help_text="Must be a Saturday")
    labours = models.ManyToManyField(
        labours_models.Labour,
        related_name="weeks",
        through="WeekLabourAssignment",
    )
    admin_unlocked = models.BooleanField(default=True)

    @property
    def is_editable(self):
        return self.admin_unlocked

    class Meta:
        unique_together = ["site", "start_date"]

    def save(self, *args, **kwargs):
        # Check if this is a new record before calling super()
        is_new = self._state.adding

        super().save(*args, **kwargs)

        if is_new:
            if not self.days.exists():
                daily_entries = []
                for i in range(7):
                    current_date = self.start_date + timedelta(days=i)
                    daily_entries.append(DailyEntry(week=self, date=current_date))
                DailyEntry.objects.bulk_create(daily_entries)

    def clean(self):
        if self.start_date and self.start_date.weekday() != 5:
            raise ValidationError("The start date must be a Saturday.")

    @property
    def end_date(self):
        return self.start_date + timedelta(days=6)

    def __str__(self):
        return f"Week of {self.start_date} to {self.end_date}"


class WeekLabourAssignment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    week = models.ForeignKey(Week, on_delete=models.CASCADE)
    labour = models.ForeignKey(
        labours_models.Labour,
        on_delete=models.CASCADE,
        related_name="assignments",
    )
    weekly_daily_wage = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="The fixed daily wage for this labourer during this specific week.",
    )

    class Meta:
        unique_together = ["week", "labour"]

    def __str__(self):
        return f"{self.labour} - {self.week} (@ {self.weekly_daily_wage})"


class LabourPayment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    labour = models.OneToOneField(
        WeekLabourAssignment,
        on_delete=models.CASCADE,
        related_name="week_payment",
    )
    amount_paid = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )
    payment_type = models.IntegerField(
        choices=PaymentType,
        default=PaymentType.BANK_TRANSFER,
        blank=True,
    )

    def __str__(self):
        return f"{self.labour} {self.amount_paid}"


class LabourAttendance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    daily_entry = models.ForeignKey(
        DailyEntry,
        on_delete=models.CASCADE,
        related_name="attendances",
    )
    labour = models.ForeignKey(
        labours_models.Labour,
        on_delete=models.CASCADE,
        related_name="attendance_records",
    )
    is_present = models.BooleanField(default=False)
    payment_type = models.IntegerField(
        choices=PaymentType,
        default=PaymentType.BANK_TRANSFER,
        blank=True,
    )
    advance_taken = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )
    multiplier = models.FloatField(default=1, blank=True)

    class Meta:
        # Prevent double entry for same person same day
        unique_together = [
            "daily_entry",
            "labour",
        ]

    @property
    def net_pay(self):
        # return self.wage_for_day - self.advance_taken
        return 0

    def __str__(self):
        return f"{self.labour.name} on {self.daily_entry.date}"
