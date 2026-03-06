from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect

urlpatterns = [
    # redirect to admin
    path('', lambda request: redirect('admin/')),
    path('admin/', admin.site.urls),
    path("api/inventory/", include("inventory.urls")),
    path("api/", include("auth.urls")),
    # path("api/dashboard/stats/", dashboard_stats),
    # path("api/inventory/", include("inventory.urls")),
]