from django.db import models


class SupplierReturnItem(models.Model):
    supplier_return = models.ForeignKey(
        "supplierreturn",
        on_delete=models.CASCADE,
        related_name="items",
    )
    medicine = models.ForeignKey("medicine", on_delete=models.PROTECT)
    batch = models.ForeignKey("batches", on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # NEW: Cost tracking for supplier returns
    cost_layers_reversed = models.JSONField(
        default=list,
        help_text="Cost layers that were reversed/removed"
    )
    total_cost_reversed = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Total cost value removed from inventory"
    )
    linked_stock_entry_item = models.ForeignKey(
        "StockEntryItem",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="supplier_returns",
        help_text="Link to the original stock entry (for cost tracking)"
    )

    class Meta:
        db_table = "SupplierReturnItem"
        verbose_name_plural = "Supplier Return Items"
        indexes = [
            models.Index(fields=["supplier_return", "medicine"]),
        ]

