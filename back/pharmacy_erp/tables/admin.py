from django.contrib import admin

# Register your models here.
from .models import Category, Medicine, Inventory, Purchase, PurchaseItem, Sale, SaleItem, Supplier, InventoryHub

admin.site.register(Category)
admin.site.register(Medicine)
admin.site.register(Inventory)
admin.site.register(Purchase)
admin.site.register(PurchaseItem)
admin.site.register(Sale)
admin.site.register(SaleItem)
admin.site.register(Supplier)
admin.site.register(InventoryHub)