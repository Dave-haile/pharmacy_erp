from django.urls import path
from .views import dashboard_stats, medicines_list, medicine_categories_list

urlpatterns = [
    path("dashboard/stats/", dashboard_stats),
    # path("", inventory_list),
    path("medicines/", medicines_list),
    path("medicine-categories/", medicine_categories_list),
]