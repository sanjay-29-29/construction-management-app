from django_filters import rest_framework as filters

from . import models as models


class LabourFilter(filters.FilterSet):
    class Meta:
        model = models.Labour
        fields = [
            "type",
        ]
