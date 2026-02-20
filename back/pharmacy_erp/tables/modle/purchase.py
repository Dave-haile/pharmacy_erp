# pharmacy/models/purchase.py

from django.db import models
from django.conf import settings
from .supplier import Supplier

class Purchase(models.Model):
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.PROTECT,
        related_name="purchases"
    )

    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT
    )

    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Purchase #{self.id}"
    
    class Meta:
        db_table = 'Purchase'
        verbose_name_plural = 'Purchases'
