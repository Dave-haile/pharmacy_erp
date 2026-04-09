from django.db import models


class SalesReturnItem(models.Model):
    sales_return = models.ForeignKey(
        "salesreturn",
        on_delete=models.CASCADE,
        related_name="items",
    )
    medicine = models.ForeignKey("medicine", on_delete=models.PROTECT)
    batch = models.ForeignKey("batches", on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # NEW: Cost tracking for returns
    original_sale_item = models.ForeignKey(
        "SaleItem",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="returns",
        help_text="Link to the original sale item (for cost tracking)"
    )
    cost_to_restore = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Cost value being restored to inventory"
    )
    cost_layers_restored = models.JSONField(
        default=list,
        help_text="New cost layers created from this return"
    )

    class Meta:
        db_table = "SalesReturnItem"
        verbose_name_plural = "Sales Return Items"
        indexes = [
            models.Index(fields=["sales_return", "medicine"]),
        ]

