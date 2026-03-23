import hashlib
import json
import re
from datetime import timedelta
from decimal import Decimal, InvalidOperation

from django.core.cache import cache
from django.core.paginator import EmptyPage, Paginator
from django.db import transaction
from django.db.models import Count, Q, Sum, Value
from django.db.models.functions import Coalesce
from django.http import JsonResponse
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from tables.modle import (
    Batches,
    Category,
    GoodRecivingNote,
    GoodRecivingNoteItem,
    Inventory,
    Medicine,
    Purchase,
    PurchaseItem,
    Sale,
    SaleItem,
    StockEntry,
    StockEntryItem,
    StockLedger,
    Supplier,
)
from tables.modle.user_log import UserLog


class DashboardStatsView:
    pass


EXPIRY_SOON_DEFAULT_DAYS = 90
LOW_STOCK_DEFAULT_THRESHOLD = 10


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


def _filter_logs_for_entity(queryset, entity_key, entity_id):
    matched_logs = []

    for log in queryset:
        details = _parse_log_details(log.details)
        if details and details.get(entity_key) == entity_id:
            matched_logs.append(log)

    return matched_logs


def dashboard_summary(request):
    cache_key = f"dashboard_summary"

    data = cache.get(cache_key)

    if not data:
        total_sales = Sale.objects.aggregate(total=Sum("amount"))["total"]
        total_products = Medicine.objects.count()

        data = {
            "total_sales": total_sales,
            "total_products": total_products,
        }

        cache.set(cache_key, data, timeout=60)  # 1 minute

    return JsonResponse(data)


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


def _build_inventory_snapshot(expiry_soon_days, low_stock_threshold):
    batches = list(
        Batches.objects.filter(quantity__gt=0)
        .select_related("product_id__category", "product_id__supplier", "supplier_id")
        .order_by(
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

    snapshot = _build_inventory_snapshot(expiry_soon_days, low_stock_threshold)
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

    try:
        supplier = Supplier.objects.get(pk=supplier_id)
    except Supplier.DoesNotExist as exc:
        raise ValueError("Supplier not found.") from exc

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

        try:
            medicine = Medicine.objects.get(pk=medicine_id, is_active=True)
        except Medicine.DoesNotExist as exc:
            raise ValueError(f"{prefix}: medicine not found.") from exc

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
        batch, created = Batches.objects.get_or_create(
            batch_number=item.batch_number,
            defaults={
                "product_id": item.medicine,
                "expiry_date": item.expiry_date,
                "manufacturing_date": item.manufacturing_date,
                "quantity": item.quantity,
                "purchase_price": item.unit_price,
                "supplier_id": supplier,
            },
        )

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

        inventory_row, inventory_created = Inventory.objects.get_or_create(
            medicine=item.medicine,
            batch_number=item.batch_number,
            defaults={
                "quantity": item.quantity,
                "expiry_date": item.expiry_date,
                "location": "Main Store",
            },
        )

        if not inventory_created:
            inventory_row.quantity += item.quantity
            inventory_row.expiry_date = item.expiry_date
            inventory_row.save()

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
            quantity=item.quantity,
            unit_price=item.unit_price,
            reference_document=stock_entry.invoice_number,
            notes=item.notes
            or f"Stock IN via stock entry {stock_entry.posting_number}",
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

    reversed_items = []

    for item in posted_items:
        if not item.batch_id or not item.batch:
            raise ValueError(f"Batch link is missing for item '{item.medicine.name}'.")

        batch = item.batch
        if batch.quantity < item.quantity:
            raise ValueError(
                f"Cannot cancel stock entry because batch {batch.batch_number} "
                "does not have enough quantity left."
            )

        batch.quantity -= item.quantity
        batch.save(update_fields=["quantity"])

        try:
            inventory_row = Inventory.objects.get(
                medicine=item.medicine,
                batch_number=item.batch_number,
            )
        except Inventory.DoesNotExist as exc:
            raise ValueError(
                f"Inventory record is missing for batch {item.batch_number}."
            ) from exc

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

    if not invoice_number:
        raise ValueError("Invoice number is required.")

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

        try:
            medicine = Medicine.objects.get(pk=medicine_id, is_active=True)
        except Medicine.DoesNotExist as exc:
            raise ValueError(f"{prefix}: medicine not found.") from exc

        quantity = _parse_positive_int(item.get("quantity"), f"{prefix} quantity")
        unit_price = _parse_decimal(
            item.get("unit_price") or medicine.selling_price,
            f"{prefix} unit price",
        )

        if batch_id:
            try:
                batch = Batches.objects.get(
                    pk=batch_id,
                    product_id=medicine,
                    quantity__gt=0,
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
        fifo_batches = list(
            Batches.objects.filter(
                product_id=medicine,
                quantity__gt=0,
                expiry_date__gt=timezone.localdate(),
            ).order_by(
                "created_at", "manufacturing_date", "expiry_date", "batch_number"
            )
        )

        if not fifo_batches:
            raise ValueError(
                f"{prefix}: no sellable batches are available for {medicine.name}."
            )

        available_quantity = sum(batch.quantity for batch in fifo_batches)
        if available_quantity < quantity:
            raise ValueError(
                f"{prefix}: only {available_quantity} units are available for {medicine.name}."
            )

        for batch in fifo_batches:
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

    for item in sale_items:
        if not item.batch_id or not item.batch:
            raise ValueError(f"Batch allocation is missing for '{item.medicine.name}'.")

        batch = item.batch
        if batch.quantity < item.quantity:
            raise ValueError(
                f"Batch {batch.batch_number} no longer has enough stock to complete this sale."
            )

        batch.quantity -= item.quantity
        batch.save(update_fields=["quantity"])

        try:
            inventory_row = Inventory.objects.get(
                medicine=item.medicine,
                batch_number=batch.batch_number,
            )
        except Inventory.DoesNotExist as exc:
            raise ValueError(
                f"Inventory record is missing for batch {batch.batch_number}."
            ) from exc

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
            quantity=-item.quantity,
            unit_price=item.price_at_sale,
            reference_document=sale.invoice_number,
            notes=f"Stock OUT via sale {sale.posting_number}",
        )

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

    for item in sale_items:
        if not item.batch_id or not item.batch:
            raise ValueError(f"Batch allocation is missing for '{item.medicine.name}'.")

        batch = item.batch
        batch.quantity += item.quantity
        batch.save(update_fields=["quantity"])

        inventory_row, created = Inventory.objects.get_or_create(
            medicine=item.medicine,
            batch_number=batch.batch_number,
            defaults={
                "quantity": item.quantity,
                "expiry_date": batch.expiry_date,
                "location": "Main Store",
            },
        )

        if not created:
            inventory_row.quantity += item.quantity
            inventory_row.expiry_date = batch.expiry_date
            inventory_row.save(update_fields=["quantity", "expiry_date", "updated_at"])

        StockLedger.objects.create(
            medicine=item.medicine,
            batch=batch,
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def medicines_list(request):

    page_size = int(request.GET.get("page_size", 10))
    page = int(request.GET.get("page", 1))
    search = request.GET.get("search", "")
    category = request.GET.get("category", "")
    supplier = request.GET.get("supplier", "")
    status = request.GET.get("status", "")

    # 🔑 Unique cache key per filter combination
    raw_key = f"medicines:{page}:{page_size}:{search}:{category}:{supplier}:{status}"
    cache_key = hashlib.md5(raw_key.encode()).hexdigest()

    cached_response = cache.get(cache_key)
    if cached_response:
        return JsonResponse(cached_response)

    queryset = Medicine.objects.filter(is_active=True).select_related(
        "category", "supplier"
    )

    if search:
        queryset = queryset.filter(
            Q(name__icontains=search)
            | Q(generic_name__icontains=search)
            | Q(barcode__icontains=search)
        )

    if category:
        queryset = queryset.filter(category_id=category)

    if supplier:
        queryset = queryset.filter(supplier_id=supplier)
    if status:
        queryset = queryset.filter(status=status)

    queryset = queryset.order_by("-created_at")

    paginator = Paginator(queryset, page_size)

    try:
        medicines_page = paginator.page(page)
    except EmptyPage:
        medicines_page = paginator.page(1)

    medicines_data = [
        {
            "id": medicine.id,
            "name": medicine.name,
            "generic_name": medicine.generic_name,
            "category": medicine.category.name if medicine.category else "",
            "category_id": medicine.category_id,
            "supplier": medicine.supplier.name if medicine.supplier else "",
            "cost_price": str(medicine.cost_price),
            "selling_price": str(medicine.selling_price),
            "barcode": medicine.barcode,
            "naming_series": medicine.naming_series,
            "description": medicine.description,
            "status": medicine.status,
            "is_active": medicine.is_active,
            "created_at": medicine.created_at.isoformat(),
        }
        for medicine in medicines_page
    ]

    response_data = {
        "results": medicines_data,
        "count": paginator.count,
        "total_pages": paginator.num_pages,
        "current_page": medicines_page.number,
        "page_size": page_size,
        "has_next": medicines_page.has_next(),
        "has_previous": medicines_page.has_previous(),
    }

    # Cache for 60 seconds only (ERP safety)
    cache.set(cache_key, response_data, timeout=60)

    return JsonResponse(response_data)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def medicines_update(request, medicine_id):
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def medicine_categories_list(request):
    page_size = int(request.GET.get("page_size", 5))
    page = int(request.GET.get("page", 1))

    # Get filter parameters
    search = request.GET.get("search", "")

    cache_key = f"categories:{page}:{page_size}:{search}"
    cached_response = cache.get(cache_key)
    if cached_response:
        return JsonResponse(cached_response)

    # Build queryset
    queryset = Category.objects.all()

    # Apply filters
    if search:
        queryset = queryset.filter(
            Q(name__icontains=search) | Q(description__icontains=search)
        )

    # Order by creation date (newest first)
    queryset = queryset.order_by("-created_at")

    # Create paginator
    paginator = Paginator(queryset, page_size)

    try:
        categories_page = paginator.page(page)
    except EmptyPage:
        categories_page = paginator.page(1)

    # Serialize data
    categories_data = []
    for category in categories_page:
        categories_data.append(
            {
                "id": category.id,
                "name": category.name,
                "description": category.description,
                "created_at": category.created_at.isoformat(),
            }
        )

    response_data = {
        "results": categories_data,
        "count": paginator.count,
        "total_pages": paginator.num_pages,
        "current_page": categories_page.number,
        "page_size": page_size,
        "has_next": categories_page.has_next(),
        "has_previous": categories_page.has_previous(),
    }

    # Cache for 5 minutes (ERP safety)
    cache.set(cache_key, response_data, timeout=300)

    return JsonResponse(response_data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def medicine_detail_by_naming_series(request, naming_series):
    """
    Get medicine details by naming_series for routing.
    This endpoint is optimized for performance by using the indexed naming_series field.
    """
    try:
        # Use the indexed naming_series field for fast lookup
        medicine = Medicine.objects.get(naming_series=naming_series, is_active=True)
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stock_out_batches(request):
    medicine_id = request.GET.get("medicine_id")

    queryset = Batches.objects.filter(
        quantity__gt=0,
        expiry_date__gt=timezone.localdate(),
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
def medicines_delete(request, medicine_id):
    try:
        medicine = Medicine.objects.get(id=medicine_id)
    except Medicine.DoesNotExist:
        return JsonResponse({"error": "Medicine not found"}, status=404)
    medicine.delete()
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
