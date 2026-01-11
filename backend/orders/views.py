from rest_framework import status
from rest_framework.response import Response
from django.db import transaction
from rest_framework.generics import GenericAPIView, get_object_or_404, DestroyAPIView
from rest_framework.viewsets import ModelViewSet
from datetime import time, datetime
from rest_framework import generics
from django.db.models import Q
from django.http import JsonResponse
import json

from .models import Order, OrderImage

from .serializers import (
    OrderSerializer,
    OrderListSerializer,
    OrderRetrieveSerializer,
    OrderImageCreateSerializer,
)


class OrderViewSet(ModelViewSet):
    queryset = (
        Order.objects.all()
        .select_related("site", "vendor")
        .prefetch_related("materials", "images")
    )

    def get_serializer_class(self):
        if self.action == "list" or self.action == "retrieve":
            return OrderRetrieveSerializer
        return OrderSerializer

    def destroy(self, request, *args, **kwargs):
        with transaction.atomic():
            order = self.get_object()

            for image in order.images.all():
                image.delete()
        return super().destroy(request, *args, **kwargs)


class ListOrder(generics.ListAPIView):
    serializer_class = OrderListSerializer

    def get_queryset(self):
        queryset = Order.objects.select_related("site", "vendor").prefetch_related(
            "materials"
        )

        # -----------------------------
        # AG-GRID FILTERING
        # -----------------------------
        filter_params = self.request.GET.get("filter")

        if filter_params:
            filters = json.loads(filter_params)
            q_objects = Q()

            FIELD_MAP = {
                "name": "name",
                "vendor": "vendor__name",
                "site": "site__name",
                "createdAt": "created_at",
                "isCompleted": "is_completed",
            }

            for key, filter_info in filters.items():
                field = FIELD_MAP.get(key, key)

                filter_type = filter_info.get("filterType")  # IMPORTANT
                operator = filter_info.get("type")

                # --------------------
                # TEXT FILTERS
                # --------------------
                if filter_type == "text":
                    value = filter_info.get("filter")

                    if operator == "contains":
                        q_objects &= Q(**{f"{field}__icontains": value})

                    elif operator == "equals":
                        q_objects &= Q(**{f"{field}__iexact": value})

                    elif operator == "notEqual":
                        q_objects &= ~Q(**{f"{field}__iexact": value})

                    elif operator == "startsWith":
                        q_objects &= Q(**{f"{field}__istartswith": value})

                    elif operator == "endsWith":
                        q_objects &= Q(**{f"{field}__iendswith": value})

                # --------------------
                # NUMBER FILTERS
                # --------------------
                elif filter_type == "number":
                    value = filter_info.get("filter")
                    value_to = filter_info.get("filterTo")

                    if operator == "equals":
                        q_objects &= Q(**{field: value})

                    elif operator == "greaterThan":
                        q_objects &= Q(**{f"{field}__gt": value})

                    elif operator == "lessThan":
                        q_objects &= Q(**{f"{field}__lt": value})

                    elif operator == "inRange":
                        q_objects &= Q(**{f"{field}__range": (value, value_to)})

                # --------------------
                # DATE FILTERS ✅ FIX HERE
                # --------------------
                elif filter_type == "date":
                    date_from = filter_info.get("dateFrom")
                    date_to = filter_info.get("dateTo")

                    if not date_from:
                        continue

                    # Convert string → date
                    date_from = datetime.fromisoformat(date_from).date()

                    # Create naive datetimes (NO timezone)
                    start_dt = datetime.combine(date_from, time.min)
                    end_dt = datetime.combine(date_from, time.max)

                    if operator == "equals":
                        q_objects &= Q(
                            **{
                                f"{field}__gte": start_dt,
                                f"{field}__lte": end_dt,
                            }
                        )

                    elif operator == "inRange" and date_to:
                        date_to = datetime.fromisoformat(date_to).date()
                        range_start = datetime.combine(date_from, time.min)
                        range_end = datetime.combine(date_to, time.max)

                        q_objects &= Q(
                            **{
                                f"{field}__gte": range_start,
                                f"{field}__lte": range_end,
                            }
                        )
            queryset = queryset.filter(q_objects)

        sort_params = self.request.GET.get("sort")

        if sort_params:
            sort_objects = json.loads(sort_params)
            sort_fields = []

            SORT_FIELD_MAP = {
                "name": "name",
                "vendor": "vendor__name",
                "site": "site__name",
                "createdAt": "created_at",
                "isCompleted": "is_completed",
            }

            for sort_object in sort_objects:
                col_id = sort_object["colId"]
                sort_order = sort_object["sort"]

                field = SORT_FIELD_MAP.get(col_id, col_id)

                if sort_order == "asc":
                    sort_fields.append(field)
                else:
                    sort_fields.append(f"-{field}")

            queryset = queryset.order_by(*sort_fields)

        return queryset


class ListOrderBySite(ListOrder):
    def get_queryset(self):
        site_id = self.kwargs.get("site_id")
        queryset = super().get_queryset().filter(site_id=site_id)
        return queryset

    def list(self, request, *args, **kwargs):
        start_row = int(request.GET.get("startRow", 0))
        end_row = int(request.GET.get("endRow", 100))

        queryset = self.get_queryset()
        total_rows = queryset.count()
        queryset = queryset[start_row:end_row]

        serializer = self.get_serializer(queryset, many=True)

        return JsonResponse({"rows": serializer.data, "totalRows": total_rows})


class ListOrderByVendor(ListOrder):
    def get_queryset(self):
        vendor_id = self.kwargs.get("vendor_id")
        queryset = super().get_queryset().filter(vendor_id=vendor_id)
        return queryset

    def list(self, request, *args, **kwargs):
        start_row = int(request.GET.get("startRow", 0))
        end_row = int(request.GET.get("endRow", 100))

        queryset = self.get_queryset()
        total_rows = queryset.count()
        queryset = queryset[start_row:end_row]

        serializer = self.get_serializer(queryset, many=True)

        return JsonResponse({"rows": serializer.data, "totalRows": total_rows})


class OrderImageUploadView(GenericAPIView):

    serializer_class = OrderImageCreateSerializer

    def post(self, request, order_id):
        order = get_object_or_404(Order, id=order_id)

        serializer = self.get_serializer(
            data={"images": request.FILES.getlist("images")},
            context={"order": order},
        )
        serializer.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                serializer.save()
        except Exception:
            raise

        return Response(
            {"detail": "Images uploaded successfully"},
            status=status.HTTP_201_CREATED,
        )


class OrderImageDeleteView(DestroyAPIView):
    lookup_url_kwarg = "image_id"

    def get_queryset(self):
        order_id = self.kwargs["order_id"]
        return OrderImage.objects.filter(order_id=order_id)
