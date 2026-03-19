import hashlib
import json
from decimal import Decimal, InvalidOperation

from django.core.cache import cache
from django.core.paginator import EmptyPage, Paginator
from django.db import transaction
from django.db.models import Count, Q, Sum, Value
from django.db.models.functions import Coalesce
from django.http import JsonResponse
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
    StockEntry,
    StockEntryItem,
    StockLedger,
    Supplier,
)
from tables.modle.user_log import UserLog


class DashboardStatsView:
    pass


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


def inventory_list(request):
    return JsonResponse({"message": "Inventory list"})


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
                "batch_number": item.batch_number,
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
    search = request.GET.get("search", "")

    cache_key = f"suppliers:{page}:{page_size}:{search}"
    cached_response = cache.get(cache_key)
    if cached_response:
        return JsonResponse(cached_response)

    queryset = Supplier.objects.all()
    if search:
        queryset = queryset.filter(
            Q(name__icontains=search)
            | Q(contact_person__icontains=search)
            | Q(phone__icontains=search)
            | Q(email__icontains=search)
            | Q(address__icontains=search)
        )
    queryset = queryset.order_by("-created_at")
    paginator = Paginator(queryset, page_size)
    try:
        suppliers_page = paginator.page(page)
    except EmptyPage:
        suppliers_page = paginator.page(1)
    suppliers_data = [
        {
            "id": supplier.id,
            "name": supplier.name,
            "contact_person": supplier.contact_person,
            "phone": supplier.phone,
            "email": supplier.email,
            "address": supplier.address,
            "created_at": supplier.created_at.isoformat(),
        }
        for supplier in suppliers_page
    ]
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def medicine_logs(request, medicine_id: int):
    """
    Return user logs related to a medicine.

    Note: logs store medicine_id inside the JSON "details" string.
    We filter using a simple contains query to avoid schema changes.

    """
    try:
        needle = f'"medicine_id": {medicine_id}'
        queryset = (
            UserLog.objects.select_related("user")
            .filter(details__contains=needle)
            .order_by("-timestamp")
        )[:5]

        data = [
            {
                "log_id": log.log_id,
                "action": log.action,
                "timestamp": log.timestamp.isoformat(),
                "details": log.details,
                "user_id": log.user_id,
                "username": getattr(log.user, "username", None),
            }
            for log in queryset
        ]

        return JsonResponse({"results": data})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


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

    if stock_entry.status != StockEntry.STATUS_DRAFT:
        return JsonResponse(
            {"error": "Only draft stock entries can be edited."},
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
            stock_entry.save()

            _replace_stock_entry_items(stock_entry, normalized["items"])

            UserLog.objects.create(
                user=request.user,
                action="Stock Entry Draft Updated",
                details=json.dumps(
                    {
                        "stock_entry_id": stock_entry.id,
                        "posting_number": stock_entry.posting_number,
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
            "message": "Stock entry draft updated successfully.",
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

            stock_entry.status = StockEntry.STATUS_POSTED
            stock_entry.save(update_fields=["status", "updated_at"])

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
