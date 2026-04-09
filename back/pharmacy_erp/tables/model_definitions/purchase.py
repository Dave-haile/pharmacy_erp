# pharmacy/models/purchase.py

from django.db import models
from django.conf import settings
from .supplier import Supplier

class Purchase(models.Model):
    status = models.CharField(max_length=20, choices=[('draft', 'Draft'), ('ordered', 'Ordered'), ('partially_received', 'Partially Received'), ('completed', 'Completed'), ('cancelled', 'Cancelled')], default='draft')
    print = models.ForeignKey(
        "tables.PrintFormat",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchases",
    )
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.PROTECT,
        related_name="purchases"
    )

    received_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)

    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Purchase #{self.id} - {self.supplier.name}"
    
    class Meta:
        db_table = 'Purchase'
        verbose_name_plural = 'Purchases'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['supplier', 'created_at', 'received_by']),
        ]
