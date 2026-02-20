
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/inventory/", include("inventory.urls")),
    path("api/", include("auth.urls")),
    # path("api/dashboard/stats/", dashboard_stats),
    # path("api/inventory/", include("inventory.urls")),
]