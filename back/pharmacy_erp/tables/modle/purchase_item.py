# pharmacy/models/purchase_item.py

from django.db import models
from .purchase import Purchase
from .medicine import Medicine

class PurchaseItem(models.Model):
    purchase = models.ForeignKey(
        Purchase,
        on_delete=models.CASCADE,
        related_name="items"
    )

    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.PROTECT
    )

    quantity = models.PositiveIntegerField()
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)

    batch = models.ForeignKey('batches', on_delete=models.SET_NULL, null=True)
    expiry_date = models.DateField()

    def __str__(self):
        return f"{self.medicine.name} x {self.quantity}"

    class Meta:
        db_table = 'PurchaseItem'
        verbose_name_plural = 'Purchase Items'
        indexes = [
            models.Index(fields=['purchase', 'medicine']),
        ]
