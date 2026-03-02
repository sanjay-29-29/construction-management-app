from django.contrib import admin

from . import models as models


@admin.register(models.Head)
class HeadAdmin(admin.ModelAdmin):
    pass


@admin.register(models.Entry)
class EntryAdmin(admin.ModelAdmin):
    pass
