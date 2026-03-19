# PharmacyERP Database Schema

This project uses **Django ORM** with a **PostgreSQL** database (see `back/pharmacy_erp/pharmacy_erp/settings.py`).

The schema below is derived from:

- Django models under `back/pharmacy_erp/tables/modle/` and `back/pharmacy_erp/auth/models.py`
- Django migrations under `back/pharmacy_erp/*/migrations/`

> Note: Django’s built-in tables (e.g. `django_admin_log`, `django_migrations`, `auth_group`, etc.) are not listed here. This document focuses on the project’s business tables.

---

## App: `auth` (custom user model)

### Table: `User`
**Source**: `back/pharmacy_erp/auth/models.py` (Meta: `db_table = 'User'`)

- **Primary key**
  - `id` (BigAutoField)
- **Columns**
  - `email` (EmailField, unique, indexed)
  - `first_name` (CharField(100), default "")
  - `last_name` (CharField(100), default "")
  - `role` (CharField(50), choices: admin/manager/pharmacist/cashier, default pharmacist)
  - `is_active` (Boolean, default true)
  - `is_staff` (Boolean, default false)
  - `date_joined` (DateTime, default now)
  - `updated_at` (DateTime, auto_now)
  - `password` (CharField(128))
  - `last_login` (DateTime, nullable)
  - `is_superuser` (Boolean, default false)
- **Relations (Django auth integration)**
  - `groups` (M2M -> `auth_group`)
  - `user_permissions` (M2M -> `auth_permission`)

---

## App: `tables` (inventory / purchasing / sales)

### Table: `Category`
**Source**: `back/pharmacy_erp/tables/modle/category.py` + migrations `0005`, `0006`

- **Primary key**
  - `id` (AutoField)
- **Columns**
  - `name` (CharField(150), unique, indexed)
  - `category_name` (CharField(150), unique, nullable, blank, indexed)
  - `description` (Text, blank)
  - `created_at` (DateTime, auto_now_add)
- **Relations**
  - `parent_category` (FK -> `Category.id`, nullable, on_delete=CASCADE)

### Table: `Supplier`
**Source**: `back/pharmacy_erp/tables/modle/supplier.py`

- **Primary key**
  - `id` (implicit unless overridden; created in initial migration as BigAutoField)
- **Columns**
  - `name` (CharField(200), indexed)
  - `contact_person` (CharField(150), blank)
  - `phone` (CharField(20), blank)
  - `email` (EmailField, blank)
  - `address` (Text, blank)
  - `created_at` (DateTime, auto_now_add)
- **Indexes**
  - index on (`name`)

### Table: `Medicine`
**Source**: `back/pharmacy_erp/tables/modle/medicine.py` + migrations `0004`, `0007`, `0008`

- **Primary key**
  - `id` (implicit unless overridden; created in initial migration as BigAutoField)
- **Columns**
  - `name` (CharField(200), indexed)
  - `generic_name` (CharField(200), blank, indexed)
  - `cost_price` (Decimal(10,2))
  - `selling_price` (Decimal(10,2))
  - `barcode` (CharField(100), unique)
  - `naming_series` (CharField(20), unique, nullable, blank, indexed)
  - `description` (Text, blank)
  - `status` (CharField(20), choices: Draft/Submitted, default Draft)
  - `is_active` (Boolean, default true)
  - `created_at` (DateTime, auto_now_add)
  - `updated_at` (DateTime, auto_now)
- **Relations**
  - `category` (FK -> `Category.id`, on_delete=PROTECT)
  - `supplier` (FK -> `Supplier.id`, nullable, on_delete=SET_NULL)

### Table: `Inventory`
**Source**: `back/pharmacy_erp/tables/modle/inventory.py` + migration `0004` (index)

- **Primary key**
  - `id` (implicit unless overridden; created in initial migration as BigAutoField)
- **Columns**
  - `quantity` (PositiveInteger)
  - `batch_number` (CharField(100))
  - `expiry_date` (DateField)
  - `location` (CharField(150), blank)
  - `created_at` (DateTime, auto_now_add)
  - `updated_at` (DateTime, auto_now)
- **Relations**
  - `medicine` (FK -> `Medicine.id`, on_delete=CASCADE, related_name=`inventory_batches`)
- **Indexes**
  - index on (`medicine`, `batch_number`)

### Table: `Purchase`
**Source**: `back/pharmacy_erp/tables/modle/purchase.py` + migration `0004` (tax/grand_total/notes) + `0005` (ordering)

- **Primary key**
  - `id` (implicit unless overridden; created in initial migration as BigAutoField)
- **Columns**
  - `status` (CharField(20), choices: draft/ordered/partially_received/completed/cancelled, default draft)
  - `tax` (Decimal(10,2), default 0)
  - `grand_total` (Decimal(12,2), default 0)
  - `total_cost` (Decimal(12,2), default 0)
  - `notes` (Text, blank)
  - `created_at` (DateTime, auto_now_add)
  - `updated_at` (DateTime, auto_now)
- **Relations**
  - `supplier` (FK -> `Supplier.id`, on_delete=PROTECT, related_name=`purchases`)
  - `received_by` (FK -> `User.id`, on_delete=PROTECT)
- **Indexes**
  - index on (`supplier`, `created_at`, `received_by`)

### Table: `PurchaseItem`
**Source**: `back/pharmacy_erp/tables/modle/purchase_item.py` + migration `0006` rename `batch_number` -> `batch`

- **Primary key**
  - `id` (implicit unless overridden; created in initial migration as BigAutoField)
- **Columns**
  - `quantity` (PositiveInteger)
  - `cost_price` (Decimal(10,2))
  - `expiry_date` (DateField)
- **Relations**
  - `purchase` (FK -> `Purchase.id`, on_delete=CASCADE, related_name=`items`)
  - `medicine` (FK -> `Medicine.id`, on_delete=PROTECT)
  - `batch` (FK -> `Batches.batch_id`, nullable, on_delete=SET_NULL)
- **Indexes**
  - index on (`purchase`, `medicine`)

### Table: `Sale`
**Source**: `back/pharmacy_erp/tables/modle/sale.py`

- **Primary key**
  - `id` (implicit unless overridden; created in initial migration as BigAutoField)
- **Columns**
  - `total_amount` (Decimal(12,2), default 0)
  - `payment_method` (CharField(50))
  - `created_at` (DateTime, auto_now_add)
- **Relations**
  - `cashier` (FK -> `User.id`, on_delete=PROTECT)
- **Indexes**
  - index on (`cashier`, `created_at`)

### Table: `SaleItem`
**Source**: `back/pharmacy_erp/tables/modle/sale_item.py`

- **Primary key**
  - `id` (implicit unless overridden; created in initial migration as BigAutoField)
- **Columns**
  - `quantity` (PositiveInteger)
  - `price_at_sale` (Decimal(10,2))
  - `subtotal` (Decimal(12,2))
- **Relations**
  - `sale` (FK -> `Sale.id`, on_delete=CASCADE, related_name=`items`)
  - `medicine` (FK -> `Medicine.id`, on_delete=PROTECT)
- **Indexes**
  - index on (`sale`, `medicine`)

### Table: `InventoryHub`
**Source**: `back/pharmacy_erp/tables/modle/invertoryHub.py` + migration `0002`

- **Primary key**
  - `id` (BigAutoField)
- **Columns**
  - `label` (CharField(100))
  - `path` (CharField(100))
  - `highlighted` (Boolean, default false)
  - `color` (CharField(100))

### Table: `Batches`
**Source**: `back/pharmacy_erp/tables/modle/batches.py` + migration `0004`

- **Primary key**
  - `batch_id` (AutoField)
- **Columns**
  - `batch_number` (CharField(50), unique)
  - `expiry_date` (DateField)
  - `manufacturing_date` (DateField)
  - `quantity` (Integer)
  - `purchase_price` (Decimal(10,2))
  - `created_at` (DateTime, auto_now_add)
- **Relations**
  - `product_id` (FK -> `Medicine.id`, on_delete=CASCADE)
  - `supplier_id` (FK -> `Supplier.id`, on_delete=CASCADE)

### Table: `Good Reciving Note`
**DB table name**: `Good Reciving Note` (contains spaces)

**Source**: `back/pharmacy_erp/tables/modle/GoodRecivingNote.py` + migration `0004`

- **Primary key**
  - `good_reciving_note_id` (AutoField)
- **Columns**
  - `invoice_number` (CharField(50))
  - `total_amount` (Decimal(10,2))
  - `received_at` (DateTime, auto_now_add)
  - `notes` (Text, nullable, blank)
- **Relations**
  - `purchase` (FK -> `Purchase.id`, nullable, on_delete=SET_NULL)
  - `received_by` (FK -> `User.id`, on_delete=CASCADE)
  - `supplier_id` (FK -> `Supplier.id`, nullable, on_delete=SET_NULL)

### Table: `GoodRecivingNoteItem`
**Source**: `back/pharmacy_erp/tables/modle/GoodRecivingNoteItems.py` + migration `0004`

- **Primary key**
  - `id` (BigAutoField)
- **Columns**
  - `quantity` (Integer)
  - `unit_price` (Decimal(10,2))
  - `total_price` (Decimal(10,2))
  - `expiry_date` (DateField)
- **Relations**
  - `good_reciving_note` (FK -> `Good Reciving Note.good_reciving_note_id`, on_delete=CASCADE)
  - `medicine` (FK -> `Medicine.id`, on_delete=CASCADE)
  - `batch_number` (FK -> `Batches.batch_id`, nullable, on_delete=SET_NULL)

### Table: `StockLedger`
**Source**: `back/pharmacy_erp/tables/modle/inventory_transactions.py` + migration `0004` + rename migration `0006`

- **Primary key**
  - `transaction_id` (AutoField)
- **Columns**
  - `quantity` (Integer)
  - `unit_price` (Decimal(10,2))
  - `reference_document` (CharField(50))
  - `notes` (Text)
  - `created_at` (DateTime, auto_now_add)
  - `transaction_type` (CharField(20), choices intended: purchase/sale/return/adjustment/damage)
- **Relations**
  - `medicine` (FK -> `Medicine.id`, nullable, on_delete=SET_NULL)
  - `batch` (FK -> `Batches.batch_id`, nullable, on_delete=SET_NULL)

### Table: `UserLog`
**Source**: `back/pharmacy_erp/tables/modle/user_log.py` + migration `0004`

- **Primary key**
  - `log_id` (AutoField)
- **Columns**
  - `action` (CharField(100))
  - `timestamp` (DateTime, auto_now_add)
  - `details` (Text)
- **Relations**
  - `user` (FK -> `User.id`, on_delete=CASCADE)

### Table: `MedicineNamingSeries`
**Source**: `back/pharmacy_erp/tables/modle/naming_series.py` + migration `0008`

- **Primary key**
  - `id` (BigAutoField)
- **Columns**
  - `series_name` (CharField(50), unique, default `medicine_series`)
  - `current_number` (PositiveInteger, default 0)
  - `prefix` (CharField(10), default `MED`)
  - `year` (PositiveInteger)
  - `created_at` (DateTime, auto_now_add)
  - `updated_at` (DateTime, auto_now)
- **Constraints**
  - unique together (`prefix`, `year`)

---

## Relationship overview

- `Medicine.category_id` -> `Category.id` (PROTECT)
- `Medicine.supplier_id` -> `Supplier.id` (SET_NULL)
- `Inventory.medicine_id` -> `Medicine.id` (CASCADE)
- `Purchase.supplier_id` -> `Supplier.id` (PROTECT)
- `Purchase.received_by_id` -> `User.id` (PROTECT)
- `PurchaseItem.purchase_id` -> `Purchase.id` (CASCADE)
- `PurchaseItem.medicine_id` -> `Medicine.id` (PROTECT)
- `PurchaseItem.batch_id` -> `Batches.batch_id` (SET_NULL)
- `Sale.cashier_id` -> `User.id` (PROTECT)
- `SaleItem.sale_id` -> `Sale.id` (CASCADE)
- `SaleItem.medicine_id` -> `Medicine.id` (PROTECT)
- `Good Reciving Note.purchase_id` -> `Purchase.id` (SET_NULL)
- `Good Reciving Note.received_by_id` -> `User.id` (CASCADE)
- `Good Reciving Note.supplier_id` -> `Supplier.id` (SET_NULL)
- `GoodRecivingNoteItem.good_reciving_note_id` -> `Good Reciving Note.good_reciving_note_id` (CASCADE)
- `GoodRecivingNoteItem.medicine_id` -> `Medicine.id` (CASCADE)
- `GoodRecivingNoteItem.batch_number_id` -> `Batches.batch_id` (SET_NULL)
- `StockLedger.medicine_id` -> `Medicine.id` (SET_NULL)
- `StockLedger.batch_id` -> `Batches.batch_id` (SET_NULL)
- `UserLog.user_id` -> `User.id` (CASCADE)

---

## Notes / caveats

- The `Good Reciving Note` table name contains spaces (`db_table = 'Good Reciving Note'`). This is valid in PostgreSQL but requires quoting in raw SQL.
- Some tables use explicit `db_table` values with capital letters (e.g. `Medicine`, `Purchase`). PostgreSQL will preserve these only when quoted; Django handles quoting automatically.
- The schema is best kept in sync by running Django migrations. If you want, I can also generate an ERD (entity relationship diagram) from these models.
