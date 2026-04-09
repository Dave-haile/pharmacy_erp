# pharmacy/models/cost_layer.py

from django.db import models


class CostLayer(models.Model):
    """
    Represents a layer of inventory at a specific cost.
    Each purchase/stock entry creates a new cost layer.
    When stock is sold/consumed, layers are depleted based on costing method.
    """

    # Costing method choices
    METHOD_FIFO = "fifo"
    METHOD_LIFO = "lifo"
    METHOD_FEFO = "fefo"  # First Expired First Out (pharmacy-specific)
    METHOD_AVERAGE = "average"

    METHOD_CHOICES = [
        (METHOD_FIFO, "FIFO (First In, First Out)"),
        (METHOD_LIFO, "LIFO (Last In, First Out)"),
        (METHOD_FEFO, "FEFO (First Expired First Out)"),
        (METHOD_AVERAGE, "Average Cost"),
    ]

    medicine = models.ForeignKey(
        "Medicine",
        on_delete=models.CASCADE,
        related_name="cost_layers",
        db_index=True,
    )

    inventory = models.ForeignKey(
        "Inventory",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="cost_layers",
        help_text="Link to the physical inventory/batch record",
    )

    # Cost information
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    original_quantity = models.PositiveIntegerField()
    remaining_quantity = models.PositiveIntegerField()

    # For ordering (FIFO/LIFO)
    sequence_number = models.PositiveIntegerField(db_index=True)

    # For FEFO - expiry date for ordering
    expiry_date = models.DateField(null=True, blank=True, db_index=True)

    # Source tracking
    stock_entry_item = models.ForeignKey(
        "StockEntryItem",
        on_delete=models.PROTECT,
        related_name="cost_layers",
        null=True,
        blank=True,
    )

    # Metadata
    received_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True, db_index=True)

    def __str__(self):
        return f"{self.medicine.name} - Layer {self.sequence_number} - {self.remaining_quantity}/{self.original_quantity} @ ${self.unit_cost}"

    @property
    def total_value(self):
        return self.remaining_quantity * self.unit_cost

    class Meta:
        db_table = "CostLayer"
        verbose_name_plural = "Cost Layers"
        ordering = ["medicine", "sequence_number"]
        indexes = [
            models.Index(fields=["medicine", "remaining_quantity", "sequence_number"]),
            models.Index(fields=["medicine", "remaining_quantity", "expiry_date"]),
        ]
