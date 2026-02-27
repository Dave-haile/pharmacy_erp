from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.core.paginator import Paginator, EmptyPage
from django.db.models import Q

from tables.modle import Medicine
from tables.modle import Category

class DashboardStatsView:
    pass

def dashboard_stats(request):
    return JsonResponse({"message": "Dashboard stats"})

def inventory_list(request):
    return JsonResponse({"message": "Inventory list"})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def medicines_list(request):
    # Get pagination parameters
    page_size = int(request.GET.get('page_size', 10))
    page = int(request.GET.get('page', 1))
    
    # Get filter parameters
    search = request.GET.get('search', '')
    category = request.GET.get('category', '')
    
    # Build queryset
    queryset = Medicine.objects.filter(is_active=True)
    
    # Apply filters
    if search:
        queryset = queryset.filter(
            Q(name__icontains=search) | 
            Q(generic_name__icontains=search) |
            Q(barcode__icontains=search)
        )
    
    if category:
        queryset = queryset.filter(category_id=category)
    
    # Order by creation date (newest first)
    queryset = queryset.order_by('-created_at')
    
    # Create paginator
    paginator = Paginator(queryset, page_size)
    
    try:
        medicines_page = paginator.page(page)
    except EmptyPage:
        medicines_page = paginator.page(1)
    
    # Serialize data
    medicines_data = []
    for medicine in medicines_page:
        medicines_data.append({
            'id': medicine.id,
            'name': medicine.name,
            'generic_name': medicine.generic_name,
            'category': medicine.category.name if medicine.category else '',
            'supplier': medicine.supplier.name if medicine.supplier else '',
            'cost_price': str(medicine.cost_price),
            'selling_price': str(medicine.selling_price),
            'barcode': medicine.barcode,
            'description': medicine.description,
            'is_active': medicine.is_active,
            'created_at': medicine.created_at.isoformat(),
        })
    
    return JsonResponse({
        'results': medicines_data,
        'count': paginator.count,
        'total_pages': paginator.num_pages,
        'current_page': medicines_page.number,
        'page_size': page_size,
        'has_next': medicines_page.has_next(),
        'has_previous': medicines_page.has_previous(),
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def medicine_categories_list(request):
    page_size = int(request.GET.get('page_size', 5))
    page = int(request.GET.get('page', 1))
    
    # Get filter parameters
    search = request.GET.get('search', '')
    
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
    
    return JsonResponse({
        'results': categories_data,
        'count': paginator.count,
        'total_pages': paginator.num_pages,
        'current_page': categories_page.number,
        'page_size': page_size,
        'has_next': categories_page.has_next(),
        'has_previous': categories_page.has_previous(),
    })