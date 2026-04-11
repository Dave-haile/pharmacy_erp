import csv
import hashlib
import io
import json
import re
import zipfile
from datetime import datetime, time, timedelta
from decimal import Decimal, InvalidOperation
from xml.etree import ElementTree as ET
from xml.sax.saxutils import escape as xml_escape

from django.core.cache import cache
from django.core.paginator import EmptyPage, Paginator
from django.db import transaction
from django.db.models import Count, DecimalField, IntegerField, Q, Sum, Value
from django.db.models.deletion import ProtectedError
from django.db.models.functions import Coalesce
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from tables.model_definitions import (
    Batches,
    Category,
    CostLayer,
    ExpiryConfig,
    ExpiryNotification,
    GoodRecivingNote,
    GoodRecivingNoteItem,
    Inventory,
    InventoryValuation,
    Medicine,
    Purchase,
    PurchaseItem,
    PrintFormat,
    ReorderAlert,
    ReorderConfig,
    Sale,
    SaleItem,
    SalesReturn,
    SalesReturnItem,
    StockAdjustment,
    StockAdjustmentItem,
    StockEntry,
    StockEntryItem,
    StockLedger,
    StockTake,
    StockTakeItem,
    Supplier,
    SupplierReturn,
    SupplierReturnItem,
    SystemConfig,
)
from tables.model_definitions.user_log import UserLog
from .costing import (
    calculate_cogs,
    consume_stock,
    add_stock_layer,
    InsufficientStockError,
    CostingMethodError,
)


class DashboardStatsView:
    pass


EXPIRY_SOON_DEFAULT_DAYS = 90
LOW_STOCK_DEFAULT_THRESHOLD = 10


def _require_roles(request, allowed_roles):
    role = getattr(request.user, "role", None)
    if role in allowed_roles:
        return None
    return JsonResponse(
        {"error": "You do not have permission to perform this action."}, status=403
    )


def _compact_text(value):
    return " ".join(str(value or "").split())


def _truncate_text(value, max_length=120):
    value = _compact_text(value)
    if len(value) <= max_length:
        return value
    return f"{value[: max_length - 3].rstrip()}..."


def _summarize_log_details(details):
    if not details:
        return ""

    try:
        parsed = json.loads(details)
    except (TypeError, ValueError):
        return _truncate_text(details)

    if not isinstance(parsed, dict):
        return _truncate_text(parsed)

    preferred_keys = (
        "name",
        "invoice_number",
        "posting_number",
        "status",
        "current_status",
        "previous_status",
    )
    summary_parts = []
    for key in preferred_keys:
        value = parsed.get(key)
        if value in (None, "", [], {}):
            continue
        label = key.replace("_", " ")
        summary_parts.append(f"{label}: {value}")

    if not summary_parts and parsed:
        first_key = next(iter(parsed))
        summary_parts.append(f"{first_key.replace('_', ' ')}: {parsed[first_key]}")

    return _truncate_text(" | ".join(summary_parts))


def _parse_log_details(details):
    try:
        parsed = json.loads(details)
    except (TypeError, ValueError):
        return None

    return parsed if isinstance(parsed, dict) else None


def _serialize_user_log(log):
    return {
        "log_id": log.log_id,
        "action": log.action,
        "timestamp": log.timestamp.isoformat(),
        "details": log.details,
        "user_id": log.user_id,
        "username": getattr(log.user, "username", None),
    }


def _serialize_print_format(print_format):
    return {
        "id": print_format.id,
        "document_type": print_format.document_type,
        "document_type_label": print_format.get_document_type_display(),
        "name": print_format.name,
        "slug": print_format.slug,
        "template_key": print_format.template_key,
        "template_label": print_format.get_template_key_display(),
        "description": print_format.description,
        "html_template": print_format.html_template,
        "css_template": print_format.css_template,
        "js_template": print_format.js_template,
        "has_custom_template": bool(
            (print_format.html_template or "").strip()
            or (print_format.css_template or "").strip()
            or (print_format.js_template or "").strip()
        ),
        "paper_size": print_format.paper_size,
        "orientation": print_format.orientation,
        "is_active": print_format.is_active,
        "is_default": print_format.is_default,
        "created_at": print_format.created_at.isoformat(),
        "updated_at": print_format.updated_at.isoformat(),
    }


def _normalize_print_format_payload(payload):
    document_type = _compact_text(payload.get("document_type", ""))
    name = _compact_text(payload.get("name", ""))
    slug = _compact_text(payload.get("slug", "")) or None
    template_key = _compact_text(payload.get("template_key", "")) or PrintFormat.TEMPLATE_STANDARD
    description = (payload.get("description") or "").strip()
    html_template = payload.get("html_template") or ""
    css_template = payload.get("css_template") or ""
    js_template = payload.get("js_template") or ""
    paper_size = _compact_text(payload.get("paper_size", "")) or PrintFormat.PAPER_A4
    orientation = (
        _compact_text(payload.get("orientation", "")) or PrintFormat.ORIENTATION_PORTRAIT
    )
    is_default = bool(payload.get("is_default"))

    valid_document_types = {choice[0] for choice in PrintFormat.DOCUMENT_TYPE_CHOICES}
    valid_template_keys = {choice[0] for choice in PrintFormat.TEMPLATE_CHOICES}
    valid_paper_sizes = {choice[0] for choice in PrintFormat.PAPER_SIZE_CHOICES}
    valid_orientations = {choice[0] for choice in PrintFormat.ORIENTATION_CHOICES}

    if not document_type or document_type not in valid_document_types:
        raise ValueError("Document type is invalid.")
    if not name:
        raise ValueError("Print format name is required.")
    if template_key not in valid_template_keys:
        raise ValueError("Template type is invalid.")
    if paper_size not in valid_paper_sizes:
        raise ValueError("Paper size is invalid.")
    if orientation not in valid_orientations:
        raise ValueError("Orientation is invalid.")

    generated_slug = slug or re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    if not generated_slug:
        raise ValueError("Print format slug is required.")

    return {
        "document_type": document_type,
        "name": name,
        "slug": generated_slug,
        "template_key": template_key,
        "description": description,
        "html_template": str(html_template),
        "css_template": str(css_template),
        "js_template": str(js_template),
        "paper_size": paper_size,
        "orientation": orientation,
        "is_active": True,
        "is_default": is_default,
    }


def _save_print_format_changes(print_format, payload):
    for field, value in payload.items():
        setattr(print_format, field, value)
    print_format.save()
    return print_format


def _filter_logs_for_entity(queryset, entity_key, entity_id):
    matched_logs = []

    for log in queryset:
        details = _parse_log_details(log.details)
        if details and details.get(entity_key) == entity_id:
            matched_logs.append(log)

    return matched_logs


def _decimal_to_str(value):
    if value in (None, ""):
        return "0.00"
    if not isinstance(value, Decimal):
        value = Decimal(str(value))
    return format(value.quantize(Decimal("0.01")), "f")


def _format_change_label(current, previous, noun):
    current_value = Decimal(str(current or 0))
    previous_value = Decimal(str(previous or 0))

    if previous_value == 0:
        if current_value == 0:
            return f"No change vs yesterday's {noun}"
        return f"New activity vs yesterday's {noun}"

    delta_pct = ((current_value - previous_value) / previous_value) * Decimal("100")
    rounded_delta = abs(delta_pct.quantize(Decimal("0.1")))
    direction = "up" if delta_pct >= 0 else "down"
    return f"{rounded_delta}% {direction} from yesterday"


def _month_start(current_date):
    return current_date.replace(day=1)


def _shift_month(current_date, delta_months):
    month_index = (current_date.year * 12 + current_date.month - 1) + delta_months
    year = month_index // 12
    month = month_index % 12 + 1
    return current_date.replace(year=year, month=month, day=1)


def _infer_log_type(action):
    normalized = (action or "").lower()
    if any(token in normalized for token in ("cancel", "delete", "error", "fail")):
        return "warning"
    if any(
        token in normalized
        for token in ("submit", "posted", "create", "received", "approved", "login")
    ):
        return "success"
    return "info"


def _build_weekly_sales_series(today):
    start_date = today - timedelta(days=6)
    sales = (
        Sale.objects.filter(status=Sale.STATUS_POSTED, created_at__date__gte=start_date)
        .values("created_at__date")
        .annotate(
            total=Coalesce(
                Sum("total_amount"),
                Value(0, output_field=DecimalField(max_digits=12, decimal_places=2)),
            )
        )
    )
    totals_by_date = {row["created_at__date"]: row["total"] for row in sales}

    points = []
    for offset in range(7):
        point_date = start_date + timedelta(days=offset)
        points.append(
            {
                "date": point_date.isoformat(),
                "label": point_date.strftime("%a"),
                "sales": _decimal_to_str(totals_by_date.get(point_date, Decimal("0"))),
            }
        )
    return points


def _build_daily_sales_series(today):
    sales = (
        Sale.objects.filter(status=Sale.STATUS_POSTED, created_at__date=today)
        .values_list("created_at", "total_amount")
        .order_by("created_at")
    )

    buckets = {}
    for created_at, total_amount in sales:
        local_dt = timezone.localtime(created_at)
        bucket_hour = (local_dt.hour // 3) * 3
        buckets[bucket_hour] = buckets.get(bucket_hour, Decimal("0")) + (
            total_amount or Decimal("0")
        )

    return [
        {
            "hour": bucket_hour,
            "label": f"{bucket_hour:02d}:00",
            "sales": _decimal_to_str(buckets.get(bucket_hour, Decimal("0"))),
        }
        for bucket_hour in range(0, 24, 3)
    ]


def _build_monthly_revenue_series(today):
    month_starts = [_shift_month(_month_start(today), delta) for delta in range(-5, 1)]
    series = []

    for month_start in month_starts:
        next_month = _shift_month(month_start, 1)
        totals = Sale.objects.filter(
            status=Sale.STATUS_POSTED,
            created_at__date__gte=month_start,
            created_at__date__lt=next_month,
        ).aggregate(
            income=Coalesce(
                Sum("total_amount"),
                Value(0, output_field=DecimalField(max_digits=12, decimal_places=2)),
            ),
            sales_count=Count("id"),
        )
        series.append(
            {
                "month": month_start.strftime("%b"),
                "month_start": month_start.isoformat(),
                "income": _decimal_to_str(totals["income"]),
                "sales_count": totals["sales_count"],
            }
        )

    return series


def _build_top_products(limit=5):
    top_items = (
        SaleItem.objects.select_related("medicine")
        .filter(sale__status=Sale.STATUS_POSTED)
        .values("medicine_id", "medicine__name")
        .annotate(
            quantity=Coalesce(Sum("quantity"), Value(0, output_field=IntegerField())),
            revenue=Coalesce(
                Sum("subtotal"),
                Value(0, output_field=DecimalField(max_digits=12, decimal_places=2)),
            ),
        )
        .order_by("-revenue", "medicine__name")[:limit]
    )

    palette = ["#10b981", "#3b82f6", "#f59e0b", "#6366f1", "#94a3b8"]
    return [
        {
            "medicine_id": row["medicine_id"],
            "name": row["medicine__name"] or "Unknown",
            "value": _decimal_to_str(row["revenue"]),
            "quantity": row["quantity"],
            "color": palette[index % len(palette)],
        }
        for index, row in enumerate(top_items)
    ]


def _build_recent_activity(limit=7):
    logs = UserLog.objects.select_related("user").order_by("-timestamp")[:limit]
    results = []

    for log in logs:
        results.append(
            {
                "id": log.log_id,
                "timestamp": log.timestamp.isoformat(),
                "time": timezone.localtime(log.timestamp).strftime("%H:%M"),
                "type": _infer_log_type(log.action),
                "action": log.action,
                "message": _summarize_log_details(log.details) or log.action,
                "user": getattr(log.user, "username", None)
                or getattr(log.user, "email", "")
                or "System",
            }
        )

    return results


def _build_inventory_hub_summary(expiry_soon_days, low_stock_threshold):
    snapshot = _build_inventory_snapshot(expiry_soon_days, low_stock_threshold)
    inventory_items = snapshot["items"]

    category_totals = {}
    for item in inventory_items:
        category = item["category"] or "Uncategorized"
        category_totals[category] = category_totals.get(category, 0) + item["quantity"]

    category_stock_levels = [
        {"category": category, "stock": stock}
        for category, stock in sorted(
            category_totals.items(),
            key=lambda current: (-current[1], current[0].lower()),
        )[:5]
    ]

    month_starts = [
        _shift_month(_month_start(timezone.localdate()), delta)
        for delta in range(-5, 1)
    ]
    inventory_value_trend = []
    for month_start in month_starts:
        next_month = _shift_month(month_start, 1)
        month_value = Decimal("0")
        month_batches = Batches.objects.filter(
            created_at__date__gte=month_start,
            created_at__date__lt=next_month,
        )
        for batch in month_batches:
            month_value += (batch.purchase_price or Decimal("0")) * Decimal(
                str(batch.quantity)
            )

        inventory_value_trend.append(
            {
                "month": month_start.strftime("%b"),
                "month_start": month_start.isoformat(),
                "value": _decimal_to_str(month_value),
            }
        )

    stock_distribution = [
        {
            "name": "In Stock",
            "value": sum(
                1 for item in inventory_items if item["status_key"] == "in_stock"
            ),
            "color": "#10b981",
        },
        {
            "name": "Low Stock",
            "value": sum(
                1 for item in inventory_items if item["status_key"] == "low_stock"
            ),
            "color": "#ef4444",
        },
        {
            "name": "Expiring Soon",
            "value": sum(
                1 for item in inventory_items if item["status_key"] == "expiring_soon"
            ),
            "color": "#f59e0b",
        },
        {
            "name": "Expired",
            "value": sum(
                1 for item in inventory_items if item["status_key"] == "expired"
            ),
            "color": "#64748b",
        },
    ]

    total_value = sum(
        Decimal(item["unit_cost"]) * Decimal(str(item["quantity"]))
        for item in inventory_items
    )

    return {
        "generated_at": timezone.now().isoformat(),
        "category_stock_levels": category_stock_levels,
        "inventory_value_trend": inventory_value_trend,
        "stock_distribution": stock_distribution,
        "summary": {
            **snapshot["summary"],
            "total_value": _decimal_to_str(total_value),
        },
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def inventory_hub_summary(request):
    expiry_soon_days = _get_inventory_threshold(
        request,
        "expiry_soon_days",
        EXPIRY_SOON_DEFAULT_DAYS,
    )
    low_stock_threshold = _get_inventory_threshold(
        request,
        "low_stock_threshold",
        LOW_STOCK_DEFAULT_THRESHOLD,
        minimum=1,
        maximum=10000,
    )

    cache_key = (
        f"inventory_hub_summary:{expiry_soon_days}:{low_stock_threshold}:"
        f"{getattr(request.user, 'id', 'anon')}"
    )
    should_refresh = str(request.GET.get("refresh", "")).lower() in {"1", "true", "yes"}
    if should_refresh:
        cache.delete(cache_key)

    data = cache.get(cache_key)

    if not data:
        data = _build_inventory_hub_summary(expiry_soon_days, low_stock_threshold)
        cache.set(cache_key, data, timeout=60)

    return JsonResponse(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    expiry_soon_days = _get_inventory_threshold(
        request,
        "expiry_soon_days",
        EXPIRY_SOON_DEFAULT_DAYS,
    )
    low_stock_threshold = _get_inventory_threshold(
        request,
        "low_stock_threshold",
        LOW_STOCK_DEFAULT_THRESHOLD,
        minimum=1,
        maximum=10000,
    )

    cache_key = (
        f"dashboard_summary:{expiry_soon_days}:{low_stock_threshold}:"
        f"{getattr(request.user, 'id', 'anon')}"
    )
    should_refresh = str(request.GET.get("refresh", "")).lower() in {"1", "true", "yes"}
    if should_refresh:
        cache.delete(cache_key)

    data = cache.get(cache_key)

    if not data:
        today = timezone.localdate()
        yesterday = today - timedelta(days=1)

        today_sales = Sale.objects.filter(
            status=Sale.STATUS_POSTED,
            created_at__date=today,
        ).aggregate(
            total=Coalesce(
                Sum("total_amount"),
                Value(0, output_field=DecimalField(max_digits=12, decimal_places=2)),
            ),
            count=Count("id"),
        )
        yesterday_sales = Sale.objects.filter(
            status=Sale.STATUS_POSTED,
            created_at__date=yesterday,
        ).aggregate(
            total=Coalesce(
                Sum("total_amount"),
                Value(0, output_field=DecimalField(max_digits=12, decimal_places=2)),
            ),
            count=Count("id"),
        )

        snapshot = _build_inventory_snapshot(expiry_soon_days, low_stock_threshold)
        inventory_items = snapshot["items"]
        low_stock_items = [
            item
            for item in inventory_items
            if item["is_low_stock"] and not item["is_expired"]
        ]
        inventory_value = sum(
            Decimal(item["unit_cost"]) * Decimal(str(item["quantity"]))
            for item in inventory_items
        )
        top_products = _build_top_products()

        status_counts = {
            "in_stock": sum(
                1 for item in inventory_items if item["status_key"] == "in_stock"
            ),
            "low_stock": len(low_stock_items),
            "expiring_soon": sum(
                1 for item in inventory_items if item["status_key"] == "expiring_soon"
            ),
            "expired": sum(
                1 for item in inventory_items if item["status_key"] == "expired"
            ),
        }
        total_products = Medicine.objects.count()
        total_suppliers = Supplier.objects.filter(is_active=True).count()
        total_sales = Sale.objects.filter(status=Sale.STATUS_POSTED).aggregate(
            total=Coalesce(
                Sum("total_amount"),
                Value(0, output_field=DecimalField(max_digits=12, decimal_places=2)),
            )
        )["total"]

        data = {
            "generated_at": timezone.now().isoformat(),
            "kpis": {
                "today_sales": _decimal_to_str(today_sales["total"]),
                "today_sales_count": today_sales["count"],
                "today_sales_trend": _format_change_label(
                    today_sales["total"], yesterday_sales["total"], "sales"
                ),
                "total_products": total_products,
                "total_products_trend": "Active in catalog",
                "low_stock_count": len(low_stock_items),
                "low_stock_trend": f"Threshold <= {low_stock_threshold} units",
                "total_suppliers": total_suppliers,
                "total_suppliers_trend": "Active suppliers",
                "inventory_value": _decimal_to_str(inventory_value),
                "inventory_units": snapshot["summary"]["total_quantity"],
                "expiring_soon_count": snapshot["summary"]["expiring_soon_count"],
                "total_sales": _decimal_to_str(total_sales),
            },
            "charts": {
                "weekly_sales": _build_weekly_sales_series(today),
                "daily_sales": _build_daily_sales_series(today),
                "monthly_revenue": _build_monthly_revenue_series(today),
            },
            "top_products": top_products,
            "recent_activity": _build_recent_activity(),
            "alerts": low_stock_items[:6],
            "inventory_summary": snapshot["summary"],
            "inventory_status": status_counts,
        }

        cache.set(cache_key, data, timeout=60)  # 1 minute

    return JsonResponse(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def clear_application_cache(request):
    cache.clear()
    return JsonResponse({"message": "Application cache cleared."})


def _get_inventory_threshold(request, key, default_value, minimum=1, maximum=365):
    try:
        value = int(request.GET.get(key, default_value))
    except (TypeError, ValueError):
        value = default_value
    return max(minimum, min(value, maximum))


def _inventory_status(quantity, expiry_date, expiry_soon_days, low_stock_threshold):
    today = timezone.localdate()
    days_to_expiry = (expiry_date - today).days
    is_expired = days_to_expiry <= 0
    is_expiring_soon = 0 < days_to_expiry <= expiry_soon_days
    is_low_stock = quantity <= low_stock_threshold

    if is_expired:
        status_key = "expired"
        status_label = "Expired"
    elif is_expiring_soon:
        status_key = "expiring_soon"
        status_label = "Expiring Soon"
    elif is_low_stock:
        status_key = "low_stock"
        status_label = "Low Stock"
    else:
        status_key = "in_stock"
        status_label = "In Stock"

    return {
        "status_key": status_key,
        "status_label": status_label,
        "days_to_expiry": days_to_expiry,
        "is_expired": is_expired,
        "is_expiring_soon": is_expiring_soon,
        "is_low_stock": is_low_stock,
    }


def _build_inventory_snapshot(
    expiry_soon_days,
    low_stock_threshold,
    eligible_only=False,
):
    batch_queryset = Batches.objects.filter(quantity__gt=0)
    if eligible_only:
        batch_queryset = batch_queryset.filter(
            product_id__is_active=True,
            product_id__status=Medicine.STATUS_SUBMITTED,
        )

    batches = list(
        batch_queryset.select_related(
            "product_id__category", "product_id__supplier", "supplier_id"
        ).order_by(
            "product_id__name",
            "created_at",
            "manufacturing_date",
            "expiry_date",
            "batch_number",
        )
    )

    medicine_totals = {}
    fifo_priority = {}
    fifo_candidates = []
    expiring_soon_batches = []
    expired_batches = []

    grouped_batches = {}
    for batch in batches:
        grouped_batches.setdefault(batch.product_id_id, []).append(batch)
        medicine_totals[batch.product_id_id] = (
            medicine_totals.get(batch.product_id_id, 0) + batch.quantity
        )

    today = timezone.localdate()

    for medicine_batches in grouped_batches.values():
        sellable_batches = [
            batch
            for batch in medicine_batches
            if batch.expiry_date > today and batch.quantity > 0
        ]

        for rank, batch in enumerate(sellable_batches, start=1):
            fifo_priority[batch.batch_id] = rank

        if sellable_batches:
            fifo_candidates.append(sellable_batches[0])

        for batch in medicine_batches:
            status = _inventory_status(
                batch.quantity,
                batch.expiry_date,
                expiry_soon_days,
                low_stock_threshold,
            )
            if status["is_expiring_soon"]:
                expiring_soon_batches.append(batch)
            if status["is_expired"]:
                expired_batches.append(batch)

    def serialize_batch(batch):
        medicine = batch.product_id
        status = _inventory_status(
            batch.quantity,
            batch.expiry_date,
            expiry_soon_days,
            low_stock_threshold,
        )
        return {
            "id": batch.batch_id,
            "batch_id": batch.batch_id,
            "batch_number": batch.batch_number,
            "medicine_id": medicine.id,
            "medicine_name": medicine.name,
            "generic_name": medicine.generic_name,
            "naming_series": medicine.naming_series,
            "barcode": medicine.barcode,
            "category": medicine.category.name if medicine.category else "",
            "supplier": batch.supplier_id.name if batch.supplier_id else "",
            "supplier_id": batch.supplier_id_id,
            "quantity": batch.quantity,
            "medicine_total_quantity": medicine_totals.get(
                batch.product_id_id, batch.quantity
            ),
            "unit_cost": str(batch.purchase_price),
            "selling_price": str(medicine.selling_price),
            "medicine_status": medicine.status,
            "medicine_is_active": medicine.is_active,
            "manufacturing_date": batch.manufacturing_date.isoformat(),
            "expiry_date": batch.expiry_date.isoformat(),
            "location": "Main Store",
            "received_at": batch.created_at.isoformat(),
            "status": status["status_label"],
            "status_key": status["status_key"],
            "days_to_expiry": status["days_to_expiry"],
            "is_expired": status["is_expired"],
            "is_expiring_soon": status["is_expiring_soon"],
            "is_low_stock": status["is_low_stock"],
            "fifo_priority": fifo_priority.get(batch.batch_id),
            "sell_first": fifo_priority.get(batch.batch_id) == 1,
        }

    items = [serialize_batch(batch) for batch in batches]

    return {
        "items": items,
        "summary": {
            "total_batches": len(batches),
            "total_medicines": len(grouped_batches),
            "total_quantity": sum(batch.quantity for batch in batches),
            "expiring_soon_count": len(expiring_soon_batches),
            "expired_count": len(expired_batches),
            "fifo_candidate_count": len(fifo_candidates),
            "expiry_soon_days": expiry_soon_days,
            "low_stock_threshold": low_stock_threshold,
        },
        "fifo_candidates": [
            serialize_batch(batch)
            for batch in sorted(
                fifo_candidates,
                key=lambda current: (
                    current.created_at,
                    current.manufacturing_date,
                    current.expiry_date,
                    current.batch_number,
                ),
            )[:8]
        ],
        "expiring_soon": [
            serialize_batch(batch)
            for batch in sorted(
                expiring_soon_batches,
                key=lambda current: (
                    current.expiry_date,
                    current.product_id.name.lower(),
                    current.batch_number,
                ),
            )[:8]
        ],
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def inventory_list(request):
    expiry_soon_days = _get_inventory_threshold(
        request,
        "expiry_soon_days",
        EXPIRY_SOON_DEFAULT_DAYS,
    )
    low_stock_threshold = _get_inventory_threshold(
        request,
        "low_stock_threshold",
        LOW_STOCK_DEFAULT_THRESHOLD,
        minimum=1,
        maximum=10000,
    )

    eligible_only = _is_truthy_query_value(request.GET.get("eligible_only"))
    snapshot = _build_inventory_snapshot(
        expiry_soon_days,
        low_stock_threshold,
        eligible_only=eligible_only,
    )
    items = snapshot["items"]

    batch_query = _compact_text(request.GET.get("batch", ""))
    medicine_query = _compact_text(request.GET.get("medicine", ""))
    sku_query = _compact_text(request.GET.get("sku", ""))
    status_query = _compact_text(request.GET.get("status", "")).lower()

    if batch_query:
        items = [
            item
            for item in items
            if batch_query.lower() in item["batch_number"].lower()
        ]

    if medicine_query:
        items = [
            item
            for item in items
            if medicine_query.lower() in item["medicine_name"].lower()
            or medicine_query.lower() in item["generic_name"].lower()
        ]

    if sku_query:
        items = [
            item
            for item in items
            if sku_query.lower() in (item["naming_series"] or "").lower()
            or sku_query.lower() in item["barcode"].lower()
        ]

    if status_query:
        normalized_status = status_query.replace(" ", "_")
        items = [
            item
            for item in items
            if item["status_key"] == normalized_status
            or item["status"].lower() == status_query
        ]

    return JsonResponse(
        {
            "summary": snapshot["summary"],
            "items": items,
            "fifo_candidates": snapshot["fifo_candidates"],
            "expiring_soon": snapshot["expiring_soon"],
            "total_count": len(items),
        }
    )


def _serialize_stock_ledger(entry: StockLedger):
    medicine = entry.medicine
    batch = entry.batch
    return {
        "transaction_id": entry.transaction_id,
        "transaction_type": entry.transaction_type,
        "medicine_id": medicine.id if medicine else None,
        "medicine_name": medicine.name if medicine else "",
        "batch_id": batch.batch_id if batch else None,
        "batch_number": batch.batch_number if batch else "",
        "quantity": entry.quantity,
        "unit_price": str(entry.unit_price),
        "reference_document": entry.reference_document,
        "notes": entry.notes,
        "created_at": entry.created_at.isoformat(),
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stock_ledger_list(request):
    try:
        page_size = int(request.GET.get("page_size", 20))
        page = int(request.GET.get("page", 1))
    except (TypeError, ValueError):
        return JsonResponse({"error": "Invalid pagination values."}, status=400)

    page_size = max(1, min(page_size, 100))
    page = max(1, page)

    medicine_id = request.GET.get("medicine_id")
    batch_id = request.GET.get("batch_id")
    transaction_type = _compact_text(request.GET.get("transaction_type", "")).lower()
    reference = _compact_text(request.GET.get("reference", ""))
    q = _compact_text(request.GET.get("q", ""))

    try:
        start_date = (
            _parse_date_value(request.GET.get("start_date"), "start_date")
            if request.GET.get("start_date")
            else None
        )
        end_date = (
            _parse_date_value(request.GET.get("end_date"), "end_date")
            if request.GET.get("end_date")
            else None
        )
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    queryset = StockLedger.objects.select_related("medicine", "batch").all()

    if start_date:
        queryset = queryset.filter(created_at__date__gte=start_date)
    if end_date:
        queryset = queryset.filter(created_at__date__lte=end_date)
    if medicine_id:
        queryset = queryset.filter(medicine_id=medicine_id)
    if batch_id:
        queryset = queryset.filter(batch_id=batch_id)
    if transaction_type:
        queryset = queryset.filter(transaction_type=transaction_type)
    if reference:
        queryset = queryset.filter(reference_document__icontains=reference)
    if q:
        queryset = queryset.filter(
            Q(reference_document__icontains=q)
            | Q(notes__icontains=q)
            | Q(medicine__name__icontains=q)
            | Q(batch__batch_number__icontains=q)
        )

    queryset = queryset.order_by("-created_at", "-transaction_id")
    paginator = Paginator(queryset, page_size)

    try:
        entries_page = paginator.page(page)
    except EmptyPage:
        entries_page = paginator.page(1)

    return JsonResponse(
        {
            "results": [_serialize_stock_ledger(entry) for entry in entries_page],
            "count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": entries_page.number,
            "page_size": page_size,
            "has_next": entries_page.has_next(),
            "has_previous": entries_page.has_previous(),
        }
    )


def _serialize_purchase(purchase: Purchase, include_items=False):
    payload = {
        "id": purchase.id,
        "supplier_id": purchase.supplier_id,
        "supplier": purchase.supplier.name if purchase.supplier else "",
        "status": purchase.status,
        "tax": str(purchase.tax),
        "total_cost": str(purchase.total_cost),
        "grand_total": str(purchase.grand_total),
        "notes": purchase.notes,
        "received_by_id": purchase.received_by_id,
        "received_by": getattr(purchase.received_by, "email", ""),
        "created_at": purchase.created_at.isoformat(),
        "updated_at": purchase.updated_at.isoformat(),
    }
    if include_items:
        payload["items"] = [
            {
                "id": item.id,
                "medicine_id": item.medicine_id,
                "medicine_name": item.medicine.name if item.medicine else "",
                "quantity": item.quantity,
                "cost_price": str(item.cost_price),
                "batch_id": item.batch_id,
                "batch_number": item.batch.batch_number if item.batch else "",
                "expiry_date": item.expiry_date.isoformat(),
            }
            for item in purchase.items.select_related("medicine", "batch").all()
        ]
    return payload


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def purchases_list(request):
    page_size = int(request.GET.get("page_size", 10))
    page = int(request.GET.get("page", 1))
    supplier = _compact_text(request.GET.get("supplier", ""))
    status = _compact_text(request.GET.get("status", "")).lower()

    queryset = Purchase.objects.select_related("supplier", "received_by").order_by(
        "-created_at"
    )
    if supplier:
        queryset = queryset.filter(supplier__name__icontains=supplier)
    if status:
        queryset = queryset.filter(status=status)

    paginator = Paginator(queryset, page_size)
    try:
        page_obj = paginator.page(page)
    except EmptyPage:
        page_obj = paginator.page(1)

    return JsonResponse(
        {
            "results": [
                _serialize_purchase(purchase) for purchase in page_obj.object_list
            ],
            "count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": page_obj.number,
            "page_size": page_size,
            "has_next": page_obj.has_next(),
            "has_previous": page_obj.has_previous(),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def purchase_detail(request, purchase_id: int):
    try:
        purchase = (
            Purchase.objects.select_related("supplier", "received_by")
            .prefetch_related("items__medicine", "items__batch")
            .get(id=purchase_id)
        )
    except Purchase.DoesNotExist:
        return JsonResponse({"error": "Purchase not found."}, status=404)
    return JsonResponse(_serialize_purchase(purchase, include_items=True))


def _serialize_grn(grn: GoodRecivingNote, include_items=False):
    payload = {
        "id": grn.good_reciving_note_id,
        "good_reciving_note_id": grn.good_reciving_note_id,
        "purchase_id": grn.purchase_id,
        "supplier_id": grn.supplier_id_id,
        "supplier": grn.supplier_id.name if grn.supplier_id else "",
        "invoice_number": grn.invoice_number,
        "total_amount": str(grn.total_amount),
        "received_by_id": grn.received_by_id,
        "received_by": getattr(grn.received_by, "email", ""),
        "received_at": grn.received_at.isoformat(),
        "notes": grn.notes or "",
    }
    if include_items:
        payload["items"] = [
            {
                "id": item.id,
                "medicine_id": item.medicine_id,
                "medicine_name": item.medicine.name if item.medicine else "",
                "quantity": item.quantity,
                "unit_price": str(item.unit_price),
                "total_price": str(item.total_price),
                "batch_id": item.batch_number_id,
                "batch_number": item.batch_number.batch_number
                if item.batch_number
                else "",
                "expiry_date": item.expiry_date.isoformat(),
            }
            for item in GoodRecivingNoteItem.objects.select_related(
                "medicine", "batch_number"
            )
            .filter(good_reciving_note_id=grn.good_reciving_note_id)
            .all()
        ]
    return payload


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def grn_list(request):
    page_size = int(request.GET.get("page_size", 10))
    page = int(request.GET.get("page", 1))
    invoice_number = _compact_text(request.GET.get("invoice_number", ""))
    supplier = _compact_text(request.GET.get("supplier", ""))

    queryset = GoodRecivingNote.objects.select_related(
        "purchase", "received_by", "supplier_id"
    ).order_by("-received_at")
    if invoice_number:
        queryset = queryset.filter(invoice_number__icontains=invoice_number)
    if supplier:
        queryset = queryset.filter(supplier_id__name__icontains=supplier)

    paginator = Paginator(queryset, page_size)
    try:
        page_obj = paginator.page(page)
    except EmptyPage:
        page_obj = paginator.page(1)

    return JsonResponse(
        {
            "results": [_serialize_grn(grn) for grn in page_obj.object_list],
            "count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": page_obj.number,
            "page_size": page_size,
            "has_next": page_obj.has_next(),
            "has_previous": page_obj.has_previous(),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def grn_detail(request, grn_id: int):
    try:
        grn = GoodRecivingNote.objects.select_related(
            "purchase", "received_by", "supplier_id"
        ).get(good_reciving_note_id=grn_id)
    except GoodRecivingNote.DoesNotExist:
        return JsonResponse({"error": "GRN not found."}, status=404)

    return JsonResponse(_serialize_grn(grn, include_items=True))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def global_search(request):
    query = _compact_text(request.GET.get("q", ""))

    try:
        limit = int(request.GET.get("limit", 5))
    except (TypeError, ValueError):
        limit = 5

    limit = max(1, min(limit, 10))

    empty_payload = {
        "query": query,
        "results": [],
        "total_count": 0,
    }

    if len(query) < 2:
        return JsonResponse(empty_payload)

    medicines = (
        Medicine.objects.filter(is_active=True)
        .select_related("category", "supplier")
        .filter(
            Q(name__icontains=query)
            | Q(generic_name__icontains=query)
            | Q(barcode__icontains=query)
            | Q(naming_series__icontains=query)
        )
        .order_by("name")[:limit]
    )

    inventory_batches = (
        Batches.objects.select_related("product_id")
        .filter(
            Q(batch_number__icontains=query)
            | Q(product_id__name__icontains=query)
            | Q(product_id__generic_name__icontains=query)
        )
        .order_by("expiry_date", "batch_number")[:limit]
    )

    audit_logs = (
        UserLog.objects.select_related("user")
        .filter(
            Q(action__icontains=query)
            | Q(details__icontains=query)
            | Q(user__email__icontains=query)
            | Q(user__first_name__icontains=query)
            | Q(user__last_name__icontains=query)
        )
        .order_by("-timestamp")[:limit]
    )

    grouped_results = []

    inventory_results = [
        {
            "id": f"medicine-{medicine.id}",
            "entity": "Item",
            "title": medicine.name,
            "subtitle": _compact_text(
                f"{medicine.naming_series or 'No series'} | {medicine.generic_name or 'No generic name'}"
            ),
            "meta": _compact_text(
                f"Barcode {medicine.barcode} | {medicine.category.name if medicine.category else 'Uncategorized'}"
            ),
            "href": (
                f"/inventory/medicines/{medicine.naming_series}"
                if medicine.naming_series
                else "/inventory/medicines"
            ),
        }
        for medicine in medicines
    ]

    inventory_results.extend(
        [
            {
                "id": f"batch-{batch.batch_id}",
                "entity": "Batch",
                "title": batch.batch_number,
                "subtitle": _compact_text(
                    f"{batch.product_id.name} | Expires {batch.expiry_date.isoformat()}"
                ),
                "meta": _compact_text(f"Qty {batch.quantity} | Main Store"),
                "href": f"/inventory/{batch.batch_id}",
            }
            for batch in inventory_batches
        ]
    )

    if inventory_results:
        grouped_results.append(
            {
                "module": "inventory",
                "label": "Inventory",
                "items": inventory_results,
            }
        )

    grouped_results.append(
        {
            "module": "production",
            "label": "Production",
            "items": [],
        }
    )

    audit_results = [
        {
            "id": f"log-{log.log_id}",
            "entity": "Audit Log",
            "title": log.action,
            "subtitle": _summarize_log_details(log.details)
            or "Open audit logs for full details.",
            "meta": _compact_text(
                f"{getattr(log.user, 'full_name', '') or getattr(log.user, 'email', 'Unknown user')} | {log.timestamp.isoformat()}"
            ),
            "href": "/audit-logs",
        }
        for log in audit_logs
    ]

    if audit_results:
        grouped_results.append(
            {
                "module": "audit",
                "label": "Audit & Compliance",
                "items": audit_results,
            }
        )

    return JsonResponse(
        {
            "query": query,
            "results": grouped_results,
            "total_count": sum(len(group["items"]) for group in grouped_results),
        }
    )


def _parse_positive_int(value, field_name):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a valid integer.")

    if parsed <= 0:
        raise ValueError(f"{field_name} must be greater than zero.")

    return parsed


def _parse_decimal(value, field_name):
    try:
        parsed = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError(f"{field_name} must be a valid number.")

    if parsed <= 0:
        raise ValueError(f"{field_name} must be greater than zero.")

    return parsed


def _parse_date_value(value, field_name):
    parsed = parse_date(str(value)) if value else None
    if not parsed:
        raise ValueError(f"{field_name} must be a valid date in YYYY-MM-DD format.")
    return parsed


def _is_truthy_query_value(value):
    return str(value or "").strip().lower() in {"1", "true", "yes", "on"}


def _get_fetchable_medicine(medicine_id, prefix):
    try:
        return Medicine.objects.get(
            pk=medicine_id,
            is_active=True,
            status=Medicine.STATUS_SUBMITTED,
        )
    except Medicine.DoesNotExist as exc:
        raise ValueError(
            f"{prefix}: medicine must be active and submitted before it can be used in another document."
        ) from exc


def _get_fetchable_supplier(supplier_id):
    try:
        return Supplier.objects.get(
            pk=supplier_id,
            is_active=True,
            status=Supplier.STATUS_SUBMITTED,
        )
    except Supplier.DoesNotExist as exc:
        raise ValueError(
            "Supplier must be active and submitted before it can be used in stock entry."
        ) from exc


def _serialize_stock_entry(stock_entry, include_items=False):
    total_quantity = getattr(stock_entry, "total_quantity", None)
    if total_quantity is None:
        total_quantity = stock_entry.items.aggregate(
            total=Coalesce(Sum("quantity"), Value(0))
        )["total"]

    item_count = getattr(stock_entry, "item_count", None)
    if item_count is None:
        item_count = stock_entry.items.count()

    payload = {
        "id": stock_entry.id,
        "posting_number": stock_entry.posting_number,
        "supplier_id": stock_entry.supplier_id,
        "supplier": stock_entry.supplier.name if stock_entry.supplier else "",
        "invoice_number": stock_entry.invoice_number,
        "item_count": item_count,
        "total_quantity": total_quantity,
        "total_cost": str(stock_entry.total_cost),
        "tax": str(stock_entry.tax),
        "grand_total": str(stock_entry.grand_total),
        "status": stock_entry.get_status_display(),
        "status_key": stock_entry.status,
        "received_by": getattr(stock_entry.received_by, "username", ""),
        "received_by_id": stock_entry.received_by_id,
        "purchase_id": stock_entry.purchase_id,
        "goods_receiving_note_id": stock_entry.goods_receiving_note_id,
        "notes": stock_entry.notes,
        "posted_at": stock_entry.created_at.isoformat(),
        "updated_at": stock_entry.updated_at.isoformat(),
    }

    if include_items:
        payload["items"] = [
            {
                "id": item.id,
                "medicine_id": item.medicine_id,
                "medicine_name": item.medicine.name if item.medicine else "",
                "batch_id": item.batch_id,
                "inventory_batch_id": item.batch_id,
                "batch_number": item.batch_number,
                "inventory_batch_number": item.batch.batch_number
                if item.batch
                else item.batch_number,
                "quantity": item.quantity,
                "unit_price": str(item.unit_price),
                "total_price": str(item.total_price),
                "manufacturing_date": item.manufacturing_date.isoformat(),
                "expiry_date": item.expiry_date.isoformat(),
                "reference": item.reference,
                "notes": item.notes,
            }
            for item in stock_entry.items.select_related("medicine", "batch").all()
        ]

    return payload


def _serialize_supplier(supplier):
    medicine_count = getattr(supplier, "medicine_count", None)
    if medicine_count is None:
        medicine_count = supplier.medicines.count()

    return {
        "id": supplier.id,
        "naming_series": supplier.naming_series,
        "name": supplier.name,
        "contact_person": supplier.contact_person,
        "phone": supplier.phone,
        "email": supplier.email,
        "address": supplier.address,
        "status": supplier.status,
        "is_active": supplier.is_active,
        "medicine_count": medicine_count,
        "created_at": supplier.created_at.isoformat(),
        "updated_at": supplier.updated_at.isoformat(),
    }


def _normalize_supplier_payload(payload, partial=False):
    name = (payload.get("name") or "").strip()
    if not partial or "name" in payload:
        if not name:
            raise ValueError("Supplier name is required.")
        if len(name) > 200:
            raise ValueError("Supplier name must be at most 200 characters.")

    status = payload.get("status")
    if status is not None:
        status = str(status).strip() or Supplier.STATUS_DRAFT
        valid_statuses = {choice[0] for choice in Supplier.STATUS_CHOICES}
        if status not in valid_statuses:
            raise ValueError("Supplier status is invalid.")
    elif not partial:
        status = Supplier.STATUS_DRAFT

    normalized = {}

    if not partial or "name" in payload:
        normalized["name"] = name

    if not partial or "contact_person" in payload:
        contact_person = payload.get("contact_person", "")
        if contact_person is None:
            contact_person = ""
        contact_person = str(contact_person).strip()
        if len(contact_person) > 150:
            raise ValueError("Contact person must be at most 150 characters.")
        normalized["contact_person"] = contact_person

    if not partial or "phone" in payload:
        phone = payload.get("phone", "")
        if phone is None:
            phone = ""
        phone = str(phone).strip()
        if len(phone) > 20:
            raise ValueError("Phone number must be at most 20 characters.")
        normalized["phone"] = phone

    # check valid email
    if not partial or "email" in payload:
        email = payload.get("email", "")
        if email is None:
            email = ""
        # Basic email validation
        if email and not re.match(r"^[^@]+@[^@]+\.[^@]+$", email):
            raise ValueError("Invalid email format.")
        normalized["email"] = str(email).strip()

    if not partial or "address" in payload:
        address = payload.get("address", "")
        if address is None:
            address = ""
        normalized["address"] = str(address).strip()

    if not partial or "status" in payload:
        normalized["status"] = status

    if "is_active" in payload:
        normalized["is_active"] = bool(payload.get("is_active"))
    elif not partial:
        normalized["is_active"] = True

    return normalized


def _normalize_stock_entry_payload(payload):
    supplier_id = payload.get("supplier_id")
    invoice_number = (payload.get("invoice_number") or "").strip()
    notes = (payload.get("notes") or "").strip()
    tax = payload.get("tax", "0")
    items = payload.get("items") or []

    if not supplier_id:
        raise ValueError("Supplier is required.")

    if not invoice_number:
        raise ValueError("Invoice number is required.")

    if not isinstance(items, list) or len(items) == 0:
        raise ValueError("At least one stock entry item is required.")

    supplier = _get_fetchable_supplier(supplier_id)

    try:
        parsed_tax = Decimal(str(tax or "0"))
        if parsed_tax < 0:
            raise ValueError("Tax cannot be negative.")
    except (InvalidOperation, TypeError, ValueError) as exc:
        if isinstance(exc, ValueError):
            raise
        raise ValueError("Tax must be a valid number.") from exc

    normalized_items = []
    total_cost = Decimal("0")

    for index, item in enumerate(items, start=1):
        prefix = f"Item #{index}"
        medicine_id = item.get("medicine_id")
        batch_number = (item.get("batch_number") or "").strip()
        manufacturing_date = item.get("manufacturing_date")
        expiry_date = item.get("expiry_date")
        reference = (item.get("reference") or "").strip()
        line_notes = (item.get("notes") or "").strip()

        if not medicine_id:
            raise ValueError(f"{prefix}: medicine is required.")
        if not batch_number:
            raise ValueError(f"{prefix}: batch number is required.")
        if not manufacturing_date:
            raise ValueError(f"{prefix}: manufacturing date is required.")
        if not expiry_date:
            raise ValueError(f"{prefix}: expiry date is required.")

        medicine = _get_fetchable_medicine(medicine_id, prefix)

        quantity = _parse_positive_int(item.get("quantity"), f"{prefix} quantity")
        unit_price = _parse_decimal(item.get("unit_price"), f"{prefix} unit price")
        manufacturing_date = _parse_date_value(
            manufacturing_date, f"{prefix} manufacturing date"
        )
        expiry_date = _parse_date_value(expiry_date, f"{prefix} expiry date")

        if expiry_date <= manufacturing_date:
            raise ValueError(f"{prefix}: expiry date must be after manufacturing date.")

        line_total = unit_price * quantity
        total_cost += line_total

        normalized_items.append(
            {
                "medicine": medicine,
                "batch_number": batch_number,
                "manufacturing_date": manufacturing_date,
                "expiry_date": expiry_date,
                "quantity": quantity,
                "unit_price": unit_price,
                "line_total": line_total,
                "reference": reference,
                "notes": line_notes,
            }
        )

    return {
        "supplier": supplier,
        "invoice_number": invoice_number,
        "notes": notes,
        "tax": parsed_tax,
        "total_cost": total_cost,
        "grand_total": total_cost + parsed_tax,
        "items": normalized_items,
    }


def _replace_stock_entry_items(stock_entry, normalized_items):
    stock_entry.items.all().delete()

    for item in normalized_items:
        StockEntryItem.objects.create(
            stock_entry=stock_entry,
            medicine=item["medicine"],
            batch_number=item["batch_number"],
            quantity=item["quantity"],
            unit_price=item["unit_price"],
            total_price=item["line_total"],
            manufacturing_date=item["manufacturing_date"],
            expiry_date=item["expiry_date"],
            reference=item["reference"],
            notes=item["notes"],
        )


def _post_stock_entry(stock_entry):
    if stock_entry.status != StockEntry.STATUS_DRAFT:
        raise ValueError("Only draft stock entries can be submitted.")

    draft_items = list(stock_entry.items.select_related("medicine").all())
    if not draft_items:
        raise ValueError("Draft stock entry does not contain any items.")

    supplier = stock_entry.supplier

    purchase = Purchase.objects.create(
        supplier=supplier,
        received_by=stock_entry.received_by,
        status="completed",
        tax=stock_entry.tax,
        total_cost=stock_entry.total_cost,
        grand_total=stock_entry.grand_total,
        notes=stock_entry.notes,
    )

    grn = GoodRecivingNote.objects.create(
        purchase=purchase,
        received_by=stock_entry.received_by,
        supplier_id=supplier,
        invoice_number=stock_entry.invoice_number,
        total_amount=stock_entry.grand_total,
        notes=stock_entry.notes,
    )

    created_items = []

    for item in draft_items:
        batch = (
            Batches.objects.select_for_update()
            .filter(batch_number=item.batch_number)
            .first()
        )
        created = False
        if not batch:
            batch = Batches.objects.create(
                batch_number=item.batch_number,
                product_id=item.medicine,
                expiry_date=item.expiry_date,
                manufacturing_date=item.manufacturing_date,
                quantity=0,
                purchase_price=item.unit_price,
                supplier_id=supplier,
            )
            created = True

        if not created:
            if batch.product_id_id != item.medicine_id:
                raise ValueError(
                    f"Batch number {item.batch_number} already belongs to another medicine."
                )

            batch.expiry_date = item.expiry_date
            batch.manufacturing_date = item.manufacturing_date
            batch.purchase_price = item.unit_price
            batch.supplier_id = supplier
            batch.quantity += item.quantity
            batch.save()
        else:
            batch.quantity = item.quantity
            batch.save(update_fields=["quantity"])

        inventory_row = (
            Inventory.objects.select_for_update()
            .filter(medicine=item.medicine, batch_number=item.batch_number)
            .first()
        )
        inventory_created = False
        if not inventory_row:
            inventory_row = Inventory.objects.create(
                medicine=item.medicine,
                batch_number=item.batch_number,
                quantity=0,
                expiry_date=item.expiry_date,
                location="Main Store",
            )
            inventory_created = True

        if not inventory_created:
            inventory_row.quantity += item.quantity
            inventory_row.expiry_date = item.expiry_date
            inventory_row.save()
        else:
            inventory_row.quantity = item.quantity
            inventory_row.save(update_fields=["quantity", "updated_at"])

        purchase_item = PurchaseItem.objects.create(
            purchase=purchase,
            medicine=item.medicine,
            quantity=item.quantity,
            cost_price=item.unit_price,
            batch=batch,
            expiry_date=item.expiry_date,
        )

        GoodRecivingNoteItem.objects.create(
            good_reciving_note=grn,
            medicine=item.medicine,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item.total_price,
            batch_number=batch,
            expiry_date=item.expiry_date,
        )

        item.batch = batch
        item.save(update_fields=["batch"])

        StockLedger.objects.create(
            medicine=item.medicine,
            batch=batch,
            transaction_type=StockLedger.TRANSACTION_PURCHASE,
            quantity=item.quantity,
            unit_price=item.unit_price,
            reference_document=stock_entry.invoice_number,
            notes=item.notes
            or f"Stock IN via stock entry {stock_entry.posting_number}",
        )

        # Create cost layer for this stock receipt
        inventory_for_layer = Inventory.objects.filter(
            medicine=item.medicine, batch_number=item.batch_number
        ).first()

        add_stock_layer(
            medicine=item.medicine,
            quantity=item.quantity,
            unit_cost=item.unit_price,
            inventory=inventory_for_layer,
            stock_entry_item=item,
            expiry_date=item.expiry_date,
        )

        created_items.append(
            {
                "stock_entry_item_id": item.id,
                "purchase_item_id": purchase_item.id,
                "medicine_id": item.medicine_id,
                "medicine_name": item.medicine.name,
                "batch_number": item.batch_number,
                "quantity": item.quantity,
                "unit_price": str(item.unit_price),
                "line_total": str(item.total_price),
                "expiry_date": str(item.expiry_date),
                "manufacturing_date": str(item.manufacturing_date),
                "reference": item.reference,
            }
        )

    stock_entry.purchase = purchase
    stock_entry.goods_receiving_note = grn
    stock_entry.status = StockEntry.STATUS_POSTED
    stock_entry.save(
        update_fields=["purchase", "goods_receiving_note", "status", "updated_at"]
    )

    UserLog.objects.create(
        user=stock_entry.received_by,
        action="Stock Entry Submitted",
        details=json.dumps(
            {
                "stock_entry_id": stock_entry.id,
                "posting_number": stock_entry.posting_number,
                "purchase_id": purchase.id,
                "goods_receiving_note_id": grn.good_reciving_note_id,
                "supplier_id": supplier.id,
                "invoice_number": stock_entry.invoice_number,
                "total_cost": str(stock_entry.total_cost),
                "tax": str(stock_entry.tax),
                "grand_total": str(stock_entry.grand_total),
                "items": created_items,
            },
            default=str,
        ),
    )


def _reverse_posted_stock_entry(stock_entry):
    if stock_entry.status != StockEntry.STATUS_POSTED:
        raise ValueError("Only posted stock entries can be cancelled.")

    posted_items = list(
        stock_entry.items.select_related("medicine", "batch").order_by("id")
    )
    if not posted_items:
        raise ValueError("Posted stock entry does not contain any items.")

    batch_ids = [item.batch_id for item in posted_items if item.batch_id]
    if batch_ids:
        linked_sale_item = (
            SaleItem.objects.select_related("sale", "medicine")
            .filter(batch_id__in=batch_ids)
            .exclude(sale__status=Sale.STATUS_CANCELLED)
            .order_by("sale__created_at", "id")
            .first()
        )
        if linked_sale_item:
            raise ValueError(
                "Cannot cancel stock entry because stock-out "
                f"{linked_sale_item.sale.posting_number} still references batch "
                f"{linked_sale_item.batch.batch_number} for {linked_sale_item.medicine.name}. "
                "Cancel the stock-out document first."
            )

    reversed_items = []

    for item in posted_items:
        if not item.batch_id or not item.batch:
            raise ValueError(f"Batch link is missing for item '{item.medicine.name}'.")

        batch = Batches.objects.select_for_update().get(pk=item.batch_id)
        if batch.quantity < item.quantity:
            raise ValueError(
                f"Cannot cancel stock entry because batch {batch.batch_number} "
                "does not have enough quantity left."
            )

        batch.quantity -= item.quantity
        batch.save(update_fields=["quantity"])

        inventory_row = (
            Inventory.objects.select_for_update()
            .filter(medicine=item.medicine, batch_number=item.batch_number)
            .first()
        )
        if not inventory_row:
            raise ValueError(
                f"Inventory record is missing for batch {item.batch_number}."
            )

        if inventory_row.quantity < item.quantity:
            raise ValueError(
                f"Cannot cancel stock entry because inventory batch "
                f"{item.batch_number} is already below the posted quantity."
            )

        inventory_row.quantity -= item.quantity
        inventory_row.expiry_date = item.expiry_date
        if inventory_row.quantity == 0:
            inventory_row.delete()
        else:
            inventory_row.save(update_fields=["quantity", "expiry_date", "updated_at"])

        StockLedger.objects.create(
            medicine=item.medicine,
            batch=batch,
            transaction_type=StockLedger.TRANSACTION_PURCHASE,
            quantity=-item.quantity,
            unit_price=item.unit_price,
            reference_document=stock_entry.invoice_number,
            notes=f"Stock IN reversal via stock entry {stock_entry.posting_number}",
        )

        reversed_items.append(
            {
                "stock_entry_item_id": item.id,
                "medicine_id": item.medicine_id,
                "medicine_name": item.medicine.name,
                "batch_number": item.batch_number,
                "quantity": item.quantity,
            }
        )

    UserLog.objects.create(
        user=stock_entry.received_by,
        action="Stock Entry Reversed",
        details=json.dumps(
            {
                "stock_entry_id": stock_entry.id,
                "posting_number": stock_entry.posting_number,
                "invoice_number": stock_entry.invoice_number,
                "items": reversed_items,
            },
            default=str,
        ),
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def batch_detail(request, batch_id: int):
    expiry_soon_days = _get_inventory_threshold(
        request,
        "expiry_soon_days",
        EXPIRY_SOON_DEFAULT_DAYS,
    )
    low_stock_threshold = _get_inventory_threshold(
        request,
        "low_stock_threshold",
        LOW_STOCK_DEFAULT_THRESHOLD,
        minimum=1,
        maximum=10000,
    )

    snapshot = _build_inventory_snapshot(expiry_soon_days, low_stock_threshold)
    batch_payload = next(
        (item for item in snapshot["items"] if item["batch_id"] == batch_id),
        None,
    )

    if not batch_payload:
        return JsonResponse({"error": "Batch not found."}, status=404)

    batch_logs = list(
        StockEntryItem.objects.select_related("stock_entry", "medicine")
        .filter(batch_id=batch_id)
        .order_by("-created_at")[:10]
    )

    related_batches = [
        item
        for item in snapshot["items"]
        if item["medicine_id"] == batch_payload["medicine_id"]
        and item["batch_id"] != batch_payload["batch_id"]
    ][:5]

    return JsonResponse(
        {
            **batch_payload,
            "recent_movements": [
                {
                    "stock_entry_id": movement.stock_entry_id,
                    "posting_number": movement.stock_entry.posting_number,
                    "invoice_number": movement.stock_entry.invoice_number,
                    "quantity": movement.quantity,
                    "unit_price": str(movement.unit_price),
                    "status": movement.stock_entry.get_status_display(),
                    "created_at": movement.created_at.isoformat(),
                }
                for movement in batch_logs
            ],
            "related_batches": related_batches,
        }
    )


def _serialize_sale(sale, include_items=False):
    total_quantity = getattr(sale, "total_quantity", None)
    if total_quantity is None:
        total_quantity = sale.items.aggregate(
            total=Coalesce(Sum("quantity"), Value(0))
        )["total"]

    payload = {
        "id": sale.id,
        "posting_number": sale.posting_number,
        "customer_name": sale.customer_name,
        "invoice_number": sale.invoice_number,
        "payment_method": sale.payment_method,
        "payment_method_label": sale.get_payment_method_display(),
        "status": sale.get_status_display(),
        "status_key": sale.status,
        "total_amount": str(sale.total_amount),
        "total_quantity": total_quantity,
        "cashier_id": sale.cashier_id,
        "cashier": getattr(sale.cashier, "email", ""),
        "notes": sale.notes,
        "created_at": sale.created_at.isoformat(),
        "updated_at": sale.updated_at.isoformat(),
    }

    if include_items:
        payload["items"] = [
            {
                "id": item.id,
                "medicine_id": item.medicine_id,
                "medicine_name": item.medicine.name,
                "batch_id": item.batch_id,
                "inventory_batch_id": item.batch_id,
                "batch_number": item.batch.batch_number if item.batch else "",
                "inventory_batch_number": item.batch.batch_number if item.batch else "",
                "quantity": item.quantity,
                "price_at_sale": str(item.price_at_sale),
                "subtotal": str(item.subtotal),
                "expiry_date": item.batch.expiry_date.isoformat()
                if item.batch
                else None,
            }
            for item in sale.items.select_related("medicine", "batch").all()
        ]

    return payload


def _normalize_sale_payload(payload):
    customer_name = (payload.get("customer_name") or "").strip()
    invoice_number = (payload.get("invoice_number") or "").strip()
    payment_method = (payload.get("payment_method") or Sale.PAYMENT_METHOD_CASH).strip()
    notes = (payload.get("notes") or "").strip()
    items = payload.get("items") or []

    if not isinstance(items, list) or len(items) == 0:
        raise ValueError("At least one stock-out item is required.")

    valid_payment_methods = {choice[0] for choice in Sale.PAYMENT_METHOD_CHOICES}
    if payment_method not in valid_payment_methods:
        raise ValueError("Payment method is invalid.")

    normalized_items = []
    total_amount = Decimal("0")

    for index, item in enumerate(items, start=1):
        prefix = f"Item #{index}"
        medicine_id = item.get("medicine_id")
        batch_id = item.get("batch_id")

        if not medicine_id:
            raise ValueError(f"{prefix}: medicine is required.")

        medicine = _get_fetchable_medicine(medicine_id, prefix)

        quantity = _parse_positive_int(item.get("quantity"), f"{prefix} quantity")
        unit_price = _parse_decimal(
            item.get("unit_price") or medicine.selling_price,
            f"{prefix} unit price",
        )

        if batch_id:
            today = timezone.localdate()
            try:
                batch = Batches.objects.get(
                    pk=batch_id,
                    product_id=medicine,
                    product_id__is_active=True,
                    product_id__status=Medicine.STATUS_SUBMITTED,
                    quantity__gt=0,
                    expiry_date__gt=today,
                )
            except Batches.DoesNotExist as exc:
                raise ValueError(f"{prefix}: selected batch is not available.") from exc

            if batch.quantity < quantity:
                raise ValueError(
                    f"{prefix}: batch {batch.batch_number} only has {batch.quantity} available."
                )

            subtotal = unit_price * quantity
            total_amount += subtotal
            normalized_items.append(
                {
                    "medicine": medicine,
                    "batch": batch,
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "subtotal": subtotal,
                }
            )
            continue

        remaining_quantity = quantity
        fefo_batches = list(
            Batches.objects.filter(
                product_id=medicine,
                product_id__is_active=True,
                product_id__status=Medicine.STATUS_SUBMITTED,
                quantity__gt=0,
                expiry_date__gt=timezone.localdate(),
            ).order_by(
                "expiry_date",
                "manufacturing_date",
                "created_at",
                "batch_number",
            )
        )

        if not fefo_batches:
            raise ValueError(
                f"{prefix}: no sellable batches are available for {medicine.name}."
            )

        available_quantity = sum(batch.quantity for batch in fefo_batches)
        if available_quantity < quantity:
            raise ValueError(
                f"{prefix}: only {available_quantity} units are available for {medicine.name}."
            )

        for batch in fefo_batches:
            if remaining_quantity <= 0:
                break

            allocated_quantity = min(batch.quantity, remaining_quantity)
            subtotal = unit_price * allocated_quantity
            total_amount += subtotal
            normalized_items.append(
                {
                    "medicine": medicine,
                    "batch": batch,
                    "quantity": allocated_quantity,
                    "unit_price": unit_price,
                    "subtotal": subtotal,
                }
            )
            remaining_quantity -= allocated_quantity

    return {
        "customer_name": customer_name,
        "invoice_number": invoice_number,
        "payment_method": payment_method,
        "notes": notes,
        "total_amount": total_amount,
        "items": normalized_items,
    }


def _replace_sale_items(sale, normalized_items):
    sale.items.all().delete()

    for item in normalized_items:
        SaleItem.objects.create(
            sale=sale,
            medicine=item["medicine"],
            batch=item["batch"],
            quantity=item["quantity"],
            price_at_sale=item["unit_price"],
            subtotal=item["subtotal"],
        )


def _post_sale(sale):
    if sale.status != Sale.STATUS_DRAFT:
        raise ValueError("Only draft stock-out documents can be submitted.")

    sale_items = list(sale.items.select_related("medicine", "batch").all())
    if not sale_items:
        raise ValueError("Draft stock-out does not contain any items.")

    reversed_items = []

    batch_ids = sorted({item.batch_id for item in sale_items if item.batch_id})
    locked_batches = {
        batch.batch_id: batch
        for batch in Batches.objects.select_for_update().filter(pk__in=batch_ids)
    }
    if len(locked_batches) != len(batch_ids):
        raise ValueError("One or more allocated batches are no longer available.")

    inventory_keys = sorted(
        {
            (item.medicine_id, locked_batches[item.batch_id].batch_number)
            for item in sale_items
        }
    )
    locked_inventory = {}
    for medicine_id, batch_number in inventory_keys:
        inventory_row = (
            Inventory.objects.select_for_update()
            .filter(medicine_id=medicine_id, batch_number=batch_number)
            .first()
        )
        if not inventory_row:
            raise ValueError(f"Inventory record is missing for batch {batch_number}.")
        locked_inventory[(medicine_id, batch_number)] = inventory_row

    for item in sale_items:
        if not item.batch_id or not item.batch:
            raise ValueError(f"Batch allocation is missing for '{item.medicine.name}'.")

        batch = locked_batches.get(item.batch_id)
        if not batch:
            raise ValueError(f"Batch allocation is missing for '{item.medicine.name}'.")
        if batch.quantity < item.quantity:
            raise ValueError(
                f"Batch {batch.batch_number} no longer has enough stock to complete this sale."
            )

        batch.quantity -= item.quantity
        batch.save(update_fields=["quantity"])

        inventory_row = locked_inventory.get((item.medicine_id, batch.batch_number))
        if not inventory_row:
            raise ValueError(
                f"Inventory record is missing for batch {batch.batch_number}."
            )

        if inventory_row.quantity < item.quantity:
            raise ValueError(
                f"Inventory batch {batch.batch_number} does not have enough stock."
            )

        inventory_row.quantity -= item.quantity
        if inventory_row.quantity == 0:
            inventory_row.delete()
        else:
            inventory_row.save(update_fields=["quantity", "updated_at"])

        StockLedger.objects.create(
            medicine=item.medicine,
            batch=batch,
            transaction_type=StockLedger.TRANSACTION_SALE,
            quantity=-item.quantity,
            unit_price=item.price_at_sale,
            reference_document=sale.invoice_number,
            notes=f"Stock OUT via sale {sale.posting_number}",
        )

        # Calculate COGS using costing method
        try:
            total_cogs, layers_used, method_used = consume_stock(
                medicine=item.medicine,
                quantity_needed=item.quantity
            )

            # Update sale item with cost information
            item.calculated_cost = total_cogs
            item.unit_cost = total_cogs / item.quantity if item.quantity > 0 else 0
            item.cost_layers_used = layers_used
            item.costing_method = method_used
            item.save(update_fields=["calculated_cost", "unit_cost", "cost_layers_used", "costing_method"])
        except InsufficientStockError as e:
            raise ValueError(f"Cannot calculate cost for {item.medicine.name}: {str(e)}")

        reversed_items.append(
            {
                "sale_item_id": item.id,
                "medicine_id": item.medicine_id,
                "medicine_name": item.medicine.name,
                "batch_number": batch.batch_number,
                "quantity": item.quantity,
            }
        )

    sale.status = Sale.STATUS_POSTED
    sale.save(update_fields=["status", "updated_at"])

    UserLog.objects.create(
        user=sale.cashier,
        action="Stock Out Submitted",
        details=json.dumps(
            {
                "sale_id": sale.id,
                "posting_number": sale.posting_number,
                "invoice_number": sale.invoice_number,
                "customer_name": sale.customer_name,
                "items": reversed_items,
            },
            default=str,
        ),
    )


def _reverse_posted_sale(sale):
    if sale.status != Sale.STATUS_POSTED:
        raise ValueError("Only posted stock-out documents can be cancelled.")

    sale_items = list(sale.items.select_related("medicine", "batch").all())
    if not sale_items:
        raise ValueError("Posted stock-out does not contain any items.")

    restored_items = []

    batch_ids = sorted({item.batch_id for item in sale_items if item.batch_id})
    locked_batches = {
        batch.batch_id: batch
        for batch in Batches.objects.select_for_update().filter(pk__in=batch_ids)
    }
    if len(locked_batches) != len(batch_ids):
        raise ValueError("One or more allocated batches are no longer available.")
    inventory_keys = sorted(
        {
            (item.medicine_id, locked_batches[item.batch_id].batch_number)
            for item in sale_items
        }
    )
    locked_inventory = {}
    for medicine_id, batch_number in inventory_keys:
        inventory_row = (
            Inventory.objects.select_for_update()
            .filter(medicine_id=medicine_id, batch_number=batch_number)
            .first()
        )
        if inventory_row:
            locked_inventory[(medicine_id, batch_number)] = inventory_row

    for item in sale_items:
        if not item.batch_id or not item.batch:
            raise ValueError(f"Batch allocation is missing for '{item.medicine.name}'.")

        batch = locked_batches.get(item.batch_id)
        if not batch:
            raise ValueError(f"Batch allocation is missing for '{item.medicine.name}'.")
        batch.quantity += item.quantity
        batch.save(update_fields=["quantity"])

        inventory_row = locked_inventory.get((item.medicine_id, batch.batch_number))
        created = False
        if not inventory_row:
            inventory_row = Inventory.objects.create(
                medicine=item.medicine,
                batch_number=batch.batch_number,
                quantity=0,
                expiry_date=batch.expiry_date,
                location="Main Store",
            )
            created = True

        if not created:
            inventory_row.quantity += item.quantity
            inventory_row.expiry_date = batch.expiry_date
            inventory_row.save(update_fields=["quantity", "expiry_date", "updated_at"])
        else:
            inventory_row.quantity = item.quantity
            inventory_row.save(update_fields=["quantity", "updated_at"])

        StockLedger.objects.create(
            medicine=item.medicine,
            batch=batch,
            transaction_type=StockLedger.TRANSACTION_SALE,
            quantity=item.quantity,
            unit_price=item.price_at_sale,
            reference_document=sale.invoice_number,
            notes=f"Stock OUT reversal via sale {sale.posting_number}",
        )

        restored_items.append(
            {
                "sale_item_id": item.id,
                "medicine_id": item.medicine_id,
                "medicine_name": item.medicine.name,
                "batch_number": batch.batch_number,
                "quantity": item.quantity,
            }
        )

    UserLog.objects.create(
        user=sale.cashier,
        action="Stock Out Reversed",
        details=json.dumps(
            {
                "sale_id": sale.id,
                "posting_number": sale.posting_number,
                "invoice_number": sale.invoice_number,
                "customer_name": sale.customer_name,
                "items": restored_items,
            },
            default=str,
        ),
    )


def _serialize_medicine(medicine):
    return {
        "id": medicine.id,
        "name": medicine.name,
        "generic_name": medicine.generic_name,
        "category": medicine.category.name if medicine.category else "",
        "category_id": medicine.category_id,
        "supplier": medicine.supplier.name if medicine.supplier else "",
        "supplier_id": medicine.supplier_id,
        "cost_price": str(medicine.cost_price),
        "selling_price": str(medicine.selling_price),
        "barcode": medicine.barcode,
        "naming_series": medicine.naming_series,
        "description": medicine.description,
        "status": medicine.status,
        "is_active": medicine.is_active,
        "created_at": medicine.created_at.isoformat(),
    }


def _get_medicine_filter_values(request):
    return {
        "search": _compact_text(request.GET.get("search", "")),
        "category": _compact_text(request.GET.get("category", "")),
        "supplier": _compact_text(request.GET.get("supplier", "")),
        "status": _compact_text(request.GET.get("status", "")),
        "include_inactive": _is_truthy_query_value(
            request.GET.get("include_inactive")
        ),
    }


def _build_medicine_queryset(filters):
    queryset = Medicine.objects.select_related("category", "supplier")
    if not filters["include_inactive"]:
        queryset = queryset.filter(is_active=True)

    if filters["search"]:
        queryset = queryset.filter(
            Q(name__icontains=filters["search"])
            | Q(generic_name__icontains=filters["search"])
            | Q(barcode__icontains=filters["search"])
        )

    if filters["category"]:
        queryset = queryset.filter(category_id=filters["category"])

    if filters["supplier"]:
        queryset = queryset.filter(supplier_id=filters["supplier"])

    if filters["status"]:
        queryset = queryset.filter(status=filters["status"])

    return queryset.order_by("-created_at")


def _sanitize_excel_text(value):
    cleaned = str(value or "")
    return re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F]", "", cleaned)


def _build_medicine_export_rows(medicines):
    columns = [
        ("Naming Series", lambda medicine: medicine.naming_series),
        ("Name", lambda medicine: medicine.name),
        ("Generic Name", lambda medicine: medicine.generic_name),
        ("Barcode", lambda medicine: medicine.barcode),
        ("Category", lambda medicine: medicine.category.name if medicine.category else ""),
        ("Category ID", lambda medicine: medicine.category_id or ""),
        ("Supplier", lambda medicine: medicine.supplier.name if medicine.supplier else ""),
        ("Supplier ID", lambda medicine: medicine.supplier_id or ""),
        ("Cost Price", lambda medicine: medicine.cost_price),
        ("Selling Price", lambda medicine: medicine.selling_price),
        ("Status", lambda medicine: medicine.status),
        ("Is Active", lambda medicine: "true" if medicine.is_active else "false"),
        ("Created At", lambda medicine: medicine.created_at.isoformat()),
        ("Description", lambda medicine: medicine.description),
    ]

    rows = []
    for medicine in medicines:
        row = {}
        for label, resolver in columns:
            row[label] = str(resolver(medicine) or "")
        rows.append(row)

    return [label for label, _ in columns], rows


def _build_csv_response(file_name, headers, rows):
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{file_name}.csv"'
    writer = csv.DictWriter(response, fieldnames=headers)
    writer.writeheader()
    writer.writerows(rows)
    return response


def _build_json_response(file_name, filters, rows):
    response = HttpResponse(content_type="application/json")
    response["Content-Disposition"] = f'attachment; filename="{file_name}.json"'
    response.write(
        json.dumps(
            {
                "filters": filters,
                "count": len(rows),
                "rows": rows,
            },
            indent=2,
        )
    )
    return response


def _column_number_to_name(index):
    result = []
    current = index
    while current > 0:
        current, remainder = divmod(current - 1, 26)
        result.append(chr(65 + remainder))
    return "".join(reversed(result))


def _build_xlsx_response(file_name, headers, rows):
    workbook_buffer = io.BytesIO()
    namespaces = {
        "content_types": "http://schemas.openxmlformats.org/package/2006/content-types",
        "rels": "http://schemas.openxmlformats.org/package/2006/relationships",
        "office": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
        "spreadsheet": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    }

    worksheet_rows = []
    all_rows = [headers] + [[row.get(header, "") for header in headers] for row in rows]
    for row_index, row_values in enumerate(all_rows, start=1):
        cells = []
        for column_index, value in enumerate(row_values, start=1):
            cell_ref = f"{_column_number_to_name(column_index)}{row_index}"
            cells.append(
                f'<c r="{cell_ref}" t="inlineStr"><is><t>{xml_escape(_sanitize_excel_text(value))}</t></is></c>'
            )
        worksheet_rows.append(f'<row r="{row_index}">{"".join(cells)}</row>')

    sheet_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<worksheet xmlns="{namespaces["spreadsheet"]}">'
        f"<sheetData>{''.join(worksheet_rows)}</sheetData>"
        "</worksheet>"
    )

    with zipfile.ZipFile(workbook_buffer, "w", zipfile.ZIP_DEFLATED) as workbook:
        workbook.writestr(
            "[Content_Types].xml",
            (
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                f'<Types xmlns="{namespaces["content_types"]}">'
                '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
                '<Default Extension="xml" ContentType="application/xml"/>'
                '<Override PartName="/xl/workbook.xml" '
                'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
                '<Override PartName="/xl/worksheets/sheet1.xml" '
                'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
                "</Types>"
            ),
        )
        workbook.writestr(
            "_rels/.rels",
            (
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                f'<Relationships xmlns="{namespaces["rels"]}">'
                f'<Relationship Id="rId1" Type="{namespaces["office"]}/officeDocument" Target="xl/workbook.xml"/>'
                "</Relationships>"
            ),
        )
        workbook.writestr(
            "xl/workbook.xml",
            (
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                f'<workbook xmlns="{namespaces["spreadsheet"]}" xmlns:r="{namespaces["office"]}">'
                '<sheets><sheet name="Medicines" sheetId="1" r:id="rId1"/></sheets>'
                "</workbook>"
            ),
        )
        workbook.writestr(
            "xl/_rels/workbook.xml.rels",
            (
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                f'<Relationships xmlns="{namespaces["rels"]}">'
                f'<Relationship Id="rId1" Type="{namespaces["office"]}/worksheet" Target="worksheets/sheet1.xml"/>'
                "</Relationships>"
            ),
        )
        workbook.writestr("xl/worksheets/sheet1.xml", sheet_xml)

    response = HttpResponse(
        workbook_buffer.getvalue(),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    response["Content-Disposition"] = f'attachment; filename="{file_name}.xlsx"'
    return response


def _escape_pdf_text(value):
    return (
        str(value or "")
        .replace("\\", "\\\\")
        .replace("(", "\\(")
        .replace(")", "\\)")
    )


def _build_simple_pdf(lines, title):
    objects = []

    def add_object(payload):
        objects.append(payload)
        return len(objects)

    font_id = add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>")
    content_lines = ["BT", "/F1 10 Tf", "40 560 Td", f"({ _escape_pdf_text(title) }) Tj"]
    y_offset = 0
    for line in lines:
        y_offset += 14
        content_lines.append(
            f"1 0 0 1 40 {560 - y_offset} Tm ({_escape_pdf_text(line)}) Tj"
        )
    content_lines.append("ET")
    stream = "\n".join(content_lines)
    content_id = add_object(
        f"<< /Length {len(stream.encode('latin-1', errors='replace'))} >>\nstream\n{stream}\nendstream"
    )
    page_id = add_object(
        f"<< /Type /Page /Parent 4 0 R /MediaBox [0 0 842 595] /Contents {content_id} 0 R "
        f"/Resources << /Font << /F1 {font_id} 0 R >> >> >>"
    )
    pages_id = add_object(f"<< /Type /Pages /Count 1 /Kids [{page_id} 0 R] >>")
    catalog_id = add_object(f"<< /Type /Catalog /Pages {pages_id} 0 R >>")

    pdf = io.BytesIO()
    pdf.write(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(pdf.tell())
        pdf.write(
            f"{index} 0 obj\n{obj}\nendobj\n".encode("latin-1", errors="replace")
        )
    xref_start = pdf.tell()
    pdf.write(f"xref\n0 {len(objects) + 1}\n".encode("latin-1"))
    pdf.write(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.write(f"{offset:010d} 00000 n \n".encode("latin-1"))
    pdf.write(
        (
            f"trailer << /Size {len(objects) + 1} /Root {catalog_id} 0 R >>\n"
            f"startxref\n{xref_start}\n%%EOF"
        ).encode("latin-1")
    )
    return pdf.getvalue()


def _build_pdf_response(file_name, headers, rows):
    header_line = " | ".join(headers)
    separator_line = "-" * min(len(header_line), 180)
    data_lines = [
        " | ".join(_truncate_text(row.get(header, ""), 24) for header in headers)
        for row in rows
    ]
    pdf_bytes = _build_simple_pdf(
        [header_line, separator_line] + data_lines, "Medicine Registry Export"
    )
    response = HttpResponse(pdf_bytes, content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{file_name}.pdf"'
    return response


def _parse_csv_import(file_bytes):
    text = file_bytes.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    return [dict(row) for row in reader]


def _parse_json_import(file_bytes):
    payload = json.loads(file_bytes.decode("utf-8-sig"))
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict) and isinstance(payload.get("rows"), list):
        return payload["rows"]
    raise ValueError("JSON import file must contain an array or a rows array.")


def _parse_xlsx_import(file_bytes):
    with zipfile.ZipFile(io.BytesIO(file_bytes)) as workbook:
        shared_strings = []
        if "xl/sharedStrings.xml" in workbook.namelist():
            root = ET.fromstring(workbook.read("xl/sharedStrings.xml"))
            namespace = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
            for string_item in root.findall("main:si", namespace):
                shared_strings.append(
                    "".join(
                        node.text or ""
                        for node in string_item.findall(".//main:t", namespace)
                    )
                )

        sheet_root = ET.fromstring(workbook.read("xl/worksheets/sheet1.xml"))
        namespace = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
        parsed_rows = []
        for row in sheet_root.findall(".//main:row", namespace):
            values = []
            for cell in row.findall("main:c", namespace):
                cell_type = cell.attrib.get("t")
                if cell_type == "inlineStr":
                    values.append(
                        "".join(
                            node.text or ""
                            for node in cell.findall(".//main:t", namespace)
                        )
                    )
                    continue
                value_node = cell.find("main:v", namespace)
                raw_value = value_node.text if value_node is not None else ""
                if cell_type == "s" and raw_value:
                    values.append(shared_strings[int(raw_value)])
                else:
                    values.append(raw_value or "")
            parsed_rows.append(values)

    if not parsed_rows:
        return []
    headers = parsed_rows[0]
    return [
        {headers[index]: value for index, value in enumerate(row)}
        for row in parsed_rows[1:]
        if any(str(value).strip() for value in row)
    ]


MEDICINE_IMPORT_COLUMNS = [
    "Name",
    "Generic Name",
    "Barcode",
    "Category ID",
    "Supplier ID",
    "Cost Price",
    "Selling Price",
    "Status",
    "Is Active",
    "Description",
]

MEDICINE_IMPORT_REQUIRED_COLUMNS = ["Name", "Barcode", "Category ID"]


def _normalize_boolean_import_value(raw_value):
    normalized = str(raw_value or "").strip().lower()
    if normalized in {"", "true", "1", "yes", "active"}:
        return True, None
    if normalized in {"false", "0", "no", "inactive"}:
        return False, None
    return None, "Expected a boolean-like value such as true/false, yes/no, or 1/0."


def _normalize_decimal_import_value(raw_value, field_label):
    value = str(raw_value or "").strip()
    if not value:
        return "0", None
    try:
        normalized = Decimal(value)
    except (InvalidOperation, TypeError):
        return None, f"{field_label} must be a valid number."
    return str(normalized), None


def _normalize_integer_import_value(raw_value, field_label, required=False):
    value = str(raw_value or "").strip()
    if not value:
        if required:
            return None, f"{field_label} is required."
        return None, None
    try:
        return int(value), None
    except (TypeError, ValueError):
        return None, f"{field_label} must be a whole number."


def _validate_imported_medicine_row(row):
    def get_value(*keys):
        for key in keys:
            value = row.get(key)
            if value is not None and str(value).strip():
                return str(value).strip()
        return ""

    errors = []
    name = get_value("Name", "name")
    barcode = get_value("Barcode", "barcode")
    category_id = get_value("Category ID", "category_id")

    if not name:
        errors.append({"column": "Name", "message": "Name is required."})
    if not barcode:
        errors.append({"column": "Barcode", "message": "Barcode is required."})

    supplier_id_value = get_value("Supplier ID", "supplier_id")
    status_value = get_value("Status", "status")
    category_id_value, category_id_error = _normalize_integer_import_value(
        category_id,
        "Category ID",
        required=True,
    )
    if category_id_error:
        errors.append({"column": "Category ID", "message": category_id_error})

    supplier_id, supplier_id_error = _normalize_integer_import_value(
        supplier_id_value,
        "Supplier ID",
    )
    if supplier_id_error:
        errors.append({"column": "Supplier ID", "message": supplier_id_error})

    cost_price, cost_price_error = _normalize_decimal_import_value(
        get_value("Cost Price", "cost_price"),
        "Cost Price",
    )
    if cost_price_error:
        errors.append({"column": "Cost Price", "message": cost_price_error})

    selling_price, selling_price_error = _normalize_decimal_import_value(
        get_value("Selling Price", "selling_price"),
        "Selling Price",
    )
    if selling_price_error:
        errors.append({"column": "Selling Price", "message": selling_price_error})

    is_active, is_active_error = _normalize_boolean_import_value(
        get_value("Is Active", "is_active")
    )
    if is_active_error:
        errors.append({"column": "Is Active", "message": is_active_error})

    normalized_status = (
        Medicine.STATUS_SUBMITTED
        if status_value.lower() == Medicine.STATUS_SUBMITTED.lower()
        else Medicine.STATUS_DRAFT
    )
    if status_value and status_value.lower() not in {
        Medicine.STATUS_DRAFT.lower(),
        Medicine.STATUS_SUBMITTED.lower(),
    }:
        errors.append(
            {
                "column": "Status",
                "message": "Status must be Draft or Submitted.",
            }
        )

    normalized = {
        "name": name,
        "generic_name": get_value("Generic Name", "generic_name"),
        "barcode": barcode,
        "category_id": category_id_value,
        "supplier_id": supplier_id,
        "cost_price": cost_price,
        "selling_price": selling_price,
        "description": get_value("Description", "description"),
        "status": normalized_status,
        "is_active": is_active if is_active is not None else True,
    }

    return normalized, errors


def _normalize_imported_medicine_row(row):
    normalized, errors = _validate_imported_medicine_row(row)
    if errors:
        raise ValueError("; ".join(error["message"] for error in errors))

    return normalized


def _parse_uploaded_medicine_import_file(uploaded_file):
    extension = (
        uploaded_file.name.rsplit(".", 1)[-1].lower()
        if "." in uploaded_file.name
        else ""
    )
    file_bytes = uploaded_file.read()

    if extension == "csv":
        return extension, _parse_csv_import(file_bytes)
    if extension == "json":
        return extension, _parse_json_import(file_bytes)
    if extension == "xlsx":
        return extension, _parse_xlsx_import(file_bytes)
    raise ValueError("Unsupported import format. Use csv, json, or xlsx.")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def medicines_list(request):

    page_size = int(request.GET.get("page_size", 10))
    page = int(request.GET.get("page", 1))
    filters = _get_medicine_filter_values(request)

    raw_key = (
        f"medicines:{page}:{page_size}:{filters['search']}:{filters['category']}:"
        f"{filters['supplier']}:{filters['status']}:{filters['include_inactive']}"
    )
    cache_key = hashlib.md5(raw_key.encode()).hexdigest()

    cached_response = cache.get(cache_key)
    if cached_response:
        return JsonResponse(cached_response)

    queryset = _build_medicine_queryset(filters)

    paginator = Paginator(queryset, page_size)

    try:
        medicines_page = paginator.page(page)
    except EmptyPage:
        medicines_page = paginator.page(1)

    medicines_data = [_serialize_medicine(medicine) for medicine in medicines_page]

    response_data = {
        "results": medicines_data,
        "count": paginator.count,
        "total_pages": paginator.num_pages,
        "current_page": medicines_page.number,
        "page_size": page_size,
        "has_next": medicines_page.has_next(),
        "has_previous": medicines_page.has_previous(),
    }

    cache.set(cache_key, response_data, timeout=60)

    return JsonResponse(response_data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def medicines_export(request):
    filters = _get_medicine_filter_values(request)
    export_format = _compact_text(request.GET.get("export_format", "")).lower()
    medicines = list(_build_medicine_queryset(filters))
    headers, rows = _build_medicine_export_rows(medicines)
    file_name = f"Medicine-{timezone.now().strftime('%Y%m%d-%H%M%S')}"

    if export_format == "csv":
        return _build_csv_response(file_name, headers, rows)
    if export_format == "json":
        return _build_json_response(file_name, filters, rows)
    if export_format == "xlsx":
        return _build_xlsx_response(file_name, headers, rows)
    if export_format == "pdf":
        return _build_pdf_response(file_name, headers, rows)

    return JsonResponse(
        {"error": "Unsupported export format. Use csv, json, xlsx, or pdf."},
        status=400,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def medicines_import_preview(request):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    uploaded_file = request.FILES.get("file")
    if not uploaded_file:
        return JsonResponse({"error": "Import file is required."}, status=400)

    try:
        source_format, raw_rows = _parse_uploaded_medicine_import_file(uploaded_file)
    except Exception as exc:
        return JsonResponse({"error": f"Failed to parse import file: {exc}"}, status=400)

    columns = list(raw_rows[0].keys()) if raw_rows else []
    missing_columns = [column for column in MEDICINE_IMPORT_REQUIRED_COLUMNS if column not in columns]
    unexpected_columns = [column for column in columns if column not in MEDICINE_IMPORT_COLUMNS]

    errors = []
    for missing_column in missing_columns:
        errors.append(
            {
                "row": None,
                "column": missing_column,
                "message": f"Missing required column: {missing_column}.",
            }
        )

    valid_rows = 0
    invalid_rows = 0
    for index, row in enumerate(raw_rows, start=2):
        _, row_errors = _validate_imported_medicine_row(row)
        if row_errors:
            invalid_rows += 1
            for row_error in row_errors:
                errors.append(
                    {
                        "row": index,
                        "column": row_error["column"],
                        "message": row_error["message"],
                    }
                )
        else:
            valid_rows += 1

    sample_rows = []
    for index, row in enumerate(raw_rows[:10], start=2):
        sample_rows.append(
            {
                "row": index,
                "values": {column: str(row.get(column, "") or "") for column in columns},
            }
        )

    return JsonResponse(
        {
            "file_name": uploaded_file.name,
            "source_format": source_format,
            "columns": columns,
            "expected_columns": MEDICINE_IMPORT_COLUMNS,
            "missing_columns": missing_columns,
            "unexpected_columns": unexpected_columns,
            "total_rows": len(raw_rows),
            "valid_rows": valid_rows,
            "invalid_rows": invalid_rows,
            "can_import": len(errors) == 0,
            "errors": errors[:200],
            "sample_rows": sample_rows,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def medicines_import(request):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    uploaded_file = request.FILES.get("file")
    if not uploaded_file:
        return JsonResponse({"error": "Import file is required."}, status=400)

    try:
        _source_format, raw_rows = _parse_uploaded_medicine_import_file(uploaded_file)
    except Exception as exc:
        return JsonResponse({"error": f"Failed to parse import file: {exc}"}, status=400)

    created = 0
    failures = []

    for index, raw_row in enumerate(raw_rows, start=2):
        try:
            normalized = _normalize_imported_medicine_row(raw_row)
            medicine = Medicine(**normalized)
            medicine.save()
            created += 1
        except Exception as exc:
            failures.append({"row": index, "error": str(exc)})

    if created:
        cache.clear()

    UserLog.objects.create(
        user=request.user,
        action="Medicine Import",
        details=json.dumps(
            {
                "file_name": uploaded_file.name,
                "created": created,
                "failed": len(failures),
            },
            default=str,
        ),
    )

    return JsonResponse(
        {
            "message": "Medicine import completed.",
            "created": created,
            "failed": len(failures),
            "failures": failures[:20],
        }
    )


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def medicines_update(request, medicine_id):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied
    try:
        try:
            medicine = Medicine.objects.get(id=medicine_id)
        except Medicine.DoesNotExist:
            return JsonResponse({"error": "Medicine not found"}, status=404)

        medicine_data = request.data

        # Capture original values for change tracking
        original = {
            "name": medicine.name,
            "generic_name": medicine.generic_name,
            "barcode": medicine.barcode,
            "category_id": medicine.category_id,
            "supplier_id": medicine.supplier_id,
            "cost_price": str(medicine.cost_price),
            "selling_price": str(medicine.selling_price),
            "status": getattr(medicine, "status", None),
            "description": medicine.description,
            "is_active": medicine.is_active,
        }

        with transaction.atomic():
            # Core fields
            if "name" in medicine_data:
                medicine.name = medicine_data.get("name", medicine.name)
            if "generic_name" in medicine_data:
                medicine.generic_name = medicine_data.get(
                    "generic_name", medicine.generic_name
                )
            if "barcode" in medicine_data:
                medicine.barcode = medicine_data.get("barcode", medicine.barcode)

            # Keep category required, but allow leaving it unchanged if not provided
            if "category_id" in medicine_data:
                category_id = medicine_data.get("category_id")
                if category_id is not None:
                    medicine.category_id = category_id

            if "supplier_id" in medicine_data:
                supplier_id = medicine_data.get("supplier_id")
                medicine.supplier_id = supplier_id

            if "cost_price" in medicine_data:
                cost_price = medicine_data.get("cost_price")
                if cost_price is not None:
                    medicine.cost_price = cost_price

            if "selling_price" in medicine_data:
                selling_price = medicine_data.get("selling_price")
                if selling_price is not None:
                    medicine.selling_price = selling_price

            if "description" in medicine_data:
                medicine.description = medicine_data.get("description") or ""

            if "is_active" in medicine_data:
                medicine.is_active = bool(medicine_data.get("is_active"))

            if "status" in medicine_data:
                medicine.status = medicine_data.get("status") or medicine.status

            medicine.save()

            # Build change set for logging
            updated = {
                "name": medicine.name,
                "generic_name": medicine.generic_name,
                "barcode": medicine.barcode,
                "category_id": medicine.category_id,
                "supplier_id": medicine.supplier_id,
                "cost_price": str(medicine.cost_price),
                "selling_price": str(medicine.selling_price),
                "status": getattr(medicine, "status", None),
                "description": medicine.description,
                "is_active": medicine.is_active,
            }

            changes = {}
            for field, old_value in original.items():
                new_value = updated[field]
                if old_value != new_value:
                    changes[field] = {
                        "from": old_value,
                        "to": new_value,
                    }

            UserLog.objects.create(
                user=request.user,
                action="Medicine Updated",
                details=json.dumps(
                    {
                        "medicine_id": medicine.id,
                        "naming_series": medicine.naming_series,
                        "changes": changes,
                    },
                    default=str,
                ),
            )

        return JsonResponse(
            {
                "message": "Medicine updated successfully",
                "medicine": {
                    "id": medicine.id,
                    "name": medicine.name,
                    "generic_name": medicine.generic_name,
                    "barcode": medicine.barcode,
                    "naming_series": medicine.naming_series,
                    "category_id": medicine.category_id,
                    "supplier_id": medicine.supplier_id,
                    "cost_price": medicine.cost_price,
                    "selling_price": medicine.selling_price,
                    "status": medicine.status,
                    "description": medicine.description,
                    "is_active": medicine.is_active,
                    "created_at": medicine.created_at.isoformat(),
                },
            }
        )
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def medicines_create(request):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied
    try:
        medicine_data = request.data
        with transaction.atomic():
            medicine = Medicine(
                name=medicine_data.get("name"),
                generic_name=medicine_data.get("generic_name"),
                barcode=medicine_data.get("barcode"),
                category_id=medicine_data.get("category_id"),
                supplier_id=medicine_data.get("supplier_id"),
                cost_price=medicine_data.get("cost_price"),
                selling_price=medicine_data.get("selling_price"),
                description=medicine_data.get("description"),
                status=medicine_data.get("status") or Medicine.STATUS_DRAFT,
                is_active=medicine_data.get(
                    "is_active", True
                ),  # Default to True if not provided
            )
            medicine.save()

            UserLog.objects.create(
                user=request.user,
                action="Medicine Created",
                details=json.dumps(
                    {
                        "medicine_id": medicine.id,
                        "naming_series": medicine.naming_series,
                        "name": medicine.name,
                        "generic_name": medicine.generic_name,
                        "barcode": medicine.barcode,
                        "category_id": medicine.category_id,
                        "supplier_id": medicine.supplier_id,
                    },
                    default=str,
                ),
            )

        return JsonResponse(
            {
                "message": "Medicine created successfully",
                "medicine": {
                    "id": medicine.id,
                    "name": medicine.name,
                    "generic_name": medicine.generic_name,
                    "barcode": medicine.barcode,
                    "naming_series": medicine.naming_series,
                    "category_id": medicine.category_id,
                    "supplier_id": medicine.supplier_id,
                    "cost_price": medicine.cost_price,
                    "selling_price": medicine.selling_price,
                    "status": medicine.status,
                    "description": medicine.description,
                    "is_active": medicine.is_active,
                    "created_at": medicine.created_at.isoformat(),
                },
            },
            status=201,
        )
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


def _serialize_category(category):
    return {
        "id": category.id,
        "name": category.name,
        "category_name": category.category_name,
        "naming_series": category.naming_series,
        "description": category.description,
        "parent_category_id": category.parent_category_id,
        "parent_category_name": (
            category.parent_category.name if category.parent_category else None
        ),
        "medicine_count": getattr(category, "medicine_count", 0),
        "child_count": getattr(category, "child_count", 0),
        "created_at": category.created_at.isoformat(),
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def medicine_categories_list(request):
    page_size = int(request.GET.get("page_size", 10))
    page = int(request.GET.get("page", 1))
    search = request.GET.get("search", "")
    name = request.GET.get("name", "")
    description = request.GET.get("description", "")
    parent_category = request.GET.get("parent_category", "")

    cache_key = (
        f"categories:{page}:{page_size}:{search}:{name}:{description}:{parent_category}"
    )
    cached_response = cache.get(cache_key)
    if cached_response:
        return JsonResponse(cached_response)

    queryset = (
        Category.objects.select_related("parent_category")
        .annotate(
            medicine_count=Count("medicines", distinct=True),
            child_count=Count("category", distinct=True),
        )
        .all()
    )

    if search:
        queryset = queryset.filter(
            Q(name__icontains=search)
            | Q(category_name__icontains=search)
            | Q(description__icontains=search)
            | Q(parent_category__name__icontains=search)
        )
    if name:
        queryset = queryset.filter(
            Q(name__icontains=name) | Q(category_name__icontains=name)
        )
    if description:
        queryset = queryset.filter(description__icontains=description)
    if parent_category:
        queryset = queryset.filter(parent_category_id=parent_category)

    queryset = queryset.order_by("-created_at")
    paginator = Paginator(queryset, page_size)

    try:
        categories_page = paginator.page(page)
    except EmptyPage:
        categories_page = paginator.page(1)

    categories_data = [_serialize_category(category) for category in categories_page]

    response_data = {
        "results": categories_data,
        "count": paginator.count,
        "total_pages": paginator.num_pages,
        "current_page": categories_page.number,
        "page_size": page_size,
        "has_next": categories_page.has_next(),
        "has_previous": categories_page.has_previous(),
    }

    cache.set(cache_key, response_data, timeout=300)

    return JsonResponse(response_data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def category_create(request):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied
    try:
        category_data = request.data
        parent_category_id = category_data.get("parent_category_id")

        if not _compact_text(category_data.get("name")):
            return JsonResponse({"error": "Category name is required."}, status=400)

        with transaction.atomic():
            category = Category(
                name=_compact_text(category_data.get("name")),
                category_name=_compact_text(category_data.get("category_name")) or None,
                description=category_data.get("description") or "",
                parent_category_id=parent_category_id or None,
            )
            category.save()

            UserLog.objects.create(
                user=request.user,
                action="Category Created",
                details=json.dumps(
                    {
                        "category_id": category.id,
                        "naming_series": category.naming_series,
                        "name": category.name,
                        "category_name": category.category_name,
                        "parent_category_id": category.parent_category_id,
                    },
                    default=str,
                ),
            )

        cache.clear()
        category = (
            Category.objects.select_related("parent_category")
            .annotate(
                medicine_count=Count("medicines", distinct=True),
                child_count=Count("category", distinct=True),
            )
            .get(pk=category.id)
        )

        return JsonResponse(
            {
                "message": "Category created successfully",
                "category": _serialize_category(category),
            },
            status=201,
        )
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def category_detail(request, category_id):
    try:
        category = (
            Category.objects.select_related("parent_category")
            .annotate(
                medicine_count=Count("medicines", distinct=True),
                child_count=Count("category", distinct=True),
            )
            .get(pk=category_id)
        )
    except Category.DoesNotExist:
        return JsonResponse({"error": "Category not found"}, status=404)

    return JsonResponse(_serialize_category(category))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def category_detail_by_naming_series(request, naming_series):
    try:
        category = (
            Category.objects.select_related("parent_category")
            .annotate(
                medicine_count=Count("medicines", distinct=True),
                child_count=Count("category", distinct=True),
            )
            .get(naming_series=naming_series)
        )
    except Category.DoesNotExist:
        return JsonResponse({"error": "Category not found"}, status=404)

    return JsonResponse(_serialize_category(category))


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def category_update(request, category_id):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied
    try:
        category = Category.objects.get(pk=category_id)
    except Category.DoesNotExist:
        return JsonResponse({"error": "Category not found"}, status=404)

    try:
        category_data = request.data
        original = {
            "name": category.name,
            "category_name": category.category_name,
            "description": category.description,
            "parent_category_id": category.parent_category_id,
        }

        with transaction.atomic():
            if "name" in category_data:
                category.name = _compact_text(category_data.get("name"))
            if "category_name" in category_data:
                category.category_name = (
                    _compact_text(category_data.get("category_name")) or None
                )
            if "description" in category_data:
                category.description = category_data.get("description") or ""
            if "parent_category_id" in category_data:
                parent_category_id = category_data.get("parent_category_id")
                parent_category_id = parent_category_id or None
                if parent_category_id == category.id:
                    return JsonResponse(
                        {"error": "Category cannot be its own parent."}, status=400
                    )
                category.parent_category_id = parent_category_id

            if not _compact_text(category.name):
                return JsonResponse({"error": "Category name is required."}, status=400)

            category.save()

            updated = {
                "name": category.name,
                "category_name": category.category_name,
                "description": category.description,
                "parent_category_id": category.parent_category_id,
            }
            changes = {}
            for field, old_value in original.items():
                new_value = updated[field]
                if old_value != new_value:
                    changes[field] = {"from": old_value, "to": new_value}

            UserLog.objects.create(
                user=request.user,
                action="Category Updated",
                details=json.dumps(
                    {
                        "category_id": category.id,
                        "changes": changes,
                    },
                    default=str,
                ),
            )

        cache.clear()
        category = (
            Category.objects.select_related("parent_category")
            .annotate(
                medicine_count=Count("medicines", distinct=True),
                child_count=Count("category", distinct=True),
            )
            .get(pk=category.id)
        )

        return JsonResponse(
            {
                "message": "Category updated successfully",
                "category": _serialize_category(category),
            }
        )
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def category_logs(request, category_id):
    try:
        Category.objects.get(pk=category_id)
    except Category.DoesNotExist:
        return JsonResponse({"error": "Category not found"}, status=404)

    logs = UserLog.objects.select_related("user").order_by("-timestamp")
    matched_logs = _filter_logs_for_entity(logs, "category_id", category_id)
    serialized_logs = [_serialize_user_log(log) for log in matched_logs[:20]]
    return JsonResponse({"results": serialized_logs})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def category_delete(request, category_id):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    try:
        category = Category.objects.annotate(
            medicine_count=Count("medicines", distinct=True),
            child_count=Count("category", distinct=True),
        ).get(pk=category_id)
    except Category.DoesNotExist:
        return JsonResponse({"error": "Category not found"}, status=404)

    if (category.medicine_count or 0) > 0:
        linked_medicine = (
            Medicine.objects.filter(category_id=category.id)
            .order_by("name")
            .values("id", "name", "naming_series")
            .first()
        )
        return JsonResponse(
            {
                "error": "Category with linked medicines cannot be deleted.",
                "linked_medicine": linked_medicine,
            },
            status=400,
        )

    if (category.child_count or 0) > 0:
        return JsonResponse(
            {"error": "Category with subcategories cannot be deleted."},
            status=400,
        )

    category_name = category.name
    category_series = category.naming_series

    with transaction.atomic():
        category.delete()
        UserLog.objects.create(
            user=request.user,
            action="Category Deleted",
            details=json.dumps(
                {
                    "category_id": category_id,
                    "name": category_name,
                    "naming_series": category_series,
                },
                default=str,
            ),
        )

    cache.clear()
    return JsonResponse({"message": "Category deleted successfully"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def medicine_detail_by_naming_series(request, naming_series):
    """
    Get medicine details by naming_series for routing.
    This endpoint is optimized for performance by using the indexed naming_series field.
    """
    try:
        # Use the indexed naming_series field for fast lookup
        medicine = Medicine.objects.get(naming_series=naming_series)
    except Medicine.DoesNotExist:
        return JsonResponse({"error": "Medicine not found"}, status=404)

    return JsonResponse(
        {
            "id": medicine.id,
            "name": medicine.name,
            "generic_name": medicine.generic_name,
            "category": medicine.category.name if medicine.category else "",
            "category_id": medicine.category_id,
            "supplier": medicine.supplier.name if medicine.supplier else "",
            "supplier_id": medicine.supplier_id,
            "cost_price": str(medicine.cost_price),
            "selling_price": str(medicine.selling_price),
            "barcode": medicine.barcode,
            "naming_series": medicine.naming_series,
            "description": medicine.description,
            "is_active": medicine.is_active,
            "status": medicine.status,
            "created_at": medicine.created_at.isoformat(),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def medicine_detail(request, medicine_id):
    try:
        medicine = Medicine.objects.get(id=medicine_id)
    except Medicine.DoesNotExist:
        return JsonResponse({"error": "Medicine not found"}, status=404)

    return JsonResponse(
        {
            "id": medicine.id,
            "name": medicine.name,
            "generic_name": medicine.generic_name,
            "category": medicine.category.name if medicine.category else "",
            "category_id": medicine.category_id,
            "supplier": medicine.supplier.name if medicine.supplier else "",
            "supplier_id": medicine.supplier_id,
            "cost_price": str(medicine.cost_price),
            "selling_price": str(medicine.selling_price),
            "barcode": medicine.barcode,
            "naming_series": medicine.naming_series,
            "description": medicine.description,
            "is_active": medicine.is_active,
            "status": medicine.status,
            "created_at": medicine.created_at.isoformat(),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def supplier_list(request):
    page_size = int(request.GET.get("page_size", 10))
    page = int(request.GET.get("page", 1))
    search = request.GET.get("search", "").strip()
    name = request.GET.get("name", "").strip()
    contact_person = request.GET.get("contact_person", "").strip()
    phone = request.GET.get("phone", "").strip()
    email = request.GET.get("email", "").strip()
    address = request.GET.get("address", "").strip()
    status = request.GET.get("status", "").strip()
    is_active = request.GET.get("is_active", "").strip().lower()

    cache_key = (
        f"suppliers:{page}:{page_size}:{search}:{name}:{contact_person}:"
        f"{phone}:{email}:{address}:{status}:{is_active}"
    )
    cached_response = cache.get(cache_key)
    if cached_response:
        return JsonResponse(cached_response)

    queryset = Supplier.objects.annotate(medicine_count=Count("medicines"))
    if search:
        queryset = queryset.filter(
            Q(name__icontains=search)
            | Q(contact_person__icontains=search)
            | Q(phone__icontains=search)
            | Q(email__icontains=search)
            | Q(address__icontains=search)
        )
    if name:
        queryset = queryset.filter(name__icontains=name)
    if contact_person:
        queryset = queryset.filter(contact_person__icontains=contact_person)
    if phone:
        queryset = queryset.filter(phone__icontains=phone)
    if email:
        queryset = queryset.filter(email__icontains=email)
    if address:
        queryset = queryset.filter(address__icontains=address)
    if status:
        queryset = queryset.filter(status=status)
    if is_active in {"true", "false"}:
        queryset = queryset.filter(is_active=is_active == "true")
    queryset = queryset.order_by("-created_at")
    paginator = Paginator(queryset, page_size)
    try:
        suppliers_page = paginator.page(page)
    except EmptyPage:
        suppliers_page = paginator.page(1)
    suppliers_data = [_serialize_supplier(supplier) for supplier in suppliers_page]
    response_data = {
        "results": suppliers_data,
        "count": paginator.count,
        "total_pages": paginator.num_pages,
        "current_page": suppliers_page.number,
        "page_size": page_size,
        "has_next": suppliers_page.has_next(),
        "has_previous": suppliers_page.has_previous(),
    }
    cache.set(cache_key, response_data, timeout=300)
    return JsonResponse(response_data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def supplier_create(request):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied
    try:
        normalized = _normalize_supplier_payload(request.data)
        with transaction.atomic():
            supplier = Supplier.objects.create(**normalized)
            UserLog.objects.create(
                user=request.user,
                action="Supplier Created",
                details=json.dumps(
                    {
                        "supplier_id": supplier.id,
                        "name": supplier.name,
                        "status": supplier.status,
                        "is_active": supplier.is_active,
                    },
                    default=str,
                ),
            )
        return JsonResponse(
            {
                "message": "Supplier created successfully",
                "supplier": _serialize_supplier(supplier),
            },
            status=201,
        )
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=400)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def supplier_detail(request, supplier_id):
    try:
        supplier = Supplier.objects.annotate(medicine_count=Count("medicines")).get(
            id=supplier_id
        )
    except Supplier.DoesNotExist:
        return JsonResponse({"error": "Supplier not found"}, status=404)

    return JsonResponse(_serialize_supplier(supplier))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def supplier_detail_by_naming_series(request, naming_series):
    try:
        supplier = Supplier.objects.annotate(medicine_count=Count("medicines")).get(
            naming_series=naming_series
        )
    except Supplier.DoesNotExist:
        return JsonResponse({"error": "Supplier not found"}, status=404)

    return JsonResponse(_serialize_supplier(supplier))


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def supplier_update(request, supplier_id):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied
    try:
        try:
            supplier = Supplier.objects.get(id=supplier_id)
        except Supplier.DoesNotExist:
            return JsonResponse({"error": "Supplier not found"}, status=404)

        normalized = _normalize_supplier_payload(request.data, partial=True)
        original = _serialize_supplier(supplier)

        with transaction.atomic():
            for field, value in normalized.items():
                setattr(supplier, field, value)
            supplier.save()

            updated = _serialize_supplier(supplier)
            changes = {}
            for field in (
                "name",
                "contact_person",
                "phone",
                "email",
                "address",
                "status",
                "is_active",
            ):
                if original.get(field) != updated.get(field):
                    changes[field] = {
                        "from": original.get(field),
                        "to": updated.get(field),
                    }

            UserLog.objects.create(
                user=request.user,
                action="Supplier Updated",
                details=json.dumps(
                    {
                        "supplier_id": supplier.id,
                        "changes": changes,
                    },
                    default=str,
                ),
            )

        return JsonResponse(
            {
                "message": "Supplier updated successfully",
                "supplier": updated,
            }
        )
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=400)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def supplier_logs(request, supplier_id):
    queryset = UserLog.objects.select_related("user").filter(
        action__istartswith="Supplier"
    )
    logs = _filter_logs_for_entity(
        queryset.order_by("-timestamp")[:50], "supplier_id", supplier_id
    )

    return JsonResponse(
        [_serialize_user_log(log) for log in logs],
        safe=False,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def supplier_cancel(request, supplier_id):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied
    try:
        supplier = Supplier.objects.get(id=supplier_id)
    except Supplier.DoesNotExist:
        return JsonResponse({"error": "Supplier not found"}, status=404)

    if supplier.status == Supplier.STATUS_CANCELLED:
        return JsonResponse({"error": "Supplier is already cancelled."}, status=400)

    supplier.status = Supplier.STATUS_CANCELLED
    supplier.is_active = False
    supplier.save(update_fields=["status", "is_active", "updated_at"])

    UserLog.objects.create(
        user=request.user,
        action="Supplier Cancelled",
        details=json.dumps(
            {
                "supplier_id": supplier.id,
                "name": supplier.name,
                "status": supplier.status,
                "is_active": supplier.is_active,
            },
            default=str,
        ),
    )

    return JsonResponse(
        {
            "message": "Supplier cancelled successfully",
            "supplier": _serialize_supplier(supplier),
        }
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def supplier_delete(request, supplier_id):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    try:
        supplier = Supplier.objects.annotate(medicine_count=Count("medicines")).get(
            id=supplier_id
        )
    except Supplier.DoesNotExist:
        return JsonResponse({"error": "Supplier not found"}, status=404)

    if supplier.status == Supplier.STATUS_SUBMITTED:
        return JsonResponse(
            {"error": "Cancel the document before deleting this supplier."},
            status=400,
        )

    if supplier.status not in (
        Supplier.STATUS_DRAFT,
        Supplier.STATUS_CANCELLED,
    ):
        return JsonResponse(
            {"error": "Only draft or cancelled suppliers can be deleted."},
            status=400,
        )

    if (supplier.medicine_count or 0) > 0:
        linked_medicine = (
            Medicine.objects.filter(supplier_id=supplier.id)
            .order_by("name")
            .values("id", "name", "naming_series")
            .first()
        )
        return JsonResponse(
            {
                "error": "Supplier with linked medicines cannot be deleted.",
                "linked_medicine": linked_medicine,
            },
            status=400,
        )

    supplier_name = supplier.name
    supplier_series = supplier.naming_series
    supplier_status = supplier.status

    with transaction.atomic():
        supplier.delete()
        UserLog.objects.create(
            user=request.user,
            action="Supplier Deleted",
            details=json.dumps(
                {
                    "supplier_id": supplier_id,
                    "name": supplier_name,
                    "naming_series": supplier_series,
                    "status": supplier_status,
                },
                default=str,
            ),
        )

    cache.clear()
    return JsonResponse({"message": "Supplier deleted successfully"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def medicine_logs(request, medicine_id: int):
    """
    Return user logs related to a medicine.

    Note: logs store medicine_id inside the JSON "details" string.
    We filter using a simple contains query to avoid schema changes.

    """
    try:
        queryset = UserLog.objects.select_related("user").filter(
            action__istartswith="Medicine"
        )
        logs = _filter_logs_for_entity(
            queryset.order_by("-timestamp")[:50], "medicine_id", medicine_id
        )[:5]
        data = [_serialize_user_log(log) for log in logs]

        return JsonResponse({"results": data})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def print_formats_list(request):
    queryset = PrintFormat.objects.all().order_by(
        "document_type", "-is_default", "name"
    )

    document_type = _compact_text(request.GET.get("document_type", ""))
    if document_type:
        queryset = queryset.filter(document_type=document_type)

    is_active = request.GET.get("is_active", "").strip().lower()
    if is_active in {"true", "false"}:
        queryset = queryset.filter(is_active=is_active == "true")

    return JsonResponse(
        {"results": [_serialize_print_format(item) for item in queryset]}
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def print_formats_create(request):
    denied = _require_roles(request, {"admin", "manager", "pharmacist"})
    if denied:
        return denied
    try:
        payload = _normalize_print_format_payload(request.data or {})
        print_format = PrintFormat.objects.create(**payload)
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except Exception as exc:
        if "uniq_print_format_document_type_slug" in str(exc).lower():
            return JsonResponse(
                {
                    "error": "A print format with this slug already exists for the selected document type."
                },
                status=400,
            )
        return JsonResponse({"error": str(exc)}, status=400)

    return JsonResponse(
        {
            "message": "Print format created successfully.",
            "print_format": _serialize_print_format(print_format),
        },
        status=201,
    )


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def print_formats_update(request, print_format_id: int):
    denied = _require_roles(request, {"admin", "manager", "pharmacist"})
    if denied:
        return denied

    try:
        print_format = PrintFormat.objects.get(id=print_format_id)
    except PrintFormat.DoesNotExist:
        return JsonResponse({"error": "Print format not found."}, status=404)

    try:
        payload = _normalize_print_format_payload(request.data or {})
        payload["document_type"] = print_format.document_type
        print_format = _save_print_format_changes(print_format, payload)
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except Exception as exc:
        if "uniq_print_format_document_type_slug" in str(exc).lower():
            return JsonResponse(
                {
                    "error": "A print format with this slug already exists for the selected document type."
                },
                status=400,
            )
        return JsonResponse({"error": str(exc)}, status=400)

    UserLog.objects.create(
        user=request.user,
        action="Print Format Updated",
        details=json.dumps(
            {
                "print_format_id": print_format.id,
                "document_type": print_format.document_type,
                "slug": print_format.slug,
                "name": print_format.name,
            },
            default=str,
        ),
    )

    return JsonResponse(
        {
            "message": "Print format updated successfully.",
            "print_format": _serialize_print_format(print_format),
        }
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def print_formats_delete(request, print_format_id: int):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    try:
        print_format = PrintFormat.objects.get(id=print_format_id)
    except PrintFormat.DoesNotExist:
        return JsonResponse({"error": "Print format not found."}, status=404)

    if print_format.is_default:
        return JsonResponse(
            {"error": "Default print formats cannot be deleted."}, status=400
        )

    print_format_name = print_format.name
    print_format_slug = print_format.slug
    print_format_document_type = print_format.document_type
    print_format.delete()

    UserLog.objects.create(
        user=request.user,
        action="Print Format Deleted",
        details=json.dumps(
            {
                "print_format_id": print_format_id,
                "document_type": print_format_document_type,
                "slug": print_format_slug,
                "name": print_format_name,
            },
            default=str,
        ),
    )

    return JsonResponse({"message": "Print format deleted successfully."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stock_entry_logs(request, stock_entry_id):
    queryset = UserLog.objects.select_related("user").filter(
        action__istartswith="Stock Entry"
    )
    logs = _filter_logs_for_entity(
        queryset.order_by("-timestamp")[:50], "stock_entry_id", stock_entry_id
    )

    return JsonResponse(
        [_serialize_user_log(log) for log in logs],
        safe=False,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stock_entries_list(request):
    page_size = int(request.GET.get("page_size", 10))
    page = int(request.GET.get("page", 1))
    posting_number = request.GET.get("posting_number", "").strip()
    invoice_number = request.GET.get("invoice_number", "").strip()
    supplier = request.GET.get("supplier", "").strip()
    status = request.GET.get("status", "").strip().lower()

    queryset = (
        StockEntry.objects.select_related("supplier", "received_by")
        .annotate(
            item_count=Count("items", distinct=True),
            total_quantity=Coalesce(Sum("items__quantity"), Value(0)),
        )
        .order_by("-created_at")
    )

    if posting_number:
        queryset = queryset.filter(posting_number__icontains=posting_number)
    if invoice_number:
        queryset = queryset.filter(invoice_number__icontains=invoice_number)
    if supplier:
        queryset = queryset.filter(supplier__name__icontains=supplier)
    if status:
        queryset = queryset.filter(status=status)

    paginator = Paginator(queryset, page_size)

    try:
        stock_entries_page = paginator.page(page)
    except EmptyPage:
        stock_entries_page = paginator.page(1)

    return JsonResponse(
        {
            "results": [_serialize_stock_entry(entry) for entry in stock_entries_page],
            "count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": stock_entries_page.number,
            "page_size": page_size,
            "has_next": stock_entries_page.has_next(),
            "has_previous": stock_entries_page.has_previous(),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stock_entry_detail(request, stock_entry_id: int):
    try:
        stock_entry = (
            StockEntry.objects.select_related(
                "supplier",
                "received_by",
                "purchase",
                "goods_receiving_note",
            )
            .prefetch_related("items__medicine", "items__batch")
            .get(id=stock_entry_id)
        )
    except StockEntry.DoesNotExist:
        return JsonResponse({"error": "Stock entry not found."}, status=404)

    return JsonResponse(_serialize_stock_entry(stock_entry, include_items=True))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stock_entry_detail_by_posting_number(request, posting_number: str):
    try:
        stock_entry = (
            StockEntry.objects.select_related(
                "supplier",
                "received_by",
                "purchase",
                "goods_receiving_note",
            )
            .prefetch_related("items__medicine", "items__batch")
            .get(posting_number=posting_number)
        )
    except StockEntry.DoesNotExist:
        return JsonResponse({"error": "Stock entry not found."}, status=404)

    return JsonResponse(_serialize_stock_entry(stock_entry, include_items=True))


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def stock_entry_update(request, stock_entry_id: int):
    try:
        stock_entry = StockEntry.objects.get(id=stock_entry_id)
    except StockEntry.DoesNotExist:
        return JsonResponse({"error": "Stock entry not found."}, status=404)

    previous_status = stock_entry.status

    if previous_status not in (
        StockEntry.STATUS_DRAFT,
        StockEntry.STATUS_CANCELLED,
    ):
        return JsonResponse(
            {"error": "Only draft or cancelled stock entries can be edited."},
            status=400,
        )

    try:
        normalized = _normalize_stock_entry_payload(request.data)
        with transaction.atomic():
            stock_entry.supplier = normalized["supplier"]
            stock_entry.invoice_number = normalized["invoice_number"]
            stock_entry.notes = normalized["notes"]
            stock_entry.tax = normalized["tax"]
            stock_entry.total_cost = normalized["total_cost"]
            stock_entry.grand_total = normalized["grand_total"]
            if previous_status == StockEntry.STATUS_CANCELLED:
                stock_entry.status = StockEntry.STATUS_DRAFT
            stock_entry.save()

            _replace_stock_entry_items(stock_entry, normalized["items"])

            UserLog.objects.create(
                user=request.user,
                action=(
                    "Stock Entry Amended"
                    if previous_status == StockEntry.STATUS_CANCELLED
                    else "Stock Entry Draft Updated"
                ),
                details=json.dumps(
                    {
                        "stock_entry_id": stock_entry.id,
                        "posting_number": stock_entry.posting_number,
                        "previous_status": previous_status,
                        "current_status": stock_entry.status,
                    },
                    default=str,
                ),
            )
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    stock_entry = StockEntry.objects.get(id=stock_entry.id)
    return JsonResponse(
        {
            "message": (
                "Stock entry amended and moved back to draft successfully."
                if previous_status == StockEntry.STATUS_CANCELLED
                else "Stock entry draft updated successfully."
            ),
            "stock_entry": _serialize_stock_entry(stock_entry, include_items=True),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stock_entry_submit(request, stock_entry_id: int):
    denied = _require_roles(request, {"admin", "manager", "pharmacist"})
    if denied:
        return denied
    try:
        with transaction.atomic():
            stock_entry = (
                StockEntry.objects.select_for_update()
                .select_related("supplier", "received_by")
                .prefetch_related("items__medicine", "items__batch")
                .get(id=stock_entry_id)
            )

            if stock_entry.status != StockEntry.STATUS_DRAFT:
                return JsonResponse(
                    {"error": "Only draft stock entries can be posted."},
                    status=400,
                )

            UserLog.objects.create(
                user=request.user,
                action="Stock Entry Posted",
                details=json.dumps(
                    {
                        "stock_entry_id": stock_entry.id,
                        "posting_number": stock_entry.posting_number,
                        "status": stock_entry.status,
                    },
                    default=str,
                ),
            )

            _post_stock_entry(stock_entry)
    except StockEntry.DoesNotExist:
        return JsonResponse({"error": "Stock entry not found."}, status=404)
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    stock_entry = (
        StockEntry.objects.select_related(
            "supplier",
            "received_by",
            "purchase",
            "goods_receiving_note",
        )
        .prefetch_related("items__medicine", "items__batch")
        .get(id=stock_entry_id)
    )

    return JsonResponse(
        {
            "message": "Stock entry submitted successfully.",
            "stock_entry": _serialize_stock_entry(stock_entry, include_items=True),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stock_entry_cancel(request, stock_entry_id: int):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied
    try:
        with transaction.atomic():
            stock_entry = (
                StockEntry.objects.select_for_update()
                .select_related("supplier", "received_by")
                .prefetch_related("items__medicine", "items__batch")
                .get(id=stock_entry_id)
            )

            if stock_entry.status != StockEntry.STATUS_POSTED:
                return JsonResponse(
                    {"error": "Only posted stock entries can be cancelled."},
                    status=400,
                )

            _reverse_posted_stock_entry(stock_entry)

            stock_entry.status = StockEntry.STATUS_CANCELLED
            stock_entry.save(update_fields=["status", "updated_at"])

            UserLog.objects.create(
                user=request.user,
                action="Stock Entry Cancelled",
                details=json.dumps(
                    {
                        "stock_entry_id": stock_entry.id,
                        "posting_number": stock_entry.posting_number,
                        "status": stock_entry.status,
                    },
                    default=str,
                ),
            )
    except StockEntry.DoesNotExist:
        return JsonResponse({"error": "Stock entry not found."}, status=404)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    stock_entry = (
        StockEntry.objects.select_related(
            "supplier",
            "received_by",
            "purchase",
            "goods_receiving_note",
        )
        .prefetch_related("items__medicine", "items__batch")
        .get(id=stock_entry_id)
    )

    return JsonResponse(
        {
            "message": "Stock entry cancelled successfully.",
            "stock_entry": _serialize_stock_entry(stock_entry, include_items=True),
        }
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def stock_entry_delete(request, stock_entry_id: int):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    try:
        stock_entry = StockEntry.objects.prefetch_related("items").get(
            id=stock_entry_id
        )
    except StockEntry.DoesNotExist:
        return JsonResponse({"error": "Stock entry not found."}, status=404)

    if stock_entry.status == StockEntry.STATUS_POSTED:
        return JsonResponse(
            {"error": "Cancel the document before deleting this stock entry."},
            status=400,
        )

    if stock_entry.status not in (
        StockEntry.STATUS_DRAFT,
        StockEntry.STATUS_CANCELLED,
    ):
        return JsonResponse(
            {"error": "Only draft or cancelled stock entries can be deleted."},
            status=400,
        )

    batch_ids = list(
        stock_entry.items.exclude(batch_id__isnull=True).values_list(
            "batch_id", flat=True
        )
    )
    if batch_ids:
        linked_sale_item = (
            SaleItem.objects.select_related("sale", "medicine", "batch")
            .filter(batch_id__in=batch_ids)
            .exclude(sale__status=Sale.STATUS_CANCELLED)
            .order_by("sale__created_at", "id")
            .first()
        )
        if linked_sale_item:
            return JsonResponse(
                {
                    "error": (
                        "Cannot delete stock entry because stock-out "
                        f"{linked_sale_item.sale.posting_number} still references batch "
                        f"{linked_sale_item.batch.batch_number} for {linked_sale_item.medicine.name}. "
                        "Cancel the stock-out document first."
                    )
                },
                status=400,
            )

    posting_number = stock_entry.posting_number
    status_value = stock_entry.status

    with transaction.atomic():
        stock_entry.delete()
        UserLog.objects.create(
            user=request.user,
            action="Stock Entry Deleted",
            details=json.dumps(
                {
                    "stock_entry_id": stock_entry_id,
                    "posting_number": posting_number,
                    "status": status_value,
                },
                default=str,
            ),
        )

    return JsonResponse({"message": "Stock entry deleted successfully."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stock_out_batches(request):
    medicine_id = request.GET.get("medicine_id")

    queryset = Batches.objects.filter(
        quantity__gt=0,
        expiry_date__gt=timezone.localdate(),
        product_id__is_active=True,
        product_id__status=Medicine.STATUS_SUBMITTED,
    ).select_related("product_id")

    if medicine_id:
        queryset = queryset.filter(product_id_id=medicine_id)

    batches = [
        {
            "batch_id": batch.batch_id,
            "inventory_batch_id": batch.batch_id,
            "batch_number": batch.batch_number,
            "inventory_batch_number": batch.batch_number,
            "medicine_id": batch.product_id_id,
            "medicine_name": batch.product_id.name,
            "quantity": batch.quantity,
            "expiry_date": batch.expiry_date.isoformat(),
            "received_at": batch.created_at.isoformat(),
        }
        for batch in queryset.order_by(
            "product_id__name",
            "created_at",
            "manufacturing_date",
            "expiry_date",
            "batch_number",
        )
    ]

    return JsonResponse({"items": batches})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stock_out_list(request):
    page_size = int(request.GET.get("page_size", 10))
    page = int(request.GET.get("page", 1))
    posting_number = request.GET.get("posting_number", "").strip()
    invoice_number = request.GET.get("invoice_number", "").strip()
    customer_name = request.GET.get("customer_name", "").strip()
    status = request.GET.get("status", "").strip().lower()

    queryset = Sale.objects.select_related("cashier").prefetch_related(
        "items__medicine", "items__batch"
    )

    if posting_number:
        queryset = queryset.filter(posting_number__icontains=posting_number)
    if invoice_number:
        queryset = queryset.filter(invoice_number__icontains=invoice_number)
    if customer_name:
        queryset = queryset.filter(customer_name__icontains=customer_name)
    if status:
        queryset = queryset.filter(status=status)

    queryset = queryset.annotate(
        total_quantity=Coalesce(Sum("items__quantity"), Value(0))
    ).order_by("-created_at")

    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page)

    return JsonResponse(
        {
            "count": paginator.count,
            "num_pages": paginator.num_pages,
            "current_page": page_obj.number,
            "results": [_serialize_sale(sale) for sale in page_obj.object_list],
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stock_out_detail(request, sale_id: int):
    try:
        sale = (
            Sale.objects.select_related("cashier")
            .prefetch_related("items__medicine", "items__batch")
            .get(id=sale_id)
        )
    except Sale.DoesNotExist:
        return JsonResponse({"error": "Stock-out document not found."}, status=404)

    return JsonResponse(_serialize_sale(sale, include_items=True))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stock_out_detail_by_posting_number(request, posting_number: str):
    try:
        sale = (
            Sale.objects.select_related("cashier")
            .prefetch_related("items__medicine", "items__batch")
            .get(posting_number=posting_number)
        )
    except Sale.DoesNotExist:
        return JsonResponse({"error": "Stock-out document not found."}, status=404)

    return JsonResponse(_serialize_sale(sale, include_items=True))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stock_out_logs(request, sale_id: int):
    try:
        sale = Sale.objects.get(id=sale_id)
    except Sale.DoesNotExist:
        return JsonResponse({"error": "Stock-out document not found."}, status=404)

    logs = _filter_logs_for_entity(
        UserLog.objects.select_related("user").order_by("-timestamp"),
        "sale_id",
        sale.id,
    )
    return JsonResponse([_serialize_user_log(log) for log in logs], safe=False)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stock_out_create(request):
    try:
        normalized = _normalize_sale_payload(request.data)
        with transaction.atomic():
            sale = Sale.objects.create(
                customer_name=normalized["customer_name"],
                invoice_number=normalized["invoice_number"],
                payment_method=normalized["payment_method"],
                status=Sale.STATUS_DRAFT,
                total_amount=normalized["total_amount"],
                notes=normalized["notes"],
                cashier=request.user,
            )

            _replace_sale_items(sale, normalized["items"])

            UserLog.objects.create(
                user=request.user,
                action="Stock Out Draft Created",
                details=json.dumps(
                    {
                        "sale_id": sale.id,
                        "posting_number": sale.posting_number,
                        "invoice_number": sale.invoice_number,
                        "customer_name": sale.customer_name,
                    },
                    default=str,
                ),
            )
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    sale = Sale.objects.select_related("cashier").get(id=sale.id)
    return JsonResponse(
        {
            "message": "Stock-out draft created successfully.",
            "sale": _serialize_sale(sale, include_items=True),
        }
    )


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def stock_out_update(request, sale_id: int):
    try:
        sale = Sale.objects.get(id=sale_id)
    except Sale.DoesNotExist:
        return JsonResponse({"error": "Stock-out document not found."}, status=404)

    previous_status = sale.status
    if previous_status not in (Sale.STATUS_DRAFT, Sale.STATUS_CANCELLED):
        return JsonResponse(
            {"error": "Only draft or cancelled stock-out documents can be edited."},
            status=400,
        )

    try:
        normalized = _normalize_sale_payload(request.data)
        with transaction.atomic():
            sale.customer_name = normalized["customer_name"]
            if normalized["invoice_number"]:
                sale.invoice_number = normalized["invoice_number"]
            sale.payment_method = normalized["payment_method"]
            sale.total_amount = normalized["total_amount"]
            sale.notes = normalized["notes"]
            if previous_status == Sale.STATUS_CANCELLED:
                sale.status = Sale.STATUS_DRAFT
            sale.save()

            _replace_sale_items(sale, normalized["items"])

            UserLog.objects.create(
                user=request.user,
                action=(
                    "Stock Out Amended"
                    if previous_status == Sale.STATUS_CANCELLED
                    else "Stock Out Draft Updated"
                ),
                details=json.dumps(
                    {
                        "sale_id": sale.id,
                        "posting_number": sale.posting_number,
                        "previous_status": previous_status,
                        "current_status": sale.status,
                    },
                    default=str,
                ),
            )
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    sale = Sale.objects.select_related("cashier").get(id=sale.id)
    return JsonResponse(
        {
            "message": (
                "Stock-out amended and moved back to draft successfully."
                if previous_status == Sale.STATUS_CANCELLED
                else "Stock-out draft updated successfully."
            ),
            "sale": _serialize_sale(sale, include_items=True),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stock_out_submit(request, sale_id: int):
    denied = _require_roles(request, {"admin", "manager", "cashier"})
    if denied:
        return denied
    try:
        with transaction.atomic():
            sale = (
                Sale.objects.select_for_update()
                .select_related("cashier")
                .prefetch_related("items__medicine", "items__batch")
                .get(id=sale_id)
            )
            _post_sale(sale)
    except Sale.DoesNotExist:
        return JsonResponse({"error": "Stock-out document not found."}, status=404)
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    sale = (
        Sale.objects.select_related("cashier")
        .prefetch_related("items__medicine", "items__batch")
        .get(id=sale_id)
    )
    return JsonResponse(
        {
            "message": "Stock-out submitted successfully.",
            "sale": _serialize_sale(sale, include_items=True),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stock_out_cancel(request, sale_id: int):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied
    try:
        with transaction.atomic():
            sale = (
                Sale.objects.select_for_update()
                .select_related("cashier")
                .prefetch_related("items__medicine", "items__batch")
                .get(id=sale_id)
            )
            _reverse_posted_sale(sale)
            sale.status = Sale.STATUS_CANCELLED
            sale.save(update_fields=["status", "updated_at"])
    except Sale.DoesNotExist:
        return JsonResponse({"error": "Stock-out document not found."}, status=404)
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    sale = (
        Sale.objects.select_related("cashier")
        .prefetch_related("items__medicine", "items__batch")
        .get(id=sale_id)
    )
    return JsonResponse(
        {
            "message": "Stock-out cancelled successfully.",
            "sale": _serialize_sale(sale, include_items=True),
        }
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def stock_out_delete(request, sale_id: int):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    try:
        sale = Sale.objects.prefetch_related("items").get(id=sale_id)
    except Sale.DoesNotExist:
        return JsonResponse({"error": "Stock-out document not found."}, status=404)

    if sale.status == Sale.STATUS_POSTED:
        return JsonResponse(
            {"error": "Cancel the document before deleting this stock-out."},
            status=400,
        )

    if sale.status not in (Sale.STATUS_DRAFT, Sale.STATUS_CANCELLED):
        return JsonResponse(
            {"error": "Only draft or cancelled stock-out documents can be deleted."},
            status=400,
        )

    posting_number = sale.posting_number
    invoice_number = sale.invoice_number
    status_value = sale.status

    with transaction.atomic():
        sale.delete()
        UserLog.objects.create(
            user=request.user,
            action="Stock Out Deleted",
            details=json.dumps(
                {
                    "sale_id": sale_id,
                    "posting_number": posting_number,
                    "invoice_number": invoice_number,
                    "status": status_value,
                },
                default=str,
            ),
        )

    return JsonResponse({"message": "Stock-out deleted successfully."})


def _serialize_stock_adjustment(adjustment: StockAdjustment, include_items=False):
    payload = {
        "id": adjustment.id,
        "posting_number": adjustment.posting_number,
        "reason": adjustment.reason,
        "reason_label": adjustment.get_reason_display(),
        "status": adjustment.get_status_display(),
        "status_key": adjustment.status,
        "created_by_id": adjustment.created_by_id,
        "created_by": getattr(adjustment.created_by, "email", ""),
        "notes": adjustment.notes,
        "created_at": adjustment.created_at.isoformat(),
        "updated_at": adjustment.updated_at.isoformat(),
    }
    if include_items:
        payload["items"] = [
            {
                "id": item.id,
                "medicine_id": item.medicine_id,
                "medicine_name": item.medicine.name if item.medicine else "",
                "batch_id": item.batch_id,
                "batch_number": item.batch.batch_number if item.batch else "",
                "quantity_change": item.quantity_change,
                "unit_cost": str(item.unit_cost),
                "notes": item.notes,
            }
            for item in adjustment.items.select_related("medicine", "batch").all()
        ]
    return payload


def _normalize_stock_adjustment_payload(payload):
    reason = (payload.get("reason") or StockAdjustment.REASON_COUNT).strip()
    notes = (payload.get("notes") or "").strip()
    items = payload.get("items") or []

    valid_reasons = {choice[0] for choice in StockAdjustment.REASON_CHOICES}
    if reason not in valid_reasons:
        raise ValueError("Adjustment reason is invalid.")
    if not isinstance(items, list) or not items:
        raise ValueError("At least one adjustment item is required.")

    normalized_items = []
    for index, item in enumerate(items, start=1):
        prefix = f"Item #{index}"
        medicine_id = item.get("medicine_id")
        batch_id = item.get("batch_id")
        quantity_change = item.get("quantity_change")
        unit_cost = item.get("unit_cost", "0")
        line_notes = (item.get("notes") or "").strip()

        if not medicine_id:
            raise ValueError(f"{prefix}: medicine is required.")
        if not batch_id:
            raise ValueError(f"{prefix}: batch is required.")

        medicine = _get_fetchable_medicine(medicine_id, prefix)
        try:
            batch = Batches.objects.get(
                pk=batch_id,
                product_id=medicine,
                product_id__is_active=True,
                product_id__status=Medicine.STATUS_SUBMITTED,
            )
        except Batches.DoesNotExist as exc:
            raise ValueError(f"{prefix}: batch not found for this medicine.") from exc

        try:
            quantity_change = int(quantity_change)
        except (TypeError, ValueError) as exc:
            raise ValueError(
                f"{prefix}: quantity_change must be a valid integer."
            ) from exc
        if quantity_change == 0:
            raise ValueError(f"{prefix}: quantity_change cannot be zero.")

        try:
            unit_cost = Decimal(str(unit_cost or "0"))
        except (InvalidOperation, TypeError, ValueError) as exc:
            raise ValueError(f"{prefix}: unit_cost must be a valid number.") from exc
        if unit_cost < 0:
            raise ValueError(f"{prefix}: unit_cost cannot be negative.")

        normalized_items.append(
            {
                "medicine": medicine,
                "batch": batch,
                "quantity_change": quantity_change,
                "unit_cost": unit_cost,
                "notes": line_notes,
            }
        )

    return {"reason": reason, "notes": notes, "items": normalized_items}


def _post_stock_adjustment(adjustment: StockAdjustment):
    if adjustment.status != StockAdjustment.STATUS_DRAFT:
        raise ValueError("Only draft adjustments can be submitted.")

    items = list(adjustment.items.select_related("medicine", "batch").all())
    if not items:
        raise ValueError("Draft adjustment does not contain any items.")

    batch_ids = sorted({item.batch_id for item in items if item.batch_id})
    locked_batches = {
        batch.batch_id: batch
        for batch in Batches.objects.select_for_update().filter(pk__in=batch_ids)
    }
    if len(locked_batches) != len(batch_ids):
        raise ValueError("One or more batches are no longer available.")

    inventory_keys = sorted(
        {
            (item.medicine_id, locked_batches[item.batch_id].batch_number)
            for item in items
        }
    )
    locked_inventory = {}
    for medicine_id, batch_number in inventory_keys:
        inventory_row = (
            Inventory.objects.select_for_update()
            .filter(medicine_id=medicine_id, batch_number=batch_number)
            .first()
        )
        if inventory_row:
            locked_inventory[(medicine_id, batch_number)] = inventory_row

    ledger_type = (
        StockLedger.TRANSACTION_DAMAGE
        if adjustment.reason == StockAdjustment.REASON_DAMAGE
        else StockLedger.TRANSACTION_ADJUSTMENT
    )

    for item in items:
        batch = locked_batches[item.batch_id]
        inventory_row = locked_inventory.get((item.medicine_id, batch.batch_number))

        next_batch_qty = batch.quantity + item.quantity_change
        if next_batch_qty < 0:
            raise ValueError(
                f"Batch {batch.batch_number} does not have enough quantity for this adjustment."
            )
        batch.quantity = next_batch_qty
        batch.save(update_fields=["quantity"])

        if inventory_row:
            next_inv_qty = inventory_row.quantity + item.quantity_change
            if next_inv_qty < 0:
                raise ValueError(
                    f"Inventory batch {batch.batch_number} does not have enough quantity."
                )
            inventory_row.quantity = next_inv_qty
            if inventory_row.quantity == 0:
                inventory_row.delete()
            else:
                inventory_row.save(update_fields=["quantity", "updated_at"])
        else:
            if item.quantity_change < 0:
                raise ValueError(
                    f"Inventory record is missing for batch {batch.batch_number}."
                )
            Inventory.objects.create(
                medicine=item.medicine,
                batch_number=batch.batch_number,
                quantity=item.quantity_change,
                expiry_date=batch.expiry_date,
                location="Main Store",
            )

        StockLedger.objects.create(
            medicine=item.medicine,
            batch=batch,
            transaction_type=ledger_type,
            quantity=item.quantity_change,
            unit_price=item.unit_cost,
            reference_document=adjustment.posting_number,
            notes=item.notes or f"Stock adjustment {adjustment.posting_number}",
        )

    adjustment.status = StockAdjustment.STATUS_POSTED
    adjustment.save(update_fields=["status", "updated_at"])


def _reverse_posted_stock_adjustment(adjustment: StockAdjustment):
    if adjustment.status != StockAdjustment.STATUS_POSTED:
        raise ValueError("Only posted adjustments can be cancelled.")

    items = list(adjustment.items.select_related("medicine", "batch").all())
    if not items:
        raise ValueError("Posted adjustment does not contain any items.")

    batch_ids = sorted({item.batch_id for item in items if item.batch_id})
    locked_batches = {
        batch.batch_id: batch
        for batch in Batches.objects.select_for_update().filter(pk__in=batch_ids)
    }
    if len(locked_batches) != len(batch_ids):
        raise ValueError("One or more batches are no longer available.")

    inventory_keys = sorted(
        {
            (item.medicine_id, locked_batches[item.batch_id].batch_number)
            for item in items
        }
    )
    locked_inventory = {}
    for medicine_id, batch_number in inventory_keys:
        inventory_row = (
            Inventory.objects.select_for_update()
            .filter(medicine_id=medicine_id, batch_number=batch_number)
            .first()
        )
        if inventory_row:
            locked_inventory[(medicine_id, batch_number)] = inventory_row

    ledger_type = (
        StockLedger.TRANSACTION_DAMAGE
        if adjustment.reason == StockAdjustment.REASON_DAMAGE
        else StockLedger.TRANSACTION_ADJUSTMENT
    )

    for item in items:
        batch = locked_batches[item.batch_id]
        reverse_change = -item.quantity_change
        next_batch_qty = batch.quantity + reverse_change
        if next_batch_qty < 0:
            raise ValueError(
                f"Cannot cancel adjustment because batch {batch.batch_number} would go negative."
            )
        batch.quantity = next_batch_qty
        batch.save(update_fields=["quantity"])

        inventory_row = locked_inventory.get((item.medicine_id, batch.batch_number))
        if inventory_row:
            next_inv_qty = inventory_row.quantity + reverse_change
            if next_inv_qty < 0:
                raise ValueError(
                    f"Cannot cancel adjustment because inventory batch {batch.batch_number} would go negative."
                )
            inventory_row.quantity = next_inv_qty
            if inventory_row.quantity == 0:
                inventory_row.delete()
            else:
                inventory_row.save(update_fields=["quantity", "updated_at"])
        else:
            if reverse_change < 0:
                raise ValueError(
                    f"Inventory record is missing for batch {batch.batch_number}."
                )
            Inventory.objects.create(
                medicine=item.medicine,
                batch_number=batch.batch_number,
                quantity=reverse_change,
                expiry_date=batch.expiry_date,
                location="Main Store",
            )

        StockLedger.objects.create(
            medicine=item.medicine,
            batch=batch,
            transaction_type=ledger_type,
            quantity=reverse_change,
            unit_price=item.unit_cost,
            reference_document=adjustment.posting_number,
            notes=f"Adjustment reversal {adjustment.posting_number}",
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stock_adjustments_list(request):
    page_size = int(request.GET.get("page_size", 10))
    page = int(request.GET.get("page", 1))
    posting_number = _compact_text(request.GET.get("posting_number", ""))
    status = _compact_text(request.GET.get("status", "")).lower()
    reason = _compact_text(request.GET.get("reason", "")).lower()

    queryset = StockAdjustment.objects.select_related("created_by").order_by(
        "-created_at"
    )
    if posting_number:
        queryset = queryset.filter(posting_number__icontains=posting_number)
    if status:
        queryset = queryset.filter(status=status)
    if reason:
        queryset = queryset.filter(reason=reason)

    paginator = Paginator(queryset, page_size)
    try:
        page_obj = paginator.page(page)
    except EmptyPage:
        page_obj = paginator.page(1)

    return JsonResponse(
        {
            "results": [
                _serialize_stock_adjustment(adj) for adj in page_obj.object_list
            ],
            "count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": page_obj.number,
            "page_size": page_size,
            "has_next": page_obj.has_next(),
            "has_previous": page_obj.has_previous(),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stock_adjustment_detail(request, adjustment_id: int):
    try:
        adjustment = (
            StockAdjustment.objects.select_related("created_by")
            .prefetch_related("items__medicine", "items__batch")
            .get(id=adjustment_id)
        )
    except StockAdjustment.DoesNotExist:
        return JsonResponse({"error": "Stock adjustment not found."}, status=404)
    return JsonResponse(_serialize_stock_adjustment(adjustment, include_items=True))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stock_adjustment_create(request):
    try:
        normalized = _normalize_stock_adjustment_payload(request.data)
        with transaction.atomic():
            adjustment = StockAdjustment.objects.create(
                reason=normalized["reason"],
                status=StockAdjustment.STATUS_DRAFT,
                notes=normalized["notes"],
                created_by=request.user,
            )
            for item in normalized["items"]:
                StockAdjustmentItem.objects.create(
                    stock_adjustment=adjustment,
                    medicine=item["medicine"],
                    batch=item["batch"],
                    quantity_change=item["quantity_change"],
                    unit_cost=item["unit_cost"],
                    notes=item["notes"],
                )
            UserLog.objects.create(
                user=request.user,
                action="Stock Adjustment Draft Created",
                details=json.dumps(
                    {
                        "stock_adjustment_id": adjustment.id,
                        "posting_number": adjustment.posting_number,
                    },
                    default=str,
                ),
            )
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    adjustment = StockAdjustment.objects.select_related("created_by").get(
        id=adjustment.id
    )
    return JsonResponse(
        {
            "message": "Stock adjustment draft created.",
            "adjustment": _serialize_stock_adjustment(adjustment, include_items=True),
        },
        status=201,
    )


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def stock_adjustment_update(request, adjustment_id: int):
    try:
        adjustment = StockAdjustment.objects.get(id=adjustment_id)
    except StockAdjustment.DoesNotExist:
        return JsonResponse({"error": "Stock adjustment not found."}, status=404)

    previous_status = adjustment.status
    if previous_status not in (
        StockAdjustment.STATUS_DRAFT,
        StockAdjustment.STATUS_CANCELLED,
    ):
        return JsonResponse(
            {"error": "Only draft or cancelled stock adjustments can be edited."},
            status=400,
        )

    try:
        normalized = _normalize_stock_adjustment_payload(request.data)
        with transaction.atomic():
            adjustment.reason = normalized["reason"]
            adjustment.notes = normalized["notes"]
            if previous_status == StockAdjustment.STATUS_CANCELLED:
                adjustment.status = StockAdjustment.STATUS_DRAFT
            adjustment.save(update_fields=["reason", "notes", "status", "updated_at"])

            adjustment.items.all().delete()
            for item in normalized["items"]:
                StockAdjustmentItem.objects.create(
                    stock_adjustment=adjustment,
                    medicine=item["medicine"],
                    batch=item["batch"],
                    quantity_change=item["quantity_change"],
                    unit_cost=item["unit_cost"],
                    notes=item["notes"],
                )

            UserLog.objects.create(
                user=request.user,
                action=(
                    "Stock Adjustment Amended"
                    if previous_status == StockAdjustment.STATUS_CANCELLED
                    else "Stock Adjustment Draft Updated"
                ),
                details=json.dumps(
                    {
                        "stock_adjustment_id": adjustment.id,
                        "posting_number": adjustment.posting_number,
                        "previous_status": previous_status,
                        "current_status": adjustment.status,
                    },
                    default=str,
                ),
            )
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    adjustment = (
        StockAdjustment.objects.select_related("created_by")
        .prefetch_related("items__medicine", "items__batch")
        .get(id=adjustment.id)
    )
    return JsonResponse(
        {
            "message": (
                "Stock adjustment amended and moved back to draft successfully."
                if previous_status == StockAdjustment.STATUS_CANCELLED
                else "Stock adjustment draft updated successfully."
            ),
            "adjustment": _serialize_stock_adjustment(adjustment, include_items=True),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stock_adjustment_submit(request, adjustment_id: int):
    denied = _require_roles(request, {"admin", "manager", "pharmacist"})
    if denied:
        return denied
    try:
        with transaction.atomic():
            adjustment = StockAdjustment.objects.select_for_update().get(
                id=adjustment_id
            )
            _post_stock_adjustment(adjustment)
            UserLog.objects.create(
                user=request.user,
                action="Stock Adjustment Submitted",
                details=json.dumps(
                    {
                        "stock_adjustment_id": adjustment.id,
                        "posting_number": adjustment.posting_number,
                    },
                    default=str,
                ),
            )
    except StockAdjustment.DoesNotExist:
        return JsonResponse({"error": "Stock adjustment not found."}, status=404)
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    adjustment = (
        StockAdjustment.objects.select_related("created_by")
        .prefetch_related("items__medicine", "items__batch")
        .get(id=adjustment_id)
    )
    return JsonResponse(
        {
            "message": "Stock adjustment submitted successfully.",
            "adjustment": _serialize_stock_adjustment(adjustment, include_items=True),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stock_adjustment_cancel(request, adjustment_id: int):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied
    try:
        with transaction.atomic():
            adjustment = StockAdjustment.objects.select_for_update().get(
                id=adjustment_id
            )
            _reverse_posted_stock_adjustment(adjustment)
            adjustment.status = StockAdjustment.STATUS_CANCELLED
            adjustment.save(update_fields=["status", "updated_at"])
            UserLog.objects.create(
                user=request.user,
                action="Stock Adjustment Cancelled",
                details=json.dumps(
                    {
                        "stock_adjustment_id": adjustment.id,
                        "posting_number": adjustment.posting_number,
                    },
                    default=str,
                ),
            )
    except StockAdjustment.DoesNotExist:
        return JsonResponse({"error": "Stock adjustment not found."}, status=404)
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    adjustment = (
        StockAdjustment.objects.select_related("created_by")
        .prefetch_related("items__medicine", "items__batch")
        .get(id=adjustment_id)
    )
    return JsonResponse(
        {
            "message": "Stock adjustment cancelled successfully.",
            "adjustment": _serialize_stock_adjustment(adjustment, include_items=True),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stock_adjustment_logs(request, adjustment_id: int):
    logs = _filter_logs_for_entity(
        UserLog.objects.select_related("user").order_by("-timestamp"),
        "stock_adjustment_id",
        adjustment_id,
    )
    return JsonResponse([_serialize_user_log(log) for log in logs], safe=False)


def _serialize_sales_return(doc: SalesReturn, include_items=False):
    payload = {
        "id": doc.id,
        "posting_number": doc.posting_number,
        "reference_invoice": doc.reference_invoice,
        "customer_name": doc.customer_name,
        "status": doc.get_status_display(),
        "status_key": doc.status,
        "created_by_id": doc.created_by_id,
        "created_by": getattr(doc.created_by, "email", ""),
        "notes": doc.notes,
        "created_at": doc.created_at.isoformat(),
        "updated_at": doc.updated_at.isoformat(),
    }
    if include_items:
        payload["items"] = [
            {
                "id": item.id,
                "medicine_id": item.medicine_id,
                "medicine_name": item.medicine.name if item.medicine else "",
                "batch_id": item.batch_id,
                "batch_number": item.batch.batch_number if item.batch else "",
                "quantity": item.quantity,
                "unit_price": str(item.unit_price),
                "notes": item.notes,
            }
            for item in doc.items.select_related("medicine", "batch").all()
        ]
    return payload


def _normalize_sales_return_payload(payload):
    reference_invoice = (payload.get("reference_invoice") or "").strip()
    customer_name = (payload.get("customer_name") or "").strip()
    notes = (payload.get("notes") or "").strip()
    items = payload.get("items") or []

    if not isinstance(items, list) or not items:
        raise ValueError("At least one sales return item is required.")

    today = timezone.localdate()
    normalized_items = []
    for index, item in enumerate(items, start=1):
        prefix = f"Item #{index}"
        medicine_id = item.get("medicine_id")
        batch_id = item.get("batch_id")
        if not medicine_id:
            raise ValueError(f"{prefix}: medicine is required.")
        if not batch_id:
            raise ValueError(f"{prefix}: batch is required.")

        medicine = _get_fetchable_medicine(medicine_id, prefix)
        try:
            batch = Batches.objects.get(
                pk=batch_id,
                product_id=medicine,
                product_id__is_active=True,
                product_id__status=Medicine.STATUS_SUBMITTED,
            )
        except Batches.DoesNotExist as exc:
            raise ValueError(f"{prefix}: batch not found for this medicine.") from exc
        if batch.expiry_date <= today:
            raise ValueError(f"{prefix}: cannot restock an expired batch.")

        quantity = _parse_positive_int(item.get("quantity"), f"{prefix} quantity")
        unit_price = _parse_decimal(
            item.get("unit_price") or medicine.selling_price, f"{prefix} unit price"
        )
        normalized_items.append(
            {
                "medicine": medicine,
                "batch": batch,
                "quantity": quantity,
                "unit_price": unit_price,
                "notes": (item.get("notes") or "").strip(),
            }
        )

    return {
        "reference_invoice": reference_invoice,
        "customer_name": customer_name,
        "notes": notes,
        "items": normalized_items,
    }


def _post_sales_return(doc: SalesReturn):
    if doc.status != SalesReturn.STATUS_DRAFT:
        raise ValueError("Only draft sales returns can be submitted.")
    items = list(doc.items.select_related("medicine", "batch").all())
    if not items:
        raise ValueError("Draft sales return does not contain any items.")

    batch_ids = sorted({item.batch_id for item in items if item.batch_id})
    locked_batches = {
        batch.batch_id: batch
        for batch in Batches.objects.select_for_update().filter(pk__in=batch_ids)
    }
    if len(locked_batches) != len(batch_ids):
        raise ValueError("One or more batches are no longer available.")

    inventory_keys = sorted(
        {
            (item.medicine_id, locked_batches[item.batch_id].batch_number)
            for item in items
        }
    )
    locked_inventory = {}
    for medicine_id, batch_number in inventory_keys:
        inventory_row = (
            Inventory.objects.select_for_update()
            .filter(medicine_id=medicine_id, batch_number=batch_number)
            .first()
        )
        if inventory_row:
            locked_inventory[(medicine_id, batch_number)] = inventory_row

    for item in items:
        batch = locked_batches[item.batch_id]
        batch.quantity += item.quantity
        batch.save(update_fields=["quantity"])

        inventory_row = locked_inventory.get((item.medicine_id, batch.batch_number))
        if not inventory_row:
            inventory_row = Inventory.objects.create(
                medicine=item.medicine,
                batch_number=batch.batch_number,
                quantity=item.quantity,
                expiry_date=batch.expiry_date,
                location="Main Store",
            )
        else:
            inventory_row.quantity += item.quantity
            inventory_row.expiry_date = batch.expiry_date
            inventory_row.save(update_fields=["quantity", "expiry_date", "updated_at"])

        StockLedger.objects.create(
            medicine=item.medicine,
            batch=batch,
            transaction_type=StockLedger.TRANSACTION_RETURN,
            quantity=item.quantity,
            unit_price=item.unit_price,
            reference_document=doc.reference_invoice or doc.posting_number,
            notes=item.notes or f"Customer return {doc.posting_number}",
        )

    doc.status = SalesReturn.STATUS_POSTED
    doc.save(update_fields=["status", "updated_at"])


def _reverse_posted_sales_return(doc: SalesReturn):
    if doc.status != SalesReturn.STATUS_POSTED:
        raise ValueError("Only posted sales returns can be cancelled.")
    items = list(doc.items.select_related("medicine", "batch").all())
    if not items:
        raise ValueError("Posted sales return does not contain any items.")

    batch_ids = sorted({item.batch_id for item in items if item.batch_id})
    locked_batches = {
        batch.batch_id: batch
        for batch in Batches.objects.select_for_update().filter(pk__in=batch_ids)
    }
    if len(locked_batches) != len(batch_ids):
        raise ValueError("One or more batches are no longer available.")

    for item in items:
        batch = locked_batches[item.batch_id]
        if batch.quantity < item.quantity:
            raise ValueError(
                f"Cannot cancel sales return because batch {batch.batch_number} does not have enough quantity."
            )
        batch.quantity -= item.quantity
        batch.save(update_fields=["quantity"])

        inventory_row = (
            Inventory.objects.select_for_update()
            .filter(medicine=item.medicine, batch_number=batch.batch_number)
            .first()
        )
        if not inventory_row or inventory_row.quantity < item.quantity:
            raise ValueError(
                f"Cannot cancel sales return because inventory batch {batch.batch_number} is below the return quantity."
            )
        inventory_row.quantity -= item.quantity
        if inventory_row.quantity == 0:
            inventory_row.delete()
        else:
            inventory_row.save(update_fields=["quantity", "updated_at"])

        StockLedger.objects.create(
            medicine=item.medicine,
            batch=batch,
            transaction_type=StockLedger.TRANSACTION_RETURN,
            quantity=-item.quantity,
            unit_price=item.unit_price,
            reference_document=doc.reference_invoice or doc.posting_number,
            notes=f"Customer return reversal {doc.posting_number}",
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sales_returns_list(request):
    page_size = int(request.GET.get("page_size", 10))
    page = int(request.GET.get("page", 1))
    posting_number = _compact_text(request.GET.get("posting_number", ""))
    reference_invoice = _compact_text(request.GET.get("reference_invoice", ""))
    status = _compact_text(request.GET.get("status", "")).lower()

    queryset = SalesReturn.objects.select_related("created_by").order_by("-created_at")
    if posting_number:
        queryset = queryset.filter(posting_number__icontains=posting_number)
    if reference_invoice:
        queryset = queryset.filter(reference_invoice__icontains=reference_invoice)
    if status:
        queryset = queryset.filter(status=status)

    paginator = Paginator(queryset, page_size)
    try:
        page_obj = paginator.page(page)
    except EmptyPage:
        page_obj = paginator.page(1)

    return JsonResponse(
        {
            "results": [_serialize_sales_return(doc) for doc in page_obj.object_list],
            "count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": page_obj.number,
            "page_size": page_size,
            "has_next": page_obj.has_next(),
            "has_previous": page_obj.has_previous(),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sales_return_detail(request, return_id: int):
    try:
        doc = (
            SalesReturn.objects.select_related("created_by")
            .prefetch_related("items__medicine", "items__batch")
            .get(id=return_id)
        )
    except SalesReturn.DoesNotExist:
        return JsonResponse({"error": "Sales return not found."}, status=404)
    return JsonResponse(_serialize_sales_return(doc, include_items=True))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def sales_return_create(request):
    try:
        normalized = _normalize_sales_return_payload(request.data)
        with transaction.atomic():
            doc = SalesReturn.objects.create(
                reference_invoice=normalized["reference_invoice"],
                customer_name=normalized["customer_name"],
                status=SalesReturn.STATUS_DRAFT,
                notes=normalized["notes"],
                created_by=request.user,
            )
            for item in normalized["items"]:
                SalesReturnItem.objects.create(
                    sales_return=doc,
                    medicine=item["medicine"],
                    batch=item["batch"],
                    quantity=item["quantity"],
                    unit_price=item["unit_price"],
                    notes=item["notes"],
                )
            UserLog.objects.create(
                user=request.user,
                action="Sales Return Draft Created",
                details=json.dumps(
                    {"sales_return_id": doc.id, "posting_number": doc.posting_number},
                    default=str,
                ),
            )
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    doc = SalesReturn.objects.select_related("created_by").get(id=doc.id)
    return JsonResponse(
        {
            "message": "Sales return draft created.",
            "sales_return": _serialize_sales_return(doc, include_items=True),
        },
        status=201,
    )


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def sales_return_update(request, return_id: int):
    try:
        doc = SalesReturn.objects.get(id=return_id)
    except SalesReturn.DoesNotExist:
        return JsonResponse({"error": "Sales return not found."}, status=404)

    previous_status = doc.status
    if previous_status not in (SalesReturn.STATUS_DRAFT, SalesReturn.STATUS_CANCELLED):
        return JsonResponse(
            {"error": "Only draft or cancelled sales returns can be edited."},
            status=400,
        )

    try:
        normalized = _normalize_sales_return_payload(request.data)
        with transaction.atomic():
            doc.reference_invoice = normalized["reference_invoice"]
            doc.customer_name = normalized["customer_name"]
            doc.notes = normalized["notes"]
            if previous_status == SalesReturn.STATUS_CANCELLED:
                doc.status = SalesReturn.STATUS_DRAFT
            doc.save(
                update_fields=[
                    "reference_invoice",
                    "customer_name",
                    "notes",
                    "status",
                    "updated_at",
                ]
            )

            doc.items.all().delete()
            for item in normalized["items"]:
                SalesReturnItem.objects.create(
                    sales_return=doc,
                    medicine=item["medicine"],
                    batch=item["batch"],
                    quantity=item["quantity"],
                    unit_price=item["unit_price"],
                    notes=item["notes"],
                )

            UserLog.objects.create(
                user=request.user,
                action=(
                    "Sales Return Amended"
                    if previous_status == SalesReturn.STATUS_CANCELLED
                    else "Sales Return Draft Updated"
                ),
                details=json.dumps(
                    {
                        "sales_return_id": doc.id,
                        "posting_number": doc.posting_number,
                        "previous_status": previous_status,
                        "current_status": doc.status,
                    },
                    default=str,
                ),
            )
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    doc = (
        SalesReturn.objects.select_related("created_by")
        .prefetch_related("items__medicine", "items__batch")
        .get(id=doc.id)
    )
    return JsonResponse(
        {
            "message": (
                "Sales return amended and moved back to draft successfully."
                if previous_status == SalesReturn.STATUS_CANCELLED
                else "Sales return draft updated successfully."
            ),
            "sales_return": _serialize_sales_return(doc, include_items=True),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def sales_return_submit(request, return_id: int):
    denied = _require_roles(request, {"admin", "manager", "pharmacist"})
    if denied:
        return denied
    try:
        with transaction.atomic():
            doc = SalesReturn.objects.select_for_update().get(id=return_id)
            _post_sales_return(doc)
            UserLog.objects.create(
                user=request.user,
                action="Sales Return Submitted",
                details=json.dumps(
                    {"sales_return_id": doc.id, "posting_number": doc.posting_number},
                    default=str,
                ),
            )
    except SalesReturn.DoesNotExist:
        return JsonResponse({"error": "Sales return not found."}, status=404)
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    doc = (
        SalesReturn.objects.select_related("created_by")
        .prefetch_related("items__medicine", "items__batch")
        .get(id=return_id)
    )
    return JsonResponse(
        {
            "message": "Sales return submitted successfully.",
            "sales_return": _serialize_sales_return(doc, include_items=True),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def sales_return_cancel(request, return_id: int):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied
    try:
        with transaction.atomic():
            doc = SalesReturn.objects.select_for_update().get(id=return_id)
            _reverse_posted_sales_return(doc)
            doc.status = SalesReturn.STATUS_CANCELLED
            doc.save(update_fields=["status", "updated_at"])
            UserLog.objects.create(
                user=request.user,
                action="Sales Return Cancelled",
                details=json.dumps(
                    {"sales_return_id": doc.id, "posting_number": doc.posting_number},
                    default=str,
                ),
            )
    except SalesReturn.DoesNotExist:
        return JsonResponse({"error": "Sales return not found."}, status=404)
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    doc = (
        SalesReturn.objects.select_related("created_by")
        .prefetch_related("items__medicine", "items__batch")
        .get(id=return_id)
    )
    return JsonResponse(
        {
            "message": "Sales return cancelled successfully.",
            "sales_return": _serialize_sales_return(doc, include_items=True),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sales_return_logs(request, return_id: int):
    logs = _filter_logs_for_entity(
        UserLog.objects.select_related("user").order_by("-timestamp"),
        "sales_return_id",
        return_id,
    )
    return JsonResponse([_serialize_user_log(log) for log in logs], safe=False)


def _serialize_supplier_return(doc: SupplierReturn, include_items=False):
    payload = {
        "id": doc.id,
        "posting_number": doc.posting_number,
        "supplier_id": doc.supplier_id,
        "supplier": doc.supplier.name if doc.supplier else "",
        "reference_document": doc.reference_document,
        "status": doc.get_status_display(),
        "status_key": doc.status,
        "created_by_id": doc.created_by_id,
        "created_by": getattr(doc.created_by, "email", ""),
        "notes": doc.notes,
        "created_at": doc.created_at.isoformat(),
        "updated_at": doc.updated_at.isoformat(),
    }
    if include_items:
        payload["items"] = [
            {
                "id": item.id,
                "medicine_id": item.medicine_id,
                "medicine_name": item.medicine.name if item.medicine else "",
                "batch_id": item.batch_id,
                "batch_number": item.batch.batch_number if item.batch else "",
                "quantity": item.quantity,
                "unit_price": str(item.unit_price),
                "notes": item.notes,
            }
            for item in doc.items.select_related("medicine", "batch").all()
        ]
    return payload


def _normalize_supplier_return_payload(payload):
    supplier_id = payload.get("supplier_id")
    reference_document = (payload.get("reference_document") or "").strip()
    notes = (payload.get("notes") or "").strip()
    items = payload.get("items") or []

    if not supplier_id:
        raise ValueError("Supplier is required.")
    try:
        supplier = Supplier.objects.get(pk=supplier_id)
    except Supplier.DoesNotExist as exc:
        raise ValueError("Supplier not found.") from exc

    if not isinstance(items, list) or not items:
        raise ValueError("At least one supplier return item is required.")

    normalized_items = []
    for index, item in enumerate(items, start=1):
        prefix = f"Item #{index}"
        medicine_id = item.get("medicine_id")
        batch_id = item.get("batch_id")
        if not medicine_id:
            raise ValueError(f"{prefix}: medicine is required.")
        if not batch_id:
            raise ValueError(f"{prefix}: batch is required.")

        medicine = _get_fetchable_medicine(medicine_id, prefix)
        try:
            batch = Batches.objects.get(
                pk=batch_id,
                product_id=medicine,
                product_id__is_active=True,
                product_id__status=Medicine.STATUS_SUBMITTED,
            )
        except Batches.DoesNotExist as exc:
            raise ValueError(f"{prefix}: batch not found for this medicine.") from exc

        quantity = _parse_positive_int(item.get("quantity"), f"{prefix} quantity")
        unit_price = _parse_decimal(
            item.get("unit_price") or batch.purchase_price, f"{prefix} unit price"
        )
        normalized_items.append(
            {
                "medicine": medicine,
                "batch": batch,
                "quantity": quantity,
                "unit_price": unit_price,
                "notes": (item.get("notes") or "").strip(),
            }
        )

    return {
        "supplier": supplier,
        "reference_document": reference_document,
        "notes": notes,
        "items": normalized_items,
    }


def _post_supplier_return(doc: SupplierReturn):
    if doc.status != SupplierReturn.STATUS_DRAFT:
        raise ValueError("Only draft supplier returns can be submitted.")
    items = list(doc.items.select_related("medicine", "batch").all())
    if not items:
        raise ValueError("Draft supplier return does not contain any items.")

    batch_ids = sorted({item.batch_id for item in items if item.batch_id})
    locked_batches = {
        batch.batch_id: batch
        for batch in Batches.objects.select_for_update().filter(pk__in=batch_ids)
    }
    if len(locked_batches) != len(batch_ids):
        raise ValueError("One or more batches are no longer available.")

    for item in items:
        batch = locked_batches[item.batch_id]
        if batch.quantity < item.quantity:
            raise ValueError(
                f"Batch {batch.batch_number} does not have enough quantity for this supplier return."
            )
        batch.quantity -= item.quantity
        batch.save(update_fields=["quantity"])

        inventory_row = (
            Inventory.objects.select_for_update()
            .filter(medicine=item.medicine, batch_number=batch.batch_number)
            .first()
        )
        if not inventory_row or inventory_row.quantity < item.quantity:
            raise ValueError(
                f"Inventory batch {batch.batch_number} does not have enough quantity."
            )
        inventory_row.quantity -= item.quantity
        if inventory_row.quantity == 0:
            inventory_row.delete()
        else:
            inventory_row.save(update_fields=["quantity", "updated_at"])

        StockLedger.objects.create(
            medicine=item.medicine,
            batch=batch,
            transaction_type=StockLedger.TRANSACTION_RETURN,
            quantity=-item.quantity,
            unit_price=item.unit_price,
            reference_document=doc.reference_document or doc.posting_number,
            notes=item.notes or f"Supplier return {doc.posting_number}",
        )

    doc.status = SupplierReturn.STATUS_POSTED
    doc.save(update_fields=["status", "updated_at"])


def _reverse_posted_supplier_return(doc: SupplierReturn):
    if doc.status != SupplierReturn.STATUS_POSTED:
        raise ValueError("Only posted supplier returns can be cancelled.")
    items = list(doc.items.select_related("medicine", "batch").all())
    if not items:
        raise ValueError("Posted supplier return does not contain any items.")

    batch_ids = sorted({item.batch_id for item in items if item.batch_id})
    locked_batches = {
        batch.batch_id: batch
        for batch in Batches.objects.select_for_update().filter(pk__in=batch_ids)
    }
    if len(locked_batches) != len(batch_ids):
        raise ValueError("One or more batches are no longer available.")

    for item in items:
        batch = locked_batches[item.batch_id]
        batch.quantity += item.quantity
        batch.save(update_fields=["quantity"])

        inventory_row = (
            Inventory.objects.select_for_update()
            .filter(medicine=item.medicine, batch_number=batch.batch_number)
            .first()
        )
        if not inventory_row:
            Inventory.objects.create(
                medicine=item.medicine,
                batch_number=batch.batch_number,
                quantity=item.quantity,
                expiry_date=batch.expiry_date,
                location="Main Store",
            )
        else:
            inventory_row.quantity += item.quantity
            inventory_row.expiry_date = batch.expiry_date
            inventory_row.save(update_fields=["quantity", "expiry_date", "updated_at"])

        StockLedger.objects.create(
            medicine=item.medicine,
            batch=batch,
            transaction_type=StockLedger.TRANSACTION_RETURN,
            quantity=item.quantity,
            unit_price=item.unit_price,
            reference_document=doc.reference_document or doc.posting_number,
            notes=f"Supplier return reversal {doc.posting_number}",
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def supplier_returns_list(request):
    page_size = int(request.GET.get("page_size", 10))
    page = int(request.GET.get("page", 1))
    posting_number = _compact_text(request.GET.get("posting_number", ""))
    supplier_query = _compact_text(request.GET.get("supplier", ""))
    status = _compact_text(request.GET.get("status", "")).lower()

    queryset = SupplierReturn.objects.select_related("created_by", "supplier").order_by(
        "-created_at"
    )
    if posting_number:
        queryset = queryset.filter(posting_number__icontains=posting_number)
    if supplier_query:
        queryset = queryset.filter(supplier__name__icontains=supplier_query)
    if status:
        queryset = queryset.filter(status=status)

    paginator = Paginator(queryset, page_size)
    try:
        page_obj = paginator.page(page)
    except EmptyPage:
        page_obj = paginator.page(1)

    return JsonResponse(
        {
            "results": [
                _serialize_supplier_return(doc) for doc in page_obj.object_list
            ],
            "count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": page_obj.number,
            "page_size": page_size,
            "has_next": page_obj.has_next(),
            "has_previous": page_obj.has_previous(),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def supplier_return_detail(request, return_id: int):
    try:
        doc = (
            SupplierReturn.objects.select_related("created_by", "supplier")
            .prefetch_related("items__medicine", "items__batch")
            .get(id=return_id)
        )
    except SupplierReturn.DoesNotExist:
        return JsonResponse({"error": "Supplier return not found."}, status=404)
    return JsonResponse(_serialize_supplier_return(doc, include_items=True))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def supplier_return_create(request):
    try:
        normalized = _normalize_supplier_return_payload(request.data)
        with transaction.atomic():
            doc = SupplierReturn.objects.create(
                supplier=normalized["supplier"],
                reference_document=normalized["reference_document"],
                status=SupplierReturn.STATUS_DRAFT,
                notes=normalized["notes"],
                created_by=request.user,
            )
            for item in normalized["items"]:
                SupplierReturnItem.objects.create(
                    supplier_return=doc,
                    medicine=item["medicine"],
                    batch=item["batch"],
                    quantity=item["quantity"],
                    unit_price=item["unit_price"],
                    notes=item["notes"],
                )
            UserLog.objects.create(
                user=request.user,
                action="Supplier Return Draft Created",
                details=json.dumps(
                    {
                        "supplier_return_id": doc.id,
                        "posting_number": doc.posting_number,
                    },
                    default=str,
                ),
            )
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    doc = SupplierReturn.objects.select_related("created_by", "supplier").get(id=doc.id)
    return JsonResponse(
        {
            "message": "Supplier return draft created.",
            "supplier_return": _serialize_supplier_return(doc, include_items=True),
        },
        status=201,
    )


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def supplier_return_update(request, return_id: int):
    try:
        doc = SupplierReturn.objects.get(id=return_id)
    except SupplierReturn.DoesNotExist:
        return JsonResponse({"error": "Supplier return not found."}, status=404)

    previous_status = doc.status
    if previous_status not in (
        SupplierReturn.STATUS_DRAFT,
        SupplierReturn.STATUS_CANCELLED,
    ):
        return JsonResponse(
            {"error": "Only draft or cancelled supplier returns can be edited."},
            status=400,
        )

    try:
        normalized = _normalize_supplier_return_payload(request.data)
        with transaction.atomic():
            doc.supplier = normalized["supplier"]
            doc.reference_document = normalized["reference_document"]
            doc.notes = normalized["notes"]
            if previous_status == SupplierReturn.STATUS_CANCELLED:
                doc.status = SupplierReturn.STATUS_DRAFT
            doc.save(
                update_fields=[
                    "supplier",
                    "reference_document",
                    "notes",
                    "status",
                    "updated_at",
                ]
            )

            doc.items.all().delete()
            for item in normalized["items"]:
                SupplierReturnItem.objects.create(
                    supplier_return=doc,
                    medicine=item["medicine"],
                    batch=item["batch"],
                    quantity=item["quantity"],
                    unit_price=item["unit_price"],
                    notes=item["notes"],
                )

            UserLog.objects.create(
                user=request.user,
                action=(
                    "Supplier Return Amended"
                    if previous_status == SupplierReturn.STATUS_CANCELLED
                    else "Supplier Return Draft Updated"
                ),
                details=json.dumps(
                    {
                        "supplier_return_id": doc.id,
                        "posting_number": doc.posting_number,
                        "previous_status": previous_status,
                        "current_status": doc.status,
                    },
                    default=str,
                ),
            )
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    doc = (
        SupplierReturn.objects.select_related("created_by", "supplier")
        .prefetch_related("items__medicine", "items__batch")
        .get(id=doc.id)
    )
    return JsonResponse(
        {
            "message": (
                "Supplier return amended and moved back to draft successfully."
                if previous_status == SupplierReturn.STATUS_CANCELLED
                else "Supplier return draft updated successfully."
            ),
            "supplier_return": _serialize_supplier_return(doc, include_items=True),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def supplier_return_submit(request, return_id: int):
    denied = _require_roles(request, {"admin", "manager", "pharmacist"})
    if denied:
        return denied
    try:
        with transaction.atomic():
            doc = SupplierReturn.objects.select_for_update().get(id=return_id)
            _post_supplier_return(doc)
            UserLog.objects.create(
                user=request.user,
                action="Supplier Return Submitted",
                details=json.dumps(
                    {
                        "supplier_return_id": doc.id,
                        "posting_number": doc.posting_number,
                    },
                    default=str,
                ),
            )
    except SupplierReturn.DoesNotExist:
        return JsonResponse({"error": "Supplier return not found."}, status=404)
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    doc = (
        SupplierReturn.objects.select_related("created_by", "supplier")
        .prefetch_related("items__medicine", "items__batch")
        .get(id=return_id)
    )
    return JsonResponse(
        {
            "message": "Supplier return submitted successfully.",
            "supplier_return": _serialize_supplier_return(doc, include_items=True),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def supplier_return_cancel(request, return_id: int):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied
    try:
        with transaction.atomic():
            doc = SupplierReturn.objects.select_for_update().get(id=return_id)
            _reverse_posted_supplier_return(doc)
            doc.status = SupplierReturn.STATUS_CANCELLED
            doc.save(update_fields=["status", "updated_at"])
            UserLog.objects.create(
                user=request.user,
                action="Supplier Return Cancelled",
                details=json.dumps(
                    {
                        "supplier_return_id": doc.id,
                        "posting_number": doc.posting_number,
                    },
                    default=str,
                ),
            )
    except SupplierReturn.DoesNotExist:
        return JsonResponse({"error": "Supplier return not found."}, status=404)
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    doc = (
        SupplierReturn.objects.select_related("created_by", "supplier")
        .prefetch_related("items__medicine", "items__batch")
        .get(id=return_id)
    )
    return JsonResponse(
        {
            "message": "Supplier return cancelled successfully.",
            "supplier_return": _serialize_supplier_return(doc, include_items=True),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def supplier_return_logs(request, return_id: int):
    logs = _filter_logs_for_entity(
        UserLog.objects.select_related("user").order_by("-timestamp"),
        "supplier_return_id",
        return_id,
    )
    return JsonResponse([_serialize_user_log(log) for log in logs], safe=False)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def audit_logs_list(request):
    try:
        page_size = int(request.GET.get("page_size", 20))
        page = int(request.GET.get("page", 1))
    except (TypeError, ValueError):
        return JsonResponse({"error": "Invalid pagination values."}, status=400)

    page_size = max(1, min(page_size, 100))
    page = max(1, page)

    q = _compact_text(request.GET.get("q", ""))
    action = _compact_text(request.GET.get("action", ""))
    user = _compact_text(request.GET.get("user", ""))

    queryset = UserLog.objects.select_related("user").order_by("-timestamp")
    if action:
        queryset = queryset.filter(action__icontains=action)
    if user:
        queryset = queryset.filter(
            Q(user__email__icontains=user)
            | Q(user__first_name__icontains=user)
            | Q(user__last_name__icontains=user)
        )
    if q:
        queryset = queryset.filter(Q(action__icontains=q) | Q(details__icontains=q))

    paginator = Paginator(queryset, page_size)
    try:
        page_obj = paginator.page(page)
    except EmptyPage:
        page_obj = paginator.page(1)

    return JsonResponse(
        {
            "results": [_serialize_user_log(log) for log in page_obj.object_list],
            "count": paginator.count,
            "total_pages": paginator.num_pages,
            "current_page": page_obj.number,
            "page_size": page_size,
            "has_next": page_obj.has_next(),
            "has_previous": page_obj.has_previous(),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def report_near_expiry(request):
    days = _get_inventory_threshold(request, "days", 30, minimum=1, maximum=3650)
    today = timezone.localdate()
    cutoff = today + timedelta(days=days)

    batches = (
        Batches.objects.select_related("product_id__category", "supplier_id")
        .filter(quantity__gt=0, expiry_date__gt=today, expiry_date__lte=cutoff)
        .order_by("expiry_date", "product_id__name", "batch_number")
    )

    results = []
    for batch in batches[:1000]:
        medicine = batch.product_id
        results.append(
            {
                "batch_id": batch.batch_id,
                "batch_number": batch.batch_number,
                "medicine_id": medicine.id if medicine else None,
                "medicine_name": medicine.name if medicine else "",
                "category": medicine.category.name
                if medicine and medicine.category
                else "",
                "supplier": batch.supplier_id.name if batch.supplier_id else "",
                "quantity": batch.quantity,
                "expiry_date": batch.expiry_date.isoformat(),
                "days_to_expiry": (batch.expiry_date - today).days,
                "unit_cost": str(batch.purchase_price),
            }
        )

    return JsonResponse({"days": days, "count": len(results), "results": results})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def report_stock_valuation(request):
    batches = (
        Batches.objects.select_related("product_id__category")
        .filter(quantity__gt=0)
        .order_by("product_id__name")
    )

    totals = {}
    for batch in batches:
        medicine = batch.product_id
        if not medicine:
            continue
        entry = totals.setdefault(
            medicine.id,
            {
                "medicine_id": medicine.id,
                "medicine_name": medicine.name,
                "category": medicine.category.name if medicine.category else "",
                "quantity": 0,
                "value": Decimal("0"),
            },
        )
        entry["quantity"] += batch.quantity
        entry["value"] += (batch.purchase_price or Decimal("0")) * batch.quantity

    results = [
        {**entry, "value": str(entry["value"])}
        for entry in sorted(
            totals.values(), key=lambda item: item["medicine_name"].lower()
        )
    ]

    total_value = (
        sum(Decimal(item["value"]) for item in results) if results else Decimal("0")
    )
    return JsonResponse(
        {
            "count": len(results),
            "total_value": str(total_value),
            "results": results,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def report_sales_summary(request):
    try:
        start_date = (
            _parse_date_value(request.GET.get("start_date"), "start_date")
            if request.GET.get("start_date")
            else None
        )
        end_date = (
            _parse_date_value(request.GET.get("end_date"), "end_date")
            if request.GET.get("end_date")
            else None
        )
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    sales_qs = Sale.objects.filter(status=Sale.STATUS_POSTED)
    if start_date:
        sales_qs = sales_qs.filter(created_at__date__gte=start_date)
    if end_date:
        sales_qs = sales_qs.filter(created_at__date__lte=end_date)

    totals = sales_qs.aggregate(
        total_sales=Coalesce(
            Sum("total_amount"),
            Value(0, output_field=DecimalField(max_digits=12, decimal_places=2)),
        ),
        sale_count=Count("id"),
    )

    item_qs = SaleItem.objects.select_related("medicine").filter(sale__in=sales_qs)
    top_items = (
        item_qs.values("medicine_id", "medicine__name")
        .annotate(
            quantity=Coalesce(
                Sum("quantity"),
                Value(0, output_field=IntegerField()),
            ),
            revenue=Coalesce(
                Sum("subtotal"),
                Value(0, output_field=DecimalField(max_digits=12, decimal_places=2)),
            ),
        )
        .order_by("-revenue")[:10]
    )

    return JsonResponse(
        {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "total_sales": str(totals["total_sales"]),
            "sale_count": totals["sale_count"],
            "top_items": [
                {
                    "medicine_id": row["medicine_id"],
                    "medicine_name": row["medicine__name"] or "",
                    "quantity": row["quantity"],
                    "revenue": str(row["revenue"]),
                }
                for row in top_items
            ],
        }
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def medicines_delete(request, medicine_id):
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied
    try:
        medicine = Medicine.objects.get(id=medicine_id)
    except Medicine.DoesNotExist:
        return JsonResponse({"error": "Medicine not found"}, status=404)
    try:
        medicine.delete()
    except ProtectedError:
        return JsonResponse(
            {
                "error": (
                    "This medicine cannot be deleted because it is linked to other documents."
                )
            },
            status=400,
        )
    UserLog.objects.create(
        user=request.user,
        action="Medicine Deleted",
        details=json.dumps(
            {
                "medicine_id": medicine.id,
                "naming_series": medicine.naming_series,
            },
            default=str,
        ),
    )
    return JsonResponse({"message": "Medicine deleted successfully"}, status=200)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stock_entries_create(request):
    try:
        normalized = _normalize_stock_entry_payload(request.data)
        with transaction.atomic():
            stock_entry = StockEntry.objects.create(
                supplier=normalized["supplier"],
                invoice_number=normalized["invoice_number"],
                status=StockEntry.STATUS_DRAFT,
                total_cost=normalized["total_cost"],
                tax=normalized["tax"],
                grand_total=normalized["grand_total"],
                notes=normalized["notes"],
                received_by=request.user,
            )

            _replace_stock_entry_items(stock_entry, normalized["items"])

            UserLog.objects.create(
                user=request.user,
                action="Stock Entry Draft Created",
                details=json.dumps(
                    {
                        "stock_entry_id": stock_entry.id,
                        "posting_number": stock_entry.posting_number,
                        "supplier_id": normalized["supplier"].id,
                        "invoice_number": normalized["invoice_number"],
                    },
                    default=str,
                ),
            )
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    stock_entry = StockEntry.objects.get(id=stock_entry.id)
    return JsonResponse(
        {
            "message": "Stock entry saved as draft.",
            "stock_entry": _serialize_stock_entry(stock_entry, include_items=True),
        },
        status=201,
    )


# =============================================================================
# COSTING REPORTS API ENDPOINTS
# =============================================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def report_cogs_summary(request):
    """
    Report: Cost of Goods Sold summary by date range.
    Query params: start_date, end_date
    """
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    start_date_str = request.GET.get("start_date")
    end_date_str = request.GET.get("end_date")

    if not start_date_str or not end_date_str:
        return JsonResponse(
            {"error": "start_date and end_date are required (YYYY-MM-DD)"}, status=400
        )

    try:
        start_date = parse_date(start_date_str)
        end_date = parse_date(end_date_str)
        if not start_date or not end_date:
            raise ValueError("Invalid date format")
    except (ValueError, TypeError):
        return JsonResponse(
            {"error": "Invalid date format. Use YYYY-MM-DD"}, status=400
        )

    # Get sales in date range with cost data
    sales = Sale.objects.filter(
        status=Sale.STATUS_POSTED,
        updated_at__date__gte=start_date,
        updated_at__date__lte=end_date,
    ).prefetch_related("items")

    total_revenue = Decimal("0")
    total_cogs = Decimal("0")
    total_gross_profit = Decimal("0")
    medicine_stats = {}

    for sale in sales:
        for item in sale.items.all():
            revenue = item.subtotal
            cogs = item.calculated_cost or Decimal("0")
            profit = revenue - cogs

            total_revenue += revenue
            total_cogs += cogs
            total_gross_profit += profit

            medicine_id = item.medicine_id
            if medicine_id not in medicine_stats:
                medicine_stats[medicine_id] = {
                    "medicine_id": medicine_id,
                    "medicine_name": item.medicine.name,
                    "quantity_sold": 0,
                    "revenue": Decimal("0"),
                    "cogs": Decimal("0"),
                    "gross_profit": Decimal("0"),
                }

            medicine_stats[medicine_id]["quantity_sold"] += item.quantity
            medicine_stats[medicine_id]["revenue"] += revenue
            medicine_stats[medicine_id]["cogs"] += cogs
            medicine_stats[medicine_id]["gross_profit"] += profit

    # Calculate profit margins
    for stats in medicine_stats.values():
        if stats["revenue"] > 0:
            stats["profit_margin"] = (stats["gross_profit"] / stats["revenue"]) * 100
        else:
            stats["profit_margin"] = 0
        # Convert decimals to strings for JSON
        stats["revenue"] = str(stats["revenue"])
        stats["cogs"] = str(stats["cogs"])
        stats["gross_profit"] = str(stats["gross_profit"])
        stats["profit_margin"] = round(stats["profit_margin"], 2)

    overall_margin = (
        (total_gross_profit / total_revenue) * 100 if total_revenue > 0 else 0
    )

    return JsonResponse(
        {
            "start_date": start_date_str,
            "end_date": end_date_str,
            "summary": {
                "total_revenue": str(total_revenue),
                "total_cogs": str(total_cogs),
                "total_gross_profit": str(total_gross_profit),
                "overall_margin": round(overall_margin, 2),
                "total_sales": sales.count(),
            },
            "medicine_breakdown": list(medicine_stats.values()),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def report_inventory_valuation(request):
    """
    Report: Current inventory valuation by medicine.
    Shows current stock levels and values using the costing method.
    """
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    # Get all inventory valuations with related medicine
    valuations = InventoryValuation.objects.select_related("medicine").all()

    total_value = Decimal("0")
    total_quantity = 0
    medicines = []

    for val in valuations:
        total_value += val.total_value
        total_quantity += val.total_quantity

        medicines.append(
            {
                "medicine_id": val.medicine_id,
                "medicine_name": val.medicine.name,
                "costing_method": val.medicine.costing_method,
                "quantity": val.total_quantity,
                "average_cost": str(val.average_cost),
                "total_value": str(val.total_value),
            }
        )

    return JsonResponse(
        {
            "as_of": timezone.now().isoformat(),
            "total_inventory_value": str(total_value),
            "total_inventory_quantity": total_quantity,
            "medicine_count": len(medicines),
            "medicines": medicines,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def report_medicine_cost_layers(request, medicine_id: int):
    """
    Report: Cost layer detail for a specific medicine.
    Shows all active cost layers and their remaining quantities.
    """
    denied = _require_roles(request, {"admin", "manager", "pharmacist"})
    if denied:
        return denied

    try:
        medicine = Medicine.objects.get(id=medicine_id)
    except Medicine.DoesNotExist:
        return JsonResponse({"error": "Medicine not found"}, status=404)

    # Get cost layers
    layers = CostLayer.objects.filter(medicine=medicine).order_by("sequence_number")

    active_layers = []
    depleted_layers = []

    for layer in layers:
        layer_data = {
            "layer_id": layer.id,
            "sequence_number": layer.sequence_number,
            "original_quantity": layer.original_quantity,
            "remaining_quantity": layer.remaining_quantity,
            "unit_cost": str(layer.unit_cost),
            "total_value": str(layer.total_value),
            "expiry_date": layer.expiry_date.isoformat() if layer.expiry_date else None,
            "received_at": layer.received_at.isoformat(),
            "is_active": layer.is_active,
        }

        if layer.remaining_quantity > 0:
            active_layers.append(layer_data)
        else:
            depleted_layers.append(layer_data)

    # Get inventory valuation
    try:
        valuation = medicine.valuation
        valuation_data = {
            "total_quantity": valuation.total_quantity,
            "total_value": str(valuation.total_value),
            "average_cost": str(valuation.average_cost),
        }
    except InventoryValuation.DoesNotExist:
        valuation_data = {
            "total_quantity": 0,
            "total_value": "0",
            "average_cost": "0",
        }

    return JsonResponse(
        {
            "medicine_id": medicine.id,
            "medicine_name": medicine.name,
            "costing_method": medicine.costing_method,
            "valuation": valuation_data,
            "active_layers": active_layers,
            "depleted_layers": depleted_layers,
            "total_layers": layers.count(),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def report_profit_by_medicine(request):
    """
    Report: Profit analysis by medicine.
    Query params: start_date, end_date, min_quantity (optional)
    """
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    start_date_str = request.GET.get("start_date")
    end_date_str = request.GET.get("end_date")
    min_quantity = request.GET.get("min_quantity", 0)

    if not start_date_str or not end_date_str:
        return JsonResponse(
            {"error": "start_date and end_date are required (YYYY-MM-DD)"}, status=400
        )

    try:
        start_date = parse_date(start_date_str)
        end_date = parse_date(end_date_str)
        min_qty = int(min_quantity)
    except (ValueError, TypeError):
        return JsonResponse({"error": "Invalid parameters"}, status=400)

    # Get sale items with cost data
    sale_items = SaleItem.objects.filter(
        sale__status=Sale.STATUS_POSTED,
        sale__updated_at__date__gte=start_date,
        sale__updated_at__date__lte=end_date,
    ).select_related("medicine", "sale")

    medicine_data = {}

    for item in sale_items:
        med_id = item.medicine_id
        if med_id not in medicine_data:
            medicine_data[med_id] = {
                "medicine_id": med_id,
                "medicine_name": item.medicine.name,
                "total_quantity": 0,
                "total_revenue": Decimal("0"),
                "total_cogs": Decimal("0"),
                "total_profit": Decimal("0"),
                "sale_count": 0,
            }

        medicine_data[med_id]["total_quantity"] += item.quantity
        medicine_data[med_id]["total_revenue"] += item.subtotal
        medicine_data[med_id]["total_cogs"] += item.calculated_cost or Decimal("0")
        medicine_data[med_id]["sale_count"] += 1

    # Calculate derived metrics and filter
    results = []
    for data in medicine_data.values():
        if data["total_quantity"] >= min_qty:
            data["total_profit"] = data["total_revenue"] - data["total_cogs"]
            data["profit_margin"] = (
                (data["total_profit"] / data["total_revenue"]) * 100
                if data["total_revenue"] > 0
                else 0
            )
            data["avg_unit_profit"] = (
                data["total_profit"] / data["total_quantity"]
                if data["total_quantity"] > 0
                else 0
            )

            # Convert decimals to strings
            data["total_revenue"] = str(data["total_revenue"])
            data["total_cogs"] = str(data["total_cogs"])
            data["total_profit"] = str(data["total_profit"])
            data["profit_margin"] = round(data["profit_margin"], 2)
            data["avg_unit_profit"] = str(round(data["avg_unit_profit"], 2))

            results.append(data)

    # Sort by profit descending
    results.sort(key=lambda x: float(x["total_profit"]), reverse=True)

    return JsonResponse(
        {
            "start_date": start_date_str,
            "end_date": end_date_str,
            "medicine_count": len(results),
            "medicines": results,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def report_medicine_profit_trend(request, medicine_id: int):
    """
    Report: Profit trend for a specific medicine over time.
    Query params: start_date, end_date, group_by (day/week/month)
    """
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    try:
        medicine = Medicine.objects.get(id=medicine_id)
    except Medicine.DoesNotExist:
        return JsonResponse({"error": "Medicine not found"}, status=404)

    start_date_str = request.GET.get("start_date")
    end_date_str = request.GET.get("end_date")
    group_by = request.GET.get("group_by", "day")  # day, week, month

    if not start_date_str or not end_date_str:
        return JsonResponse(
            {"error": "start_date and end_date are required (YYYY-MM-DD)"}, status=400
        )

    try:
        start_date = parse_date(start_date_str)
        end_date = parse_date(end_date_str)
    except (ValueError, TypeError):
        return JsonResponse({"error": "Invalid date format"}, status=400)

    sale_items = SaleItem.objects.filter(
        medicine=medicine,
        sale__status=Sale.STATUS_POSTED,
        sale__updated_at__date__gte=start_date,
        sale__updated_at__date__lte=end_date,
    ).select_related("sale")

    from collections import defaultdict

    periods = defaultdict(lambda: {"revenue": Decimal("0"), "cogs": Decimal("0"), "quantity": 0})

    for item in sale_items:
        sale_date = item.sale.updated_at.date()

        if group_by == "week":
            period_key = sale_date.strftime("%Y-W%W")
        elif group_by == "month":
            period_key = sale_date.strftime("%Y-%m")
        else:
            period_key = sale_date.isoformat()

        periods[period_key]["revenue"] += item.subtotal
        periods[period_key]["cogs"] += item.calculated_cost or Decimal("0")
        periods[period_key]["quantity"] += item.quantity

    trend_data = []
    for period in sorted(periods.keys()):
        data = periods[period]
        profit = data["revenue"] - data["cogs"]
        margin = (profit / data["revenue"] * 100) if data["revenue"] > 0 else 0

        trend_data.append(
            {
                "period": period,
                "revenue": str(data["revenue"]),
                "cogs": str(data["cogs"]),
                "profit": str(profit),
                "profit_margin": round(margin, 2),
                "quantity_sold": data["quantity"],
            }
        )

    return JsonResponse(
        {
            "medicine_id": medicine.id,
            "medicine_name": medicine.name,
            "group_by": group_by,
            "start_date": start_date_str,
            "end_date": end_date_str,
            "trend": trend_data,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def report_inventory_status(request):
    """
    Comprehensive inventory status report with item details,
    category valuation, and summary statistics.
    """
    expiry_soon_days = _get_inventory_threshold(
        request,
        "expiry_soon_days",
        EXPIRY_SOON_DEFAULT_DAYS,
    )
    low_stock_threshold = _get_inventory_threshold(
        request,
        "low_stock_threshold",
        LOW_STOCK_DEFAULT_THRESHOLD,
        minimum=1,
        maximum=10000,
    )

    try:
        page = int(request.GET.get("page", 1))
        page_size = int(request.GET.get("page_size", 20))
    except (TypeError, ValueError):
        page = 1
        page_size = 20

    page_size = max(1, min(page_size, 100))
    page = max(1, page)

    snapshot = _build_inventory_snapshot(
        expiry_soon_days,
        low_stock_threshold,
    )
    items = snapshot["items"]

    # Apply filters
    search_query = _compact_text(request.GET.get("search", "")).lower()
    category_filter = _compact_text(request.GET.get("category", "")).lower()
    status_filter = _compact_text(request.GET.get("status", "")).lower()

    if search_query:
        items = [
            item
            for item in items
            if search_query in item["medicine_name"].lower()
            or search_query in item["generic_name"].lower()
            or search_query in item["batch_number"].lower()
        ]

    if category_filter:
        items = [item for item in items if item["category"].lower() == category_filter]

    if status_filter:
        normalized_status = status_filter.replace(" ", "_")
        items = [
            item
            for item in items
            if item["status_key"] == normalized_status
            or item["status"].lower() == status_filter
        ]

    # Calculate statistics
    total_items = len(items)
    in_stock_count = sum(1 for item in items if item["status_key"] == "in_stock")
    low_stock_count = sum(1 for item in items if item["status_key"] == "low_stock")
    expiring_soon_count = sum(1 for item in items if item["status_key"] == "expiring_soon")
    expired_count = sum(1 for item in items if item["status_key"] == "expired")
    out_of_stock_count = sum(1 for item in items if item["quantity"] == 0)

    # Calculate total valuation
    total_valuation = sum(
        Decimal(item["unit_cost"]) * Decimal(str(item["quantity"]))
        for item in items
    )

    # Category-wise valuation
    category_totals = {}
    for item in items:
        category = item["category"] or "Uncategorized"
        if category not in category_totals:
            category_totals[category] = {
                "name": category,
                "value": Decimal("0"),
                "quantity": 0,
                "item_count": 0,
            }
        item_value = Decimal(item["unit_cost"]) * Decimal(str(item["quantity"]))
        category_totals[category]["value"] += item_value
        category_totals[category]["quantity"] += item["quantity"]
        category_totals[category]["item_count"] += 1

    category_valuation = [
        {
            "name": data["name"],
            "value": str(data["value"]),
            "quantity": data["quantity"],
            "item_count": data["item_count"],
        }
        for data in sorted(
            category_totals.values(),
            key=lambda x: x["value"],
            reverse=True,
        )
    ]

    # Paginate items
    total_count = len(items)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_items = items[start_idx:end_idx]

    # Get unique categories for filter dropdown
    categories = sorted(set(item["category"] for item in snapshot["items"] if item["category"]))

    return JsonResponse(
        {
            "generated_at": timezone.now().isoformat(),
            "summary": {
                "total_items": snapshot["summary"]["total_batches"],
                "total_medicines": snapshot["summary"]["total_medicines"],
                "total_quantity": snapshot["summary"]["total_quantity"],
                "total_valuation": str(total_valuation),
                "in_stock_count": in_stock_count,
                "low_stock_count": low_stock_count,
                "expiring_soon_count": expiring_soon_count,
                "expired_count": expired_count,
                "out_of_stock_count": out_of_stock_count,
                "expiry_soon_days": expiry_soon_days,
                "low_stock_threshold": low_stock_threshold,
            },
            "stock_distribution": [
                {"name": "In Stock", "value": in_stock_count, "color": "#10b981"},
                {"name": "Low Stock", "value": low_stock_count, "color": "#f59e0b"},
                {"name": "Expiring Soon", "value": expiring_soon_count, "color": "#f59e0b"},
                {"name": "Expired", "value": expired_count, "color": "#ef4444"},
            ],
            "category_valuation": category_valuation,
            "items": paginated_items,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_count": total_count,
                "total_pages": (total_count + page_size - 1) // page_size,
            },
            "filters": {
                "categories": categories,
                "statuses": ["in_stock", "low_stock", "expiring_soon", "expired"],
            },
        }
    )


# ============== STOCK TAKE VIEWS ==============

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stock_takes_list(request):
    """List all stock takes."""
    queryset = StockTake.objects.select_related("created_by").prefetch_related("items")
    status_filter = _compact_text(request.GET.get("status", ""))
    if status_filter:
        queryset = queryset.filter(status__iexact=status_filter)
    queryset = queryset.order_by("-created_at")
    results = [
        {
            "id": st.id,
            "posting_number": st.posting_number,
            "title": st.title,
            "status": st.status,
            "status_label": st.get_status_display(),
            "notes": st.notes,
            "started_at": st.started_at.isoformat() if st.started_at else None,
            "completed_at": st.completed_at.isoformat() if st.completed_at else None,
            "created_by": st.created_by_id,
            "created_by_name": getattr(st.created_by, "username", None),
            "totals": st.calculate_totals(),
            "created_at": st.created_at.isoformat(),
        }
        for st in queryset
    ]
    return JsonResponse({"count": len(results), "results": results})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stock_take_create(request):
    """Create a new stock take."""
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    title = _compact_text(request.data.get("title", ""))
    notes = request.data.get("notes", "")

    if not title:
        return JsonResponse({"error": "Title is required."}, status=400)

    stock_take = StockTake.objects.create(
        title=title,
        notes=notes,
        status=StockTake.STATUS_DRAFT,
        created_by=request.user,
    )

    UserLog.objects.create(
        user=request.user,
        action="Stock Take Created",
        details=json.dumps(
            {"posting_number": stock_take.posting_number, "title": stock_take.title},
            default=str,
        ),
    )

    return JsonResponse(
        {
            "id": stock_take.id,
            "posting_number": stock_take.posting_number,
            "title": stock_take.title,
            "status": stock_take.status,
            "message": "Stock take created successfully.",
        },
        status=201,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stock_take_detail(request, stock_take_id):
    """Get stock take details with items."""
    try:
        stock_take = StockTake.objects.prefetch_related("items__medicine", "items__batch").get(
            id=stock_take_id
        )
    except StockTake.DoesNotExist:
        return JsonResponse({"error": "Stock take not found."}, status=404)

    items = [
        {
            "id": item.id,
            "medicine_id": item.medicine_id,
            "medicine_name": item.medicine.name,
            "medicine_barcode": item.medicine.barcode,
            "batch_id": item.batch_id,
            "batch_number": item.batch.batch_number if item.batch else None,
            "system_quantity": str(item.system_quantity),
            "counted_quantity": str(item.counted_quantity),
            "variance": str(item.variance),
            "variance_percentage": round(item.variance_percentage, 2),
            "variance_status": item.variance_status,
            "unit_cost": str(item.unit_cost) if item.unit_cost else None,
            "notes": item.notes,
            "counted_by": item.counted_by_id,
            "counted_by_name": getattr(item.counted_by, "username", None) if item.counted_by else None,
            "counted_at": item.counted_at.isoformat() if item.counted_at else None,
        }
        for item in stock_take.items.all()
    ]

    return JsonResponse(
        {
            "id": stock_take.id,
            "posting_number": stock_take.posting_number,
            "title": stock_take.title,
            "status": stock_take.status,
            "status_label": stock_take.get_status_display(),
            "notes": stock_take.notes,
            "started_at": stock_take.started_at.isoformat() if stock_take.started_at else None,
            "completed_at": stock_take.completed_at.isoformat() if stock_take.completed_at else None,
            "created_by": stock_take.created_by_id,
            "created_by_name": getattr(stock_take.created_by, "username", None),
            "totals": stock_take.calculate_totals(),
            "items": items,
            "created_at": stock_take.created_at.isoformat(),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stock_take_start(request, stock_take_id):
    """Start a stock take (add items from current inventory)."""
    try:
        stock_take = StockTake.objects.get(id=stock_take_id)
    except StockTake.DoesNotExist:
        return JsonResponse({"error": "Stock take not found."}, status=404)

    if stock_take.status != StockTake.STATUS_DRAFT:
        return JsonResponse(
            {"error": "Stock take must be in Draft status to start."}, status=400
        )

    # Get current inventory snapshot
    batches = Batches.objects.filter(quantity__gt=0).select_related(
        "product_id", "supplier_id"
    )

    items_created = 0
    for batch in batches:
        StockTakeItem.objects.create(
            stock_take=stock_take,
            medicine=batch.product_id,
            batch=batch,
            system_quantity=batch.quantity,
            counted_quantity=0,
            unit_cost=batch.purchase_price,
        )
        items_created += 1

    stock_take.status = StockTake.STATUS_IN_PROGRESS
    stock_take.started_at = timezone.now()
    stock_take.save()

    UserLog.objects.create(
        user=request.user,
        action="Stock Take Started",
        details=json.dumps(
            {
                "posting_number": stock_take.posting_number,
                "items_count": items_created,
            },
            default=str,
        ),
    )

    return JsonResponse(
        {
            "message": "Stock take started successfully.",
            "items_created": items_created,
            "status": stock_take.status,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stock_take_count_item(request, stock_take_id, item_id):
    """Record counted quantity for a stock take item."""
    try:
        stock_take = StockTake.objects.get(id=stock_take_id)
    except StockTake.DoesNotExist:
        return JsonResponse({"error": "Stock take not found."}, status=404)

    if stock_take.status != StockTake.STATUS_IN_PROGRESS:
        return JsonResponse(
            {"error": "Stock take must be in progress to count items."}, status=400
        )

    try:
        item = StockTakeItem.objects.get(id=item_id, stock_take=stock_take)
    except StockTakeItem.DoesNotExist:
        return JsonResponse({"error": "Stock take item not found."}, status=404)

    counted_quantity = request.data.get("counted_quantity")
    if counted_quantity is None:
        return JsonResponse({"error": "counted_quantity is required."}, status=400)

    try:
        counted_quantity = Decimal(str(counted_quantity))
    except (TypeError, ValueError, InvalidOperation):
        return JsonResponse({"error": "Invalid counted_quantity value."}, status=400)

    item.counted_quantity = counted_quantity
    item.counted_by = request.user
    item.counted_at = timezone.now()
    item.notes = request.data.get("notes", item.notes)
    item.save()

    return JsonResponse(
        {
            "id": item.id,
            "counted_quantity": str(item.counted_quantity),
            "variance": str(item.variance),
            "message": "Item counted successfully.",
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stock_take_complete(request, stock_take_id):
    """Complete a stock take and apply adjustments if needed."""
    try:
        stock_take = StockTake.objects.get(id=stock_take_id)
    except StockTake.DoesNotExist:
        return JsonResponse({"error": "Stock take not found."}, status=404)

    if stock_take.status != StockTake.STATUS_IN_PROGRESS:
        return JsonResponse(
            {"error": "Stock take must be in progress to complete."}, status=400
        )

    apply_adjustments = request.data.get("apply_adjustments", False)
    adjustment_reason = request.data.get("adjustment_reason", "Stock Take Adjustment")

    adjustments_made = 0
    if apply_adjustments:
        # Create stock adjustment for variance items
        variance_items = [
            item for item in stock_take.items.all() if item.variance != 0
        ]

        if variance_items:
            adjustment = StockAdjustment.objects.create(
                reason=StockAdjustment.REASON_OTHER,
                status=StockAdjustment.STATUS_SUBMITTED,
                created_by=request.user,
                notes=f"Adjustment from Stock Take: {stock_take.posting_number}",
            )

            for item in variance_items:
                StockAdjustmentItem.objects.create(
                    adjustment=adjustment,
                    medicine=item.medicine,
                    batch=item.batch,
                    quantity_before=item.system_quantity,
                    quantity_after=item.counted_quantity,
                    adjustment_reason=item.notes or adjustment_reason,
                )

                # Update batch quantity
                if item.batch:
                    item.batch.quantity = item.counted_quantity
                    item.batch.save()

            adjustments_made = len(variance_items)

    stock_take.status = StockTake.STATUS_COMPLETED
    stock_take.completed_at = timezone.now()
    stock_take.save()

    UserLog.objects.create(
        user=request.user,
        action="Stock Take Completed",
        details=json.dumps(
            {
                "posting_number": stock_take.posting_number,
                "adjustments_made": adjustments_made,
                "apply_adjustments": apply_adjustments,
            },
            default=str,
        ),
    )

    return JsonResponse(
        {
            "message": "Stock take completed successfully.",
            "adjustments_made": adjustments_made,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stock_take_cancel(request, stock_take_id):
    """Cancel a stock take."""
    try:
        stock_take = StockTake.objects.get(id=stock_take_id)
    except StockTake.DoesNotExist:
        return JsonResponse({"error": "Stock take not found."}, status=404)

    if stock_take.status == StockTake.STATUS_COMPLETED:
        return JsonResponse(
            {"error": "Cannot cancel a completed stock take."}, status=400
        )

    stock_take.status = StockTake.STATUS_CANCELLED
    stock_take.save()

    UserLog.objects.create(
        user=request.user,
        action="Stock Take Cancelled",
        details=json.dumps(
            {"posting_number": stock_take.posting_number}, default=str
        ),
    )

    return JsonResponse({"message": "Stock take cancelled successfully."})


# ============== REORDER ALERT VIEWS ==============

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reorder_alerts_list(request):
    """List active reorder alerts."""
    status_filter = _compact_text(request.GET.get("status", ""))
    priority_filter = _compact_text(request.GET.get("priority", ""))

    queryset = ReorderAlert.objects.select_related("medicine", "acknowledged_by")

    if status_filter:
        queryset = queryset.filter(status__iexact=status_filter)
    if priority_filter:
        queryset = queryset.filter(priority__iexact=priority_filter)

    queryset = queryset.order_by("-priority", "-triggered_at")

    results = [
        {
            "id": alert.id,
            "medicine_id": alert.medicine_id,
            "medicine_name": alert.medicine.name,
            "medicine_barcode": alert.medicine.barcode,
            "current_stock": str(alert.current_stock),
            "reorder_level": str(alert.reorder_level),
            "shortage_quantity": str(alert.shortage_quantity),
            "suggested_order_quantity": str(alert.suggested_order_quantity),
            "status": alert.status,
            "status_label": alert.get_status_display(),
            "priority": alert.priority,
            "priority_label": alert.get_priority_display(),
            "notes": alert.notes,
            "triggered_at": alert.triggered_at.isoformat(),
            "acknowledged_at": alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
            "acknowledged_by": alert.acknowledged_by_id,
            "acknowledged_by_name": getattr(alert.acknowledged_by, "username", None) if alert.acknowledged_by else None,
        }
        for alert in queryset
    ]

    return JsonResponse({"count": len(results), "results": results})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reorder_alert_acknowledge(request, alert_id):
    """Acknowledge a reorder alert."""
    try:
        alert = ReorderAlert.objects.get(id=alert_id)
    except ReorderAlert.DoesNotExist:
        return JsonResponse({"error": "Reorder alert not found."}, status=404)

    if alert.status != ReorderAlert.STATUS_ACTIVE:
        return JsonResponse(
            {"error": "Only active alerts can be acknowledged."}, status=400
        )

    alert.status = ReorderAlert.STATUS_ACKNOWLEDGED
    alert.acknowledged_at = timezone.now()
    alert.acknowledged_by = request.user
    alert.notes = request.data.get("notes", alert.notes)
    alert.save()

    return JsonResponse({"message": "Alert acknowledged successfully."})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reorder_alert_resolve(request, alert_id):
    """Resolve a reorder alert."""
    try:
        alert = ReorderAlert.objects.get(id=alert_id)
    except ReorderAlert.DoesNotExist:
        return JsonResponse({"error": "Reorder alert not found."}, status=404)

    alert.status = ReorderAlert.STATUS_RESOLVED
    alert.resolved_at = timezone.now()
    alert.notes = request.data.get("notes", alert.notes)
    alert.save()

    return JsonResponse({"message": "Alert resolved successfully."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reorder_configs_list(request):
    """List reorder configurations."""
    queryset = ReorderConfig.objects.select_related("medicine").order_by("medicine__name")
    results = [
        {
            "id": config.id,
            "medicine_id": config.medicine_id,
            "medicine_name": config.medicine.name,
            "reorder_level": str(config.reorder_level),
            "safety_stock": str(config.safety_stock),
            "reorder_quantity": str(config.reorder_quantity),
            "lead_time_days": config.lead_time_days,
            "is_active": config.is_active,
        }
        for config in queryset
    ]
    return JsonResponse({"count": len(results), "results": results})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reorder_config_create(request):
    """Create or update reorder configuration for a medicine."""
    medicine_id = request.data.get("medicine_id")
    if not medicine_id:
        return JsonResponse({"error": "medicine_id is required."}, status=400)

    try:
        medicine = Medicine.objects.get(id=medicine_id)
    except Medicine.DoesNotExist:
        return JsonResponse({"error": "Medicine not found."}, status=404)

    config, created = ReorderConfig.objects.update_or_create(
        medicine=medicine,
        defaults={
            "reorder_level": request.data.get("reorder_level", 10),
            "safety_stock": request.data.get("safety_stock", 5),
            "reorder_quantity": request.data.get("reorder_quantity", 50),
            "lead_time_days": request.data.get("lead_time_days", 7),
            "is_active": request.data.get("is_active", True),
        },
    )

    return JsonResponse(
        {
            "id": config.id,
            "medicine_id": config.medicine_id,
            "message": "Configuration saved successfully.",
        }
    )


# ============== EXPIRY NOTIFICATION VIEWS ==============

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def expiry_notifications_list(request):
    """List expiry notifications."""
    status_filter = _compact_text(request.GET.get("status", ""))
    priority_filter = _compact_text(request.GET.get("priority", ""))

    queryset = ExpiryNotification.objects.select_related(
        "medicine", "batch", "acknowledged_by", "actioned_by"
    )

    if status_filter:
        queryset = queryset.filter(status__iexact=status_filter)
    if priority_filter:
        queryset = queryset.filter(priority__iexact=priority_filter)

    queryset = queryset.order_by("expiry_date", "-priority")

    results = [
        {
            "id": notif.id,
            "batch_id": notif.batch_id,
            "batch_number": notif.batch.batch_number,
            "medicine_id": notif.medicine_id,
            "medicine_name": notif.medicine.name,
            "expiry_date": notif.expiry_date.isoformat(),
            "days_to_expiry": notif.days_to_expiry,
            "quantity_at_risk": str(notif.quantity_at_risk),
            "total_value_at_risk": str(notif.total_value_at_risk) if notif.total_value_at_risk else None,
            "status": notif.status,
            "status_label": notif.get_status_display(),
            "priority": notif.priority,
            "priority_label": notif.get_priority_display(),
            "is_expired": notif.is_expired,
            "is_critical": notif.is_critical,
            "notification_type": notif.notification_type,
            "notes": notif.notes,
            "action_taken": notif.action_taken,
            "notified_at": notif.notified_at.isoformat(),
            "acknowledged_at": notif.acknowledged_at.isoformat() if notif.acknowledged_at else None,
            "actioned_at": notif.actioned_at.isoformat() if notif.actioned_at else None,
        }
        for notif in queryset
    ]

    return JsonResponse({"count": len(results), "results": results})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def expiry_notification_acknowledge(request, notification_id):
    """Acknowledge an expiry notification."""
    try:
        notif = ExpiryNotification.objects.get(id=notification_id)
    except ExpiryNotification.DoesNotExist:
        return JsonResponse({"error": "Notification not found."}, status=404)

    if notif.status != ExpiryNotification.STATUS_PENDING:
        return JsonResponse(
            {"error": "Only pending notifications can be acknowledged."}, status=400
        )

    notif.status = ExpiryNotification.STATUS_ACKNOWLEDGED
    notif.acknowledged_at = timezone.now()
    notif.acknowledged_by = request.user
    notif.notes = request.data.get("notes", notif.notes)
    notif.save()

    return JsonResponse({"message": "Notification acknowledged successfully."})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def expiry_notification_action(request, notification_id):
    """Mark an expiry notification as actioned."""
    try:
        notif = ExpiryNotification.objects.get(id=notification_id)
    except ExpiryNotification.DoesNotExist:
        return JsonResponse({"error": "Notification not found."}, status=404)

    action_taken = request.data.get("action_taken", "")
    if not action_taken:
        return JsonResponse({"error": "action_taken is required."}, status=400)

    notif.status = ExpiryNotification.STATUS_ACTIONED
    notif.action_taken = action_taken
    notif.actioned_at = timezone.now()
    notif.actioned_by = request.user
    notif.notes = request.data.get("notes", notif.notes)
    notif.save()

    return JsonResponse({"message": "Notification actioned successfully."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def expiry_config_get(request):
    """Get expiry configuration."""
    config = ExpiryConfig.get_config()
    return JsonResponse(
        {
            "id": config.id,
            "name": config.name,
            "warning_days": config.warning_days,
            "critical_days": config.critical_days,
            "notification_frequency_days": config.notification_frequency_days,
            "auto_dispose_expired": config.auto_dispose_expired,
            "is_active": config.is_active,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def expiry_config_update(request):
    """Update expiry configuration."""
    denied = _require_roles(request, {"admin", "manager"})
    if denied:
        return denied

    config = ExpiryConfig.get_config()
    config.warning_days = request.data.get("warning_days", config.warning_days)
    config.critical_days = request.data.get("critical_days", config.critical_days)
    config.notification_frequency_days = request.data.get(
        "notification_frequency_days", config.notification_frequency_days
    )
    config.auto_dispose_expired = request.data.get(
        "auto_dispose_expired", config.auto_dispose_expired
    )
    config.save()

    return JsonResponse({"message": "Configuration updated successfully."})


