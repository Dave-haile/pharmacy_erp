from django.db import models

class InventoryHub(models.Model):
    label = models.CharField(max_length=100)
    path = models.CharField(max_length=100)
    highlighted = models.BooleanField(default=False)
    color = models.CharField(max_length=100)

    def __str__(self):
        return self.label
    class Meta:
        db_table = 'InventoryHub'  # Specify the table name
        verbose_name_plural = "Inventory Hubs"

# [
#         { label: 'Inventory Control', path: '/inventory/control', highlighted: true },
#         { label: 'Item Master', path: '/inventory/item-master', highlighted: true },
#         { label: 'Item Grouping', path: '/inventory/item-grouping', highlighted: true },
#         { label: 'Product Bundles', path: '#', highlighted: true },
#         { label: 'Global Price List', path: '#' },
#         { label: 'SKU Pricing', path: '#' },
#         { label: 'Shipping Rules', path: '#' },
#         { label: 'Item Alternatives', path: '#' },
#         { label: 'Manufacturer Registry', path: '#' },
#         { label: 'Customs Tariff Database', path: '#' },
#       ]