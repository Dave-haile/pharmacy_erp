from django.urls import path
from .views import dashboard_stats, inventory_list

urlpatterns = [
    path("dashboard/stats/", dashboard_stats),
    path("", inventory_list),
]