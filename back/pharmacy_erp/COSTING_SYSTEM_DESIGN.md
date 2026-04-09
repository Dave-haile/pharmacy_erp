# Inventory Costing System Design

## Overview
This document outlines the design for a flexible inventory costing system supporting FIFO (default), LIFO, and Average Cost methods.

## Costing Methods

### 1. FIFO (First In, First Out) - DEFAULT
- Assumes oldest stock is sold first
- Best for: Pharmaceuticals with expiry dates (ensures oldest batches are used first)
- COGS calculation: Uses oldest purchase prices first

### 2. LIFO (Last In, First Out)
- Assumes newest stock is sold first
- Best for: Markets with rising prices (matches current costs with current revenue)
- COGS calculation: Uses newest purchase prices first
- **Warning:** Not allowed under IFRS (International Financial Reporting Standards)

### 3. Average Cost (Weighted Average)
- Calculates average cost of all units
- Recalculated after each purchase
- COGS calculation: Uses current average cost

### 4. Specific Identification
- Tracks exact cost of each specific item
- Best for: High-value, unique items
- Not practical for bulk pharmaceuticals

## Database Changes Required

### New Model: `CostLayer`

```python
class CostLayer(models.Model):
    """
    Represents a layer of inventory at a specific cost.
    Each purchase creates a new cost layer.
    When stock is sold/consumed, layers are depleted based on costing method.
    """
    # Link to batch/medicine
    medicine = models.ForeignKey('Medicine', on_delete=models.CASCADE)
    batch = models.ForeignKey('Inventory', on_delete=models.CASCADE, null=True, blank=True)
    
    # Cost information
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    original_quantity = models.PositiveIntegerField()
    remaining_quantity = models.PositiveIntegerField()
    
    # Tracking
    stock_entry_item = models.ForeignKey('StockEntryItem', on_delete=models.PROTECT, related_name='cost_layers')
    received_at = models.DateTimeField(auto_now_add=True)
    
    # For FIFO/LIFO ordering
    sequence_number = models.PositiveIntegerField()  # Auto-increment for ordering
    
    class Meta:
        indexes = [
            models.Index(fields=['medicine', 'sequence_number']),
            models.Index(fields=['medicine', 'remaining_quantity']),  # For finding available layers
        ]
```

### Modified Model: `SaleItem` / `StockOutItem`

```python
class SaleItem(models.Model):
    # ... existing fields ...
    
    # NEW: Track which cost layers were used
    cost_layers_used = models.JSONField(default=list)
    """
    Stores: [
        {"layer_id": 1, "quantity": 50, "unit_cost": 10.00},
        {"layer_id": 2, "quantity": 20, "unit_cost": 12.00}
    ]
    """
    calculated_cost = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Store costing method used for this transaction
    costing_method = models.CharField(
        max_length=20,
        choices=[('fifo', 'FIFO'), ('lifo', 'LIFO'), ('average', 'Average')],
        default='fifo'
    )
```

### New Model: `InventoryValuation`

```python
class InventoryValuation(models.Model):
    """
    Tracks current valuation of each medicine based on costing method.
    Updated whenever stock moves.
    """
    medicine = models.OneToOneField('Medicine', on_delete=models.CASCADE)
    
    # Current valuation
    total_quantity = models.PositiveIntegerField(default=0)
    total_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    average_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Costing method currently in use
    costing_method = models.CharField(max_length=20, default='fifo')
    
    last_updated = models.DateTimeField(auto_now=True)
```

## System Configuration

```python
class SystemConfig(models.Model):
    """Global system configuration"""
    DEFAULT_COSTING_METHOD = models.CharField(
        max_length=20,
        choices=[('fifo', 'FIFO'), ('lifo', 'LIFO'), ('average', 'Average')],
        default='fifo'
    )
    
    ALLOW_COSTING_METHOD_CHANGE = models.BooleanField(default=False)
    """
    IMPORTANT: Once transactions exist, changing costing method
    requires recalculating ALL historical transactions.
    """
```

## Algorithms

### FIFO Cost Calculation (Stock Out)

```python
def calculate_cogs_fifo(medicine_id, quantity_needed):
    """
    Returns cost layers to use and total COGS for a stock out.
    """
    layers = CostLayer.objects.filter(
        medicine_id=medicine_id,
        remaining_quantity__gt=0
    ).order_by('sequence_number')  # Oldest first
    
    total_cogs = 0
    quantity_remaining = quantity_needed
    layers_used = []
    
    for layer in layers:
        if quantity_remaining <= 0:
            break
            
        quantity_from_layer = min(quantity_remaining, layer.remaining_quantity)
        
        layers_used.append({
            'layer_id': layer.id,
            'quantity': quantity_from_layer,
            'unit_cost': layer.unit_cost
        })
        
        total_cogs += quantity_from_layer * layer.unit_cost
        quantity_remaining -= quantity_from_layer
        
        # Update layer
        layer.remaining_quantity -= quantity_from_layer
        layer.save()
    
    if quantity_remaining > 0:
        raise InsufficientStockError(f"Not enough stock for medicine {medicine_id}")
    
    return total_cogs, layers_used
```

### LIFO Cost Calculation (Stock Out)

```python
def calculate_cogs_lifo(medicine_id, quantity_needed):
    """
    Same as FIFO but orders by -sequence_number (newest first)
    """
    layers = CostLayer.objects.filter(
        medicine_id=medicine_id,
        remaining_quantity__gt=0
    ).order_by('-sequence_number')  # Newest first
    
    # ... rest same as FIFO ...
```

### Average Cost Calculation (Stock Out)

```python
def calculate_cogs_average(medicine_id, quantity_needed):
    """
    Uses current average cost from InventoryValuation.
    """
    valuation = InventoryValuation.objects.get(medicine_id=medicine_id)
    
    if valuation.total_quantity < quantity_needed:
        raise InsufficientStockError()
    
    cogs = quantity_needed * valuation.average_cost
    
    # Update valuation
    valuation.total_quantity -= quantity_needed
    valuation.total_value -= cogs
    valuation.save()
    
    return cogs
```

## Impact on Existing Features

### 1. Stock Entry (Incoming)
**Current:** Creates Inventory record
**New:** 
- Creates Inventory record
- Creates CostLayer(s) for each item
- Updates InventoryValuation

### 2. Stock Out / Sale (Outgoing)
**Current:** Deducts from Inventory
**New:**
- Calculates COGS using configured method
- Depletes CostLayer(s)
- Stores cost breakdown in SaleItem
- Updates InventoryValuation

### 3. Stock Adjustments
**Current:** Direct quantity adjustment
**New:**
- Positive adjustment: Creates new CostLayer
- Negative adjustment: Depletes CostLayer(s), may create variance
- Tracks adjustment reason

### 4. Returns
**Current:** Increases quantity
**New:**
- Customer return: Restores original cost layers if within same period
- Supplier return: Reverses specific cost layer

### 5. Reports
**Current:** Shows quantity and basic values
**New:**
- Inventory valuation report (shows cost breakdown)
- COGS by period
- Gross margin analysis
- Cost layer aging report

## Migration Strategy

### Step 1: Add New Tables
- Create CostLayer table
- Create InventoryValuation table
- Add cost tracking fields to SaleItem, StockAdjustmentItem

### Step 2: Backfill Data
For each existing batch in Inventory:
- Create CostLayer with:
  - unit_cost = purchase price (from StockEntryItem or PurchaseItem)
  - original_quantity = current quantity
  - remaining_quantity = current quantity
  - sequence_number = auto-increment based on created_at

### Step 3: Set Costing Method
- Default all medicines to FIFO (pharmaceutical best practice)
- Allow per-medicine override

## Financial Impact Examples

### Scenario: Rising Prices

| Month | Purchase Price | FIFO COGS | LIFO COGS |
|-------|-------------|-----------|-----------|
| Jan | $10 | - | - |
| Feb | $12 | - | - |
| Mar | $15 | - | - |
| **Sale 30 units** | | $360 (10+12+15×8) | $420 (15+12+10×8) |

**During Inflation:**
- FIFO: Lower COGS, Higher Profit, Higher Taxes
- LIFO: Higher COGS, Lower Profit, Lower Taxes

### Scenario: Expiring Stock

FIFO ensures oldest stock (closest to expiry) is sold first, reducing waste.

## Recommendation

**For a Pharmacy ERP:**
1. **Use FIFO as default** - matches physical flow (expiry management)
2. **Allow per-medicine override** for specific cases
3. **Consider FEFO** (First Expired First Out) as an option
4. **Track cost layers separately from physical batches** - one batch may have multiple cost layers if partial receipts at different prices
5. **Implement cost layer reports** for auditing

## UI Changes Needed

### System Settings Page
- Default costing method selector
- Warning when changing method
- Per-medicine costing method override

### Medicine Detail Page
- Show current cost layers
- Show average cost
- Show cost history chart

### Reports
- Inventory Valuation by Cost Layer
- COGS Analysis
- Gross Margin Report
- Cost Layer Aging (for audit)

## Questions to Consider

1. **Can costing method be changed after transactions?**
   - Recommended: No, or require recalculation of all history
   
2. **What happens to existing data when implementing?**
   - Must backfill cost layers from purchase history
   
3. **How to handle missing cost data?**
   - Use current average cost?
   - Require manual entry?
   
4. **Multi-location support?**
   - Cost layers per location or global?
   
5. **Reporting periods?**
   - Monthly COGS calculations?
   - Period-end inventory valuations?