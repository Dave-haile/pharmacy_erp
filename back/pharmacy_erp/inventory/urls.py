from django.urls import path
from .views import dashboard_summary, medicines_list, medicine_categories_list, medicine_detail, medicine_detail_by_naming_series, supplier_list, medicines_create, medicines_update

urlpatterns = [
    path("dashboard/stats/", dashboard_summary),
    path("medicines/", medicines_list),
    path("medicines/create/", medicines_create),
    path("medicines/update/<int:medicine_id>/", medicines_update),
    path("medicine-categories/", medicine_categories_list),
    path("medicines/<int:medicine_id>/", medicine_detail),
    path("medicines/by-naming-series/<str:naming_series>/", medicine_detail_by_naming_series),
    path('medicines/supplier/', supplier_list),
]