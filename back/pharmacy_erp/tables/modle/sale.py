# pharmacy/models/sale.py

from django.db import models
from django.conf import settings

class Sale(models.Model):
    cashier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT
    )

    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=50)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Sale #{self.id}"

    class Meta:
        db_table = 'Sale'
        verbose_name_plural = 'Sales'
        indexes = [
            models.Index(fields=['cashier', 'created_at']),
        ]
