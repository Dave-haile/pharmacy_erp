# Re-export models so Django discovers them (Django looks for app.models)
from tables.modle import (
    Category,
    Inventory,
    Medicine,
    Purchase,
    PurchaseItem,
    Sale,
    SaleItem,
    Supplier,
    InventoryHub,
)
