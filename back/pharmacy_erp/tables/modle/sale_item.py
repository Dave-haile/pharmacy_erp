# pharmacy/models/sale_item.py

from django.db import models
from .sale import Sale
from .medicine import Medicine

class SaleItem(models.Model):
    sale = models.ForeignKey(
        Sale,
        on_delete=models.CASCADE,
        related_name="items"
    )

    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.PROTECT
    )

    quantity = models.PositiveIntegerField()
    price_at_sale = models.DecimalField(max_digits=10, decimal_places=2)

    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.medicine.name} x {self.quantity}"

    class Meta:
        db_table = 'SaleItem'
        verbose_name_plural = 'Sale Items'
