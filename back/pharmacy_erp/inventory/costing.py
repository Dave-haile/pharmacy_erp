# pharmacy/inventory/costing.py
"""
Inventory costing calculation utilities.
Supports FIFO, LIFO, FEFO, and Average cost methods.
"""

from decimal import Decimal
from typing import List, Dict, Tuple, Optional
from django.db import transaction
from django.db.models import F
from django.utils import timezone


def get_costing_method(medicine) -> str:
    """Get the costing method for a medicine."""
    return medicine.costing_method


def calculate_cogs_fifo(medicine, quantity_needed: int) -> Tuple[Decimal, List[Dict]]:
    """
    Calculate COGS using FIFO (First In, First Out) method.
    Oldest stock is consumed first.

    Returns:
        Tuple of (total_cogs, layers_used)
        layers_used: [{layer_id, quantity, unit_cost}, ...]
    """
    from tables.model_definitions.cost_layer import CostLayer

    layers = CostLayer.objects.filter(
        medicine=medicine,
        remaining_quantity__gt=0,
        is_active=True
    ).order_by('sequence_number')  # Oldest first

    total_cogs = Decimal('0')
    quantity_remaining = quantity_needed
    layers_used = []

    for layer in layers:
        if quantity_remaining <= 0:
            break

        quantity_from_layer = min(quantity_remaining, layer.remaining_quantity)
        layer_cost = quantity_from_layer * layer.unit_cost

        layers_used.append({
            'layer_id': layer.id,
            'quantity': quantity_from_layer,
            'unit_cost': str(layer.unit_cost),
            'total_cost': str(layer_cost)
        })

        total_cogs += layer_cost
        quantity_remaining -= quantity_from_layer

    if quantity_remaining > 0:
        raise InsufficientStockError(
            f"Not enough stock for medicine {medicine.name}. "
            f"Needed: {quantity_needed}, Available: {quantity_needed - quantity_remaining}"
        )

    return total_cogs, layers_used


def calculate_cogs_lifo(medicine, quantity_needed: int) -> Tuple[Decimal, List[Dict]]:
    """
    Calculate COGS using LIFO (Last In, First Out) method.
    Newest stock is consumed first.
    """
    from tables.model_definitions.cost_layer import CostLayer

    layers = CostLayer.objects.filter(
        medicine=medicine,
        remaining_quantity__gt=0,
        is_active=True
    ).order_by('-sequence_number')  # Newest first

    total_cogs = Decimal('0')
    quantity_remaining = quantity_needed
    layers_used = []

    for layer in layers:
        if quantity_remaining <= 0:
            break

        quantity_from_layer = min(quantity_remaining, layer.remaining_quantity)
        layer_cost = quantity_from_layer * layer.unit_cost

        layers_used.append({
            'layer_id': layer.id,
            'quantity': quantity_from_layer,
            'unit_cost': str(layer.unit_cost),
            'total_cost': str(layer_cost)
        })

        total_cogs += layer_cost
        quantity_remaining -= quantity_from_layer

    if quantity_remaining > 0:
        raise InsufficientStockError(
            f"Not enough stock for medicine {medicine.name}. "
            f"Needed: {quantity_needed}, Available: {quantity_needed - quantity_remaining}"
        )

    return total_cogs, layers_used


def calculate_cogs_fefo(medicine, quantity_needed: int) -> Tuple[Decimal, List[Dict]]:
    """
    Calculate COGS using FEFO (First Expired First Out) method.
    Stock closest to expiry is consumed first.
    Best for pharmaceuticals.
    """
    from tables.model_definitions.cost_layer import CostLayer

    # Get active layers, ordered by expiry date (nulls last = no expiry first)
    layers = CostLayer.objects.filter(
        medicine=medicine,
        remaining_quantity__gt=0,
        is_active=True
    ).order_by('expiry_date', 'sequence_number')  # Expiring soonest first

    total_cogs = Decimal('0')
    quantity_remaining = quantity_needed
    layers_used = []

    for layer in layers:
        if quantity_remaining <= 0:
            break

        quantity_from_layer = min(quantity_remaining, layer.remaining_quantity)
        layer_cost = quantity_from_layer * layer.unit_cost

        layers_used.append({
            'layer_id': layer.id,
            'quantity': quantity_from_layer,
            'unit_cost': str(layer.unit_cost),
            'total_cost': str(layer_cost),
            'expiry_date': layer.expiry_date.isoformat() if layer.expiry_date else None
        })

        total_cogs += layer_cost
        quantity_remaining -= quantity_from_layer

    if quantity_remaining > 0:
        raise InsufficientStockError(
            f"Not enough stock for medicine {medicine.name}. "
            f"Needed: {quantity_needed}, Available: {quantity_needed - quantity_remaining}"
        )

    return total_cogs, layers_used


def calculate_cogs_average(medicine, quantity_needed: int) -> Tuple[Decimal, List[Dict]]:
    """
    Calculate COGS using Average Cost method.
    Uses current average cost from InventoryValuation.
    """
    from tables.model_definitions.inventory_valuation import InventoryValuation

    try:
        valuation = medicine.valuation
    except InventoryValuation.DoesNotExist:
        # Create valuation if it doesn't exist
        valuation = InventoryValuation.objects.create(
            medicine=medicine,
            total_quantity=0,
            total_value=Decimal('0'),
            average_cost=Decimal('0')
        )

    if valuation.total_quantity < quantity_needed:
        raise InsufficientStockError(
            f"Not enough stock for medicine {medicine.name}. "
            f"Needed: {quantity_needed}, Available: {valuation.total_quantity}"
        )

    avg_cost = valuation.average_cost or Decimal('0')
    total_cogs = Decimal(quantity_needed) * avg_cost

    # For average cost, we don't track individual layers
    # We just use the current average
    layers_used = [{
        'method': 'average',
        'quantity': quantity_needed,
        'unit_cost': str(avg_cost),
        'total_cost': str(total_cogs)
    }]

    return total_cogs, layers_used


def calculate_cogs(medicine, quantity_needed: int) -> Tuple[Decimal, List[Dict], str]:
    """
    Calculate COGS using the medicine's configured costing method.

    Returns:
        Tuple of (total_cogs, layers_used, method_used)
    """
    method = get_costing_method(medicine)

    if method == 'fifo':
        cogs, layers = calculate_cogs_fifo(medicine, quantity_needed)
    elif method == 'lifo':
        cogs, layers = calculate_cogs_lifo(medicine, quantity_needed)
    elif method == 'fefo':
        cogs, layers = calculate_cogs_fefo(medicine, quantity_needed)
    elif method == 'average':
        cogs, layers = calculate_cogs_average(medicine, quantity_needed)
    else:
        # Default to FIFO
        cogs, layers = calculate_cogs_fifo(medicine, quantity_needed)
        method = 'fifo'

    return cogs, layers, method


@transaction.atomic
def consume_stock(medicine, quantity_needed: int) -> Tuple[Decimal, List[Dict], str]:
    """
    Consume stock and calculate COGS.
    Actually updates the cost layers.

    Returns:
        Tuple of (total_cogs, layers_used, method_used)
    """
    from tables.model_definitions.cost_layer import CostLayer
    from tables.model_definitions.inventory_valuation import InventoryValuation

    method = get_costing_method(medicine)
    total_cogs = Decimal('0')
    layers_used = []

    if method == 'average':
        # For average cost, just update the valuation
        cogs, layers_used, method = calculate_cogs_average(medicine, quantity_needed)

        try:
            valuation = medicine.valuation
        except InventoryValuation.DoesNotExist:
            valuation = InventoryValuation.objects.create(
                medicine=medicine,
                total_quantity=0,
                total_value=Decimal('0'),
                average_cost=Decimal('0')
            )

        valuation.total_quantity -= quantity_needed
        valuation.total_value -= cogs
        if valuation.total_quantity > 0:
            valuation.average_cost = valuation.total_value / valuation.total_quantity
        else:
            valuation.average_cost = Decimal('0')
        valuation.last_movement_at = timezone.now()
        valuation.save()

        return cogs, layers_used, method

    # For FIFO, LIFO, FEFO - consume from layers
    if method == 'fifo':
        layers = CostLayer.objects.filter(
            medicine=medicine,
            remaining_quantity__gt=0,
            is_active=True
        ).order_by('sequence_number')
    elif method == 'lifo':
        layers = CostLayer.objects.filter(
            medicine=medicine,
            remaining_quantity__gt=0,
            is_active=True
        ).order_by('-sequence_number')
    elif method == 'fefo':
        layers = CostLayer.objects.filter(
            medicine=medicine,
            remaining_quantity__gt=0,
            is_active=True
        ).order_by('expiry_date', 'sequence_number')
    else:
        layers = CostLayer.objects.filter(
            medicine=medicine,
            remaining_quantity__gt=0,
            is_active=True
        ).order_by('sequence_number')

    quantity_remaining = quantity_needed

    for layer in layers:
        if quantity_remaining <= 0:
            break

        quantity_from_layer = min(quantity_remaining, layer.remaining_quantity)
        layer_cost = quantity_from_layer * layer.unit_cost

        layers_used.append({
            'layer_id': layer.id,
            'quantity': quantity_from_layer,
            'unit_cost': str(layer.unit_cost),
            'total_cost': str(layer_cost)
        })

        # Update layer
        layer.remaining_quantity -= quantity_from_layer
        if layer.remaining_quantity == 0:
            layer.is_active = False
        layer.save()

        total_cogs += layer_cost
        quantity_remaining -= quantity_from_layer

    if quantity_remaining > 0:
        raise InsufficientStockError(
            f"Not enough stock for medicine {medicine.name}"
        )

    # Update valuation
    try:
        valuation = medicine.valuation
    except InventoryValuation.DoesNotExist:
        valuation = InventoryValuation.objects.create(medicine=medicine)

    valuation.recalculate_average()
    valuation.last_movement_at = timezone.now()
    valuation.save()

    return total_cogs, layers_used, method


@transaction.atomic
def add_stock_layer(medicine, quantity: int, unit_cost: Decimal,
                     inventory=None, stock_entry_item=None, expiry_date=None) -> 'CostLayer':
    """
    Add a new cost layer when stock is received.

    Args:
        medicine: The Medicine instance
        quantity: Quantity received
        unit_cost: Cost per unit
        inventory: Optional Inventory/Batch record
        stock_entry_item: The StockEntryItem that created this layer
        expiry_date: Optional expiry date for FEFO

    Returns:
        The created CostLayer
    """
    from tables.model_definitions.cost_layer import CostLayer
    from tables.model_definitions.inventory_valuation import InventoryValuation

    # Get next sequence number
    last_layer = CostLayer.objects.filter(medicine=medicine).order_by('-sequence_number').first()
    next_sequence = (last_layer.sequence_number + 1) if last_layer else 1

    layer = CostLayer.objects.create(
        medicine=medicine,
        inventory=inventory,
        unit_cost=unit_cost,
        original_quantity=quantity,
        remaining_quantity=quantity,
        sequence_number=next_sequence,
        expiry_date=expiry_date,
        stock_entry_item=stock_entry_item,
        is_active=True
    )

    # Update or create valuation
    try:
        valuation = medicine.valuation
    except InventoryValuation.DoesNotExist:
        valuation = InventoryValuation.objects.create(
            medicine=medicine,
            total_quantity=0,
            total_value=Decimal('0'),
            average_cost=Decimal('0')
        )

    # Recalculate average cost
    valuation.recalculate_average()
    valuation.last_movement_at = timezone.now()
    valuation.save()

    return layer


class InsufficientStockError(Exception):
    """Raised when there's not enough stock to fulfill a request."""
    pass


class CostingMethodError(Exception):
    """Raised when there's an error with the costing method."""
    pass
