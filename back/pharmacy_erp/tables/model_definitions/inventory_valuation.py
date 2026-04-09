# pharmacy/models/inventory_valuation.py

from django.db import models


class InventoryValuation(models.Model):
    """
    Tracks current valuation of each medicine based on costing method.
    Updated whenever stock moves.
    """

    medicine = models.OneToOneField(
        "Medicine",
        on_delete=models.CASCADE,
        related_name="valuation",
        db_index=True,
    )

    # Current stock levels
    total_quantity = models.PositiveIntegerField(default=0)

    # Current valuation
    total_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    average_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Tracking
    last_movement_at = models.DateTimeField(null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.medicine.name} - {self.total_quantity} units @ ${self.average_cost} avg"

    def recalculate_average(self):
        """Recalculate average cost based on current cost layers."""
        from django.db.models import Sum, F

        layers = self.medicine.cost_layers.filter(remaining_quantity__gt=0)
        total_qty = sum(layer.remaining_quantity for layer in layers)
        total_val = sum(layer.remaining_quantity * layer.unit_cost for layer in layers)

        self.total_quantity = total_qty
        self.total_value = total_val
        self.average_cost = total_val / total_qty if total_qty > 0 else 0
        self.save()

    class Meta:
        db_table = "InventoryValuation"
        verbose_name_plural = "Inventory Valuations"
