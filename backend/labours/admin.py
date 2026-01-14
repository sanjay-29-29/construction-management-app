from django.contrib import admin

from . import models as models


@admin.register(models.Labour)
class LabourAdmin(admin.ModelAdmin):
    pass


@admin.register(models.LabourDocument)
class LabourDocumentAdmin(admin.ModelAdmin):
    pass
