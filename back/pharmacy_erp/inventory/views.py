import hashlib
import json
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.core.paginator import Paginator, EmptyPage
from django.db.models import Q
from django.db import transaction

from tables.modle.user_log import UserLog
from tables.modle import Sale
from tables.modle import Medicine
from tables.modle import Category
from tables.modle import Supplier
from django.core.cache import cache
from django.db.models import Sum
from django.http import JsonResponse

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

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def medicines_list(request):

    page_size = int(request.GET.get('page_size', 10))
    page = int(request.GET.get('page', 1))
    search = request.GET.get('search', '')
    category = request.GET.get('category', '')
    supplier = request.GET.get('supplier', '')

    # 🔑 Unique cache key per filter combination
    raw_key = f"medicines:{page}:{page_size}:{search}:{category}:{supplier}"
    cache_key = hashlib.md5(raw_key.encode()).hexdigest()

    cached_response = cache.get(cache_key)
    if cached_response:
        return JsonResponse(cached_response)

    queryset = (
        Medicine.objects
        .filter(is_active=True)
        .select_related("category", "supplier")
    )

    if search:
        queryset = queryset.filter(
            Q(name__icontains=search) |
            Q(generic_name__icontains=search) |
            Q(barcode__icontains=search)
        )

    if category:
        queryset = queryset.filter(category_id=category)

    if supplier:
        queryset = queryset.filter(supplier_id=supplier)

    queryset = queryset.order_by('-created_at')

    paginator = Paginator(queryset, page_size)

    try:
        medicines_page = paginator.page(page)
    except EmptyPage:
        medicines_page = paginator.page(1)

    medicines_data = [
        {
            'id': medicine.id,
            'name': medicine.name,
            'generic_name': medicine.generic_name,
            'category': medicine.category.name if medicine.category else '',
            'category_id': medicine.category_id,
            'supplier': medicine.supplier.name if medicine.supplier else '',
            'cost_price': str(medicine.cost_price),
            'selling_price': str(medicine.selling_price),
            'barcode': medicine.barcode,
            'naming_series': medicine.naming_series,
            'description': medicine.description,
            'status': medicine.status,
            'is_active': medicine.is_active,
            'created_at': medicine.created_at.isoformat(),
        }
        for medicine in medicines_page
    ]

    response_data = {
        'results': medicines_data,
        'count': paginator.count,
        'total_pages': paginator.num_pages,
        'current_page': medicines_page.number,
        'page_size': page_size,
        'has_next': medicines_page.has_next(),
        'has_previous': medicines_page.has_previous(),
    }

    # Cache for 60 seconds only (ERP safety)
    cache.set(cache_key, response_data, timeout=60)

    return JsonResponse(response_data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def medicines_update(request, medicine_id):
    try:
        try:
            medicine = Medicine.objects.get(id=medicine_id)
        except Medicine.DoesNotExist:
            return JsonResponse({'error': 'Medicine not found'}, status=404)

        medicine_data = request.data

        # Capture original values for change tracking
        original = {
            'name': medicine.name,
            'generic_name': medicine.generic_name,
            'barcode': medicine.barcode,
            'category_id': medicine.category_id,
            'supplier_id': medicine.supplier_id,
            'cost_price': str(medicine.cost_price),
            'selling_price': str(medicine.selling_price),
            'status': getattr(medicine, 'status', None),
            'description': medicine.description,
            'is_active': medicine.is_active,
        }

        with transaction.atomic():
            # Core fields
            if 'name' in medicine_data:
                medicine.name = medicine_data.get('name', medicine.name)
            if 'generic_name' in medicine_data:
                medicine.generic_name = medicine_data.get('generic_name', medicine.generic_name)
            if 'barcode' in medicine_data:
                medicine.barcode = medicine_data.get('barcode', medicine.barcode)

            # Keep category required, but allow leaving it unchanged if not provided
            if 'category_id' in medicine_data:
                category_id = medicine_data.get('category_id')
                if category_id is not None:
                    medicine.category_id = category_id

            if 'supplier_id' in medicine_data:
                supplier_id = medicine_data.get('supplier_id')
                medicine.supplier_id = supplier_id

            if 'cost_price' in medicine_data:
                cost_price = medicine_data.get('cost_price')
                if cost_price is not None:
                    medicine.cost_price = cost_price

            if 'selling_price' in medicine_data:
                selling_price = medicine_data.get('selling_price')
                if selling_price is not None:
                    medicine.selling_price = selling_price

            if 'description' in medicine_data:
                medicine.description = medicine_data.get('description') or ''

            if 'is_active' in medicine_data:
                medicine.is_active = bool(medicine_data.get('is_active'))

            if 'status' in medicine_data:
                medicine.status = medicine_data.get('status') or medicine.status

            medicine.save()

            # Build change set for logging
            updated = {
                'name': medicine.name,
                'generic_name': medicine.generic_name,
                'barcode': medicine.barcode,
                'category_id': medicine.category_id,
                'supplier_id': medicine.supplier_id,
                'cost_price': str(medicine.cost_price),
                'selling_price': str(medicine.selling_price),
                'status': getattr(medicine, 'status', None),
                'description': medicine.description,
                'is_active': medicine.is_active,
            }

            changes = {}
            for field, old_value in original.items():
                new_value = updated[field]
                if old_value != new_value:
                    changes[field] = {
                        'from': old_value,
                        'to': new_value,
                    }

            UserLog.objects.create(
                user=request.user,
                action='Medicine Updated',
                details=json.dumps(
                    {
                        'medicine_id': medicine.id,
                        'naming_series': medicine.naming_series,
                        'changes': changes,
                    },
                    default=str,
                ),
            )

        return JsonResponse({
            'message': 'Medicine updated successfully',
            'medicine': {
                'id': medicine.id,
                'name': medicine.name,
                'generic_name': medicine.generic_name,
                'barcode': medicine.barcode,
                'naming_series': medicine.naming_series,
                'category_id': medicine.category_id,
                'supplier_id': medicine.supplier_id,
                'cost_price': medicine.cost_price,
                'selling_price': medicine.selling_price,
                'status': medicine.status,
                'description': medicine.description,
                'is_active': medicine.is_active,
                'created_at': medicine.created_at.isoformat(),
            }
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def medicines_create(request):
    try:
        medicine_data = request.data
        with transaction.atomic():
            medicine = Medicine(
                name=medicine_data.get('name'),
                generic_name=medicine_data.get('generic_name'),
                barcode=medicine_data.get('barcode'),
                category_id=medicine_data.get('category_id'),
                supplier_id=medicine_data.get('supplier_id'),
                cost_price=medicine_data.get('cost_price'),
                selling_price=medicine_data.get('selling_price'),
                description=medicine_data.get('description'),
                is_active=medicine_data.get('is_active', True)  # Default to True if not provided
            )
            medicine.save()

            UserLog.objects.create(
                user=request.user,
                action='Medicine Created',
                details=json.dumps(
                    {
                        'medicine_id': medicine.id,
                        'naming_series': medicine.naming_series,
                        'name': medicine.name,
                        'generic_name': medicine.generic_name,
                        'barcode': medicine.barcode,
                        'category_id': medicine.category_id,
                        'supplier_id': medicine.supplier_id,
                    },
                    default=str,
                ),
            )
        
        return JsonResponse({
            'message': 'Medicine created successfully',
            'medicine': {
                'id': medicine.id,
                'name': medicine.name,
                'generic_name': medicine.generic_name,
                'barcode': medicine.barcode,
                'naming_series': medicine.naming_series,
                'category_id': medicine.category_id,
                'supplier_id': medicine.supplier_id,
                'cost_price': medicine.cost_price,
                'selling_price': medicine.selling_price,
                'status': medicine.status,
                'description': medicine.description,
                'is_active': medicine.is_active,
                'created_at': medicine.created_at.isoformat(),
            }
        }, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def medicine_categories_list(request):
    page_size = int(request.GET.get('page_size', 5))
    page = int(request.GET.get('page', 1))
    
    # Get filter parameters
    search = request.GET.get('search', '')

    cache_key = f"categories:{page}:{page_size}:{search}"
    cached_response = cache.get(cache_key)
    if cached_response:
        return JsonResponse(cached_response)

    # Build queryset
    queryset = Category.objects.all()
    
    # Apply filters
    if search:
        queryset = queryset.filter(
            Q(name__icontains=search) | 
            Q(description__icontains=search)
        )
    
    # Order by creation date (newest first)
    queryset = queryset.order_by('-created_at')
    
    # Create paginator
    paginator = Paginator(queryset, page_size)
    
    try:
        categories_page = paginator.page(page)
    except EmptyPage:
        categories_page = paginator.page(1)
    
    # Serialize data
    categories_data = []
    for category in categories_page:
        categories_data.append({
            'id': category.id,
            'name': category.name,
            'description': category.description,
            'created_at': category.created_at.isoformat(),
        })
    
    response_data = {
        'results': categories_data,
        'count': paginator.count,
        'total_pages': paginator.num_pages,
        'current_page': categories_page.number,
        'page_size': page_size,
        'has_next': categories_page.has_next(),
        'has_previous': categories_page.has_previous(),
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
        return JsonResponse({'error': 'Medicine not found'}, status=404)
    
    return JsonResponse({
        'id': medicine.id,
        'name': medicine.name,
        'generic_name': medicine.generic_name,
        'category': medicine.category.name if medicine.category else '',
        'category_id': medicine.category_id,
        'supplier': medicine.supplier.name if medicine.supplier else '',
        'supplier_id': medicine.supplier_id,
        'cost_price': str(medicine.cost_price),
        'selling_price': str(medicine.selling_price),
        'barcode': medicine.barcode,
        'naming_series': medicine.naming_series,
        'description': medicine.description,
        'is_active': medicine.is_active,
        'status': medicine.status,
        'created_at': medicine.created_at.isoformat(),
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def medicine_detail(request, medicine_id):
    try:
        medicine = Medicine.objects.get(id=medicine_id)
    except Medicine.DoesNotExist:
        return JsonResponse({'error': 'Medicine not found'}, status=404)
    
    return JsonResponse({
        'id': medicine.id,
        'name': medicine.name,
        'generic_name': medicine.generic_name,
        'category': medicine.category.name if medicine.category else '',
        'category_id': medicine.category_id,
        'supplier': medicine.supplier.name if medicine.supplier else '',
        'cost_price': str(medicine.cost_price),
        'selling_price': str(medicine.selling_price),
        'barcode': medicine.barcode,
        'naming_series': medicine.naming_series,
        'description': medicine.description,
        'is_active': medicine.is_active,
        'created_at': medicine.created_at.isoformat(),
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def supplier_list(request):
    page_size = int(request.GET.get('page_size', 10))
    page = int(request.GET.get('page', 1))
    search = request.GET.get('search', '')

    cache_key = f"suppliers:{page}:{page_size}:{search}"
    cached_response = cache.get(cache_key)
    if cached_response:
        return JsonResponse(cached_response)

    queryset = Supplier.objects.all()
    if search:
        queryset = queryset.filter(
            Q(name__icontains=search) |
            Q(contact_person__icontains=search) |
            Q(phone__icontains=search) |
            Q(email__icontains=search) |
            Q(address__icontains=search)
        )
    queryset = queryset.order_by('-created_at')
    paginator = Paginator(queryset, page_size)
    try:
        suppliers_page = paginator.page(page)
    except EmptyPage:
        suppliers_page = paginator.page(1)
    suppliers_data = [
        {
            'id': supplier.id,
            'name': supplier.name,
            'contact_person': supplier.contact_person,
            'phone': supplier.phone,
            'email': supplier.email,
            'address': supplier.address,
            'created_at': supplier.created_at.isoformat(),
        }
        for supplier in suppliers_page
    ]
    response_data = {
        'results': suppliers_data,
        'count': paginator.count,
        'total_pages': paginator.num_pages,
        'current_page': suppliers_page.number,
        'page_size': page_size,
        'has_next': suppliers_page.has_next(),
        'has_previous': suppliers_page.has_previous(),
    }
    cache.set(cache_key, response_data, timeout=300)
    return JsonResponse(response_data)
