from django.db.models.signals import m2m_changed
from django.dispatch import receiver
from .models import Week, LabourAttendance


@receiver(m2m_changed, sender=Week.labours.through)
def manage_labour_attendance(_sender, instance, action, pk_set, **kwargs):
    # Action: When Labours are ADDED to the week
    if action == "post_add":
        days = instance.days.all()
        for labour_id in pk_set:
            for day in days:
                # Creates records if they don't exist
                LabourAttendance.objects.get_or_create(
                    daily_entry=day,
                    labour_id=labour_id,
                )

    # Action: When Labours are REMOVED from the week
    elif action == "post_remove":
        day_ids = instance.days.values_list("id", flat=True)

        # Delete all attendance records for the removed labourers in this week
        LabourAttendance.objects.filter(
            daily_entry_id__in=day_ids, labour_id__in=pk_set
        ).delete()
