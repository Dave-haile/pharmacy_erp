# pharmacy/models/sale_item.py

from django.db import models

from .batches import Batches
from .medicine import Medicine
from .sale import Sale


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="items")

    medicine = models.ForeignKey(Medicine, on_delete=models.PROTECT)

    quantity = models.PositiveIntegerField()
    batch = models.ForeignKey(
        "Batches",
        on_delete=models.PROTECT,
        related_name="sale_items",
        null=True,
        blank=True,
    )
    price_at_sale = models.DecimalField(max_digits=10, decimal_places=2)

    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    # NEW: Cost tracking fields
    calculated_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Total cost of goods sold (COGS)"
    )
    unit_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Average unit cost based on costing method"
    )
    cost_layers_used = models.JSONField(
        default=list,
        help_text="Which cost layers were consumed: [{layer_id, quantity, unit_cost}, ...]"
    )
    costing_method = models.CharField(
        max_length=20,
        choices=Medicine.COSTING_METHOD_CHOICES,
        default='fifo',
        help_text="Costing method used for this transaction"
    )

    # Profit tracking
    @property
    def gross_profit(self):
        return self.subtotal - self.calculated_cost

    @property
    def profit_margin(self):
        if self.subtotal > 0:
            return (self.gross_profit / self.subtotal) * 100
        return 0

    def __str__(self):
        return f"{self.medicine.name} x {self.quantity}"

    class Meta:
        db_table = "SaleItem"
        verbose_name_plural = "Sale Items"
        indexes = [
            models.Index(fields=["sale", "medicine", "batch"]),
        ]
