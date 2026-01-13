import uuid
from django.db import models
from django.utils import timezone
from datetime import timedelta
from django_resized import ResizedImageField
from django.core.exceptions import ValidationError


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
        "Labour",
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
    admin_unlocked = models.BooleanField(default=False)
    is_saved = models.BooleanField(default=False)

    @property
    def is_editable(self):
        # return True
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
        "Labour",
        related_name="weeks",
        through="WeekLabourAssignment",
    )

    class Meta:
        unique_together = ["site", "start_date"]

    def save(self, *args, **kwargs):
        # Check if this is a new record before calling super()
        is_new = self._state.adding

        super().save(*args, **kwargs)

        if is_new:
            # Optimization: Check if days already exist to prevent double-creation
            if not self.days.exists():
                daily_entries = []
                for i in range(7):
                    current_date = self.start_date + timedelta(days=i)
                    daily_entries.append(DailyEntry(week=self, date=current_date))
                # bulk_create is much faster and more reliable
                DailyEntry.objects.bulk_create(daily_entries)

    def clean(self):
        if self.start_date and self.start_date.weekday() != 5:
            raise ValidationError("The start date must be a Saturday.")

    @property
    def end_date(self):
        return self.start_date + timedelta(days=6)

    def __str__(self):
        return f"Week of {self.start_date} to {self.end_date}"


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


class WeekLabourAssignment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    week = models.ForeignKey(Week, on_delete=models.CASCADE)
    labour = models.ForeignKey(
        Labour, on_delete=models.CASCADE, related_name="assignments"
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


class LabourAttendance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    daily_entry = models.ForeignKey(
        DailyEntry,
        on_delete=models.CASCADE,
        related_name="attendances",
    )
    labour = models.ForeignKey(
        Labour, on_delete=models.CASCADE, related_name="attendance_records"
    )

    is_present = models.BooleanField(default=False)

    wage_for_day = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )
    advance_taken = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    class Meta:
        # Prevent double entry for same person same day
        unique_together = [
            "daily_entry",
            "labour",
        ]

    @property
    def net_pay(self):
        return self.wage_for_day - self.advance_taken

    def __str__(self):
        return f"{self.labour.name} on {self.daily_entry.date}"
