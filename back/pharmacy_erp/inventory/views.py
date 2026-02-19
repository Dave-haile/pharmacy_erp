from django.http import JsonResponse

# Create your views here.
class DashboardStatsView:
    pass

def dashboard_stats(request):
    return JsonResponse({"message": "Dashboard stats"})
def inventory_list(request):
    return JsonResponse({"message": "Inventory list"})