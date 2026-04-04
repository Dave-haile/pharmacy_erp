from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.shortcuts import redirect
from django.urls import include, path

urlpatterns = [
    # redirect to admin
    path("", lambda request: redirect("admin/")),
    path("admin/", admin.site.urls),
    path("api/inventory/", include("inventory.urls")),
    path("api/hr/", include("hr.urls")),
    path("api/", include("auth.urls")),
    # path("api/dashboard/stats/", dashboard_stats),
    # path("api/inventory/", include("inventory.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
