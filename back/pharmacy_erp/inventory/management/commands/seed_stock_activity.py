import random
from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from inventory.views import _post_sale, _post_stock_entry
from tables.model_definitions import (
    Batches,
    Category,
    CostLayer,
    Inventory,
    InventoryValuation,
    Medicine,
    Sale,
    SaleItem,
    StockEntry,
    StockEntryItem,
    StockLedger,
    Supplier,
    UserLog,
)


User = get_user_model()


class Command(BaseCommand):
    help = "Seed lots of realistic stock entries and stock-outs with spaced timestamps."

    CATEGORY_NAMES = [
        "Antibiotics",
        "Analgesics",
        "Antimalarials",
        "Vitamins",
        "Cardiovascular",
        "Diabetes Care",
        "Respiratory",
        "Dermatology",
        "Gastrointestinal",
        "Emergency Care",
    ]

    SUPPLIER_NAMES = [
        "Addis Med Supply",
        "Nile Pharma Trading",
        "EthioCare Distributors",
        "BlueLine Pharmaceuticals",
        "Abay Health Source",
        "WellSpring Medicals",
        "PrimeDose Wholesale",
        "Horizon Pharma PLC",
        "Lifeline Med Import",
        "Unity Drug House",
        "MetroMed Partners",
        "GreenCross Supply",
    ]

    MEDICINE_TEMPLATES = [
        ("Amoxicillin 500mg", "Amoxicillin"),
        ("Paracetamol 500mg", "Paracetamol"),
        ("Ibuprofen 400mg", "Ibuprofen"),
        ("Azithromycin 250mg", "Azithromycin"),
        ("Ceftriaxone 1g", "Ceftriaxone"),
        ("Metformin 850mg", "Metformin"),
        ("Glimepiride 2mg", "Glimepiride"),
        ("Insulin Regular", "Human Insulin"),
        ("Losartan 50mg", "Losartan"),
        ("Amlodipine 5mg", "Amlodipine"),
        ("Hydrochlorothiazide 25mg", "Hydrochlorothiazide"),
        ("Salbutamol Inhaler", "Salbutamol"),
        ("Budesonide Inhaler", "Budesonide"),
        ("Omeprazole 20mg", "Omeprazole"),
        ("Pantoprazole 40mg", "Pantoprazole"),
        ("Zinc Sulphate 20mg", "Zinc"),
        ("Vitamin C 500mg", "Ascorbic Acid"),
        ("Multivitamin Syrup", "Multivitamin"),
        ("ORS Sachet", "Oral Rehydration Salts"),
        ("Diclofenac 50mg", "Diclofenac"),
        ("Tramadol 50mg", "Tramadol"),
        ("Artemether/Lumefantrine", "Artemether Lumefantrine"),
        ("Coartem Suspension", "Artemether Lumefantrine"),
        ("Cotrimoxazole DS", "Sulfamethoxazole Trimethoprim"),
        ("Doxycycline 100mg", "Doxycycline"),
        ("Ciprofloxacin 500mg", "Ciprofloxacin"),
        ("Gentamicin Injection", "Gentamicin"),
        ("Fluconazole 150mg", "Fluconazole"),
        ("Clotrimazole Cream", "Clotrimazole"),
        ("Hydrocortisone Cream", "Hydrocortisone"),
        ("Loratadine 10mg", "Loratadine"),
        ("Cetirizine 10mg", "Cetirizine"),
        ("Furosemide 40mg", "Furosemide"),
        ("Spironolactone 25mg", "Spironolactone"),
        ("Aspirin 81mg", "Aspirin"),
        ("Atorvastatin 20mg", "Atorvastatin"),
        ("Simvastatin 20mg", "Simvastatin"),
        ("Clopidogrel 75mg", "Clopidogrel"),
        ("Nifedipine 20mg", "Nifedipine"),
        ("Metronidazole 400mg", "Metronidazole"),
        ("Albendazole 400mg", "Albendazole"),
        ("Mebendazole 100mg", "Mebendazole"),
        ("Calcium Tablets", "Calcium"),
        ("Folic Acid 5mg", "Folic Acid"),
        ("Ferrous Sulphate", "Iron"),
        ("Adrenaline Injection", "Epinephrine"),
        ("Dextrose 5% Infusion", "Dextrose"),
        ("Normal Saline 500ml", "Sodium Chloride"),
        ("Ringer Lactate", "Electrolyte Solution"),
        ("Disposable Syringe 5ml", "Syringe"),
        ("Examination Gloves", "Gloves"),
    ]

    def add_arguments(self, parser):
        parser.add_argument("--stock-entries", type=int, default=150)
        parser.add_argument("--stock-outs", type=int, default=240)
        parser.add_argument("--days-back", type=int, default=120)
        parser.add_argument("--medicines", type=int, default=60)
        parser.add_argument("--suppliers", type=int, default=12)
        parser.add_argument("--seed", type=int, default=20260411)

    def handle(self, *args, **options):
        self.random = random.Random(options["seed"])
        stock_entry_count = max(1, options["stock_entries"])
        stock_out_count = max(1, options["stock_outs"])
        days_back = max(14, options["days_back"])
        medicine_target = max(12, options["medicines"])
        supplier_target = max(4, options["suppliers"])

        self.stdout.write(
            f"Preparing mock stock activity with seed={options['seed']}..."
        )

        users = self._ensure_users()
        suppliers = self._ensure_suppliers(supplier_target)
        medicines = self._ensure_medicines(medicine_target, suppliers)

        entry_times = self._build_timestamps(
            count=stock_entry_count,
            start=timezone.now() - timedelta(days=days_back),
            end=timezone.now() - timedelta(days=max(7, days_back // 5)),
            min_step_minutes=90,
            max_step_minutes=14 * 60,
        )
        sale_times = self._build_timestamps(
            count=stock_out_count,
            start=timezone.now() - timedelta(days=max(5, days_back - (days_back // 4))),
            end=timezone.now() - timedelta(hours=1),
            min_step_minutes=45,
            max_step_minutes=8 * 60,
        )

        created_entries = 0
        created_sales = 0

        for index, occurred_at in enumerate(entry_times, start=1):
            try:
                self._create_posted_stock_entry(index, occurred_at, users, suppliers, medicines)
                created_entries += 1
            except Exception as exc:
                self.stdout.write(
                    self.style.WARNING(f"Skipped stock entry #{index}: {exc}")
                )

        for index, occurred_at in enumerate(sale_times, start=1):
            try:
                created = self._create_posted_sale(index, occurred_at, users)
                if created:
                    created_sales += 1
            except Exception as exc:
                self.stdout.write(
                    self.style.WARNING(f"Skipped stock-out #{index}: {exc}")
                )

        remaining_batches = Batches.objects.filter(quantity__gt=0).count()
        self.stdout.write(
            self.style.SUCCESS(
                f"Created {created_entries} posted stock entries and "
                f"{created_sales} posted stock-outs. Active batches: {remaining_batches}."
            )
        )

    def _ensure_users(self):
        users = {}
        defaults = {
            "manager": {
                "email": "seed.manager@pharmacy.local",
                "first_name": "Seed",
                "last_name": "Manager",
                "role": "manager",
                "is_staff": True,
            },
            "pharmacist": {
                "email": "seed.pharmacist@pharmacy.local",
                "first_name": "Seed",
                "last_name": "Pharmacist",
                "role": "pharmacist",
                "is_staff": False,
            },
            "cashier": {
                "email": "seed.cashier@pharmacy.local",
                "first_name": "Seed",
                "last_name": "Cashier",
                "role": "cashier",
                "is_staff": False,
            },
        }

        for role, payload in defaults.items():
            email = payload["email"]
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    **payload,
                    "is_active": True,
                },
            )
            if created:
                user.set_password("password")
                user.save(update_fields=["password"])
            else:
                updates = []
                for field, value in payload.items():
                    if getattr(user, field) != value:
                        setattr(user, field, value)
                        updates.append(field)
                if not user.is_active:
                    user.is_active = True
                    updates.append("is_active")
                if updates:
                    user.save(update_fields=updates)
            users[role] = user

        return users

    def _ensure_suppliers(self, supplier_target):
        suppliers = list(
            Supplier.objects.filter(status=Supplier.STATUS_SUBMITTED, is_active=True)
            .order_by("id")
        )

        while len(suppliers) < supplier_target:
            idx = len(suppliers) + 1
            name = self.SUPPLIER_NAMES[(idx - 1) % len(self.SUPPLIER_NAMES)]
            supplier = Supplier.objects.create(
                name=f"{name} {idx:02d}" if idx > len(self.SUPPLIER_NAMES) else name,
                contact_person=f"Contact {idx:02d}",
                phone=f"+251-900-{idx:04d}",
                email=f"supplier{idx:02d}@seed.local",
                address=f"Warehouse Block {idx:02d}, Addis Ababa",
                status=Supplier.STATUS_SUBMITTED,
                is_active=True,
            )
            suppliers.append(supplier)

        if suppliers:
            Supplier.objects.filter(pk__in=[s.pk for s in suppliers]).update(
                status=Supplier.STATUS_SUBMITTED,
                is_active=True,
            )

        return suppliers[:supplier_target]

    def _ensure_medicines(self, medicine_target, suppliers):
        medicines = list(
            Medicine.objects.filter(status=Medicine.STATUS_SUBMITTED, is_active=True)
            .select_related("supplier", "category")
            .order_by("id")
        )

        categories = self._ensure_categories()

        template_index = 0
        while len(medicines) < medicine_target:
            base_name, generic_name = self.MEDICINE_TEMPLATES[
                template_index % len(self.MEDICINE_TEMPLATES)
            ]
            suffix = "" if template_index < len(self.MEDICINE_TEMPLATES) else f" {template_index + 1}"
            supplier = suppliers[template_index % len(suppliers)]
            category = categories[template_index % len(categories)]
            cost_price = self._money(self.random.uniform(8, 250))
            medicine = Medicine.objects.create(
                name=f"{base_name}{suffix}",
                generic_name=generic_name,
                category=category,
                supplier=supplier,
                cost_price=cost_price,
                selling_price=self._money(cost_price * Decimal(str(self.random.uniform(1.18, 1.65)))),
                barcode=f"SEED-MED-{template_index + 1:05d}",
                description="Generated for stock entry / stock-out testing.",
                status=Medicine.STATUS_SUBMITTED,
                costing_method=self.random.choice(
                    [
                        Medicine.COST_FIFO,
                        Medicine.COST_FEFO,
                        Medicine.COST_AVERAGE,
                        Medicine.COST_LIFO,
                    ]
                ),
                is_active=True,
            )
            medicines.append(medicine)
            template_index += 1

        selected = medicines[:medicine_target]
        for index, medicine in enumerate(selected):
            updates = []
            if medicine.status != Medicine.STATUS_SUBMITTED:
                medicine.status = Medicine.STATUS_SUBMITTED
                updates.append("status")
            if not medicine.is_active:
                medicine.is_active = True
                updates.append("is_active")
            desired_supplier = medicine.supplier or suppliers[index % len(suppliers)]
            if medicine.supplier_id != desired_supplier.id:
                medicine.supplier = desired_supplier
                updates.append("supplier")
            if updates:
                medicine.save(update_fields=updates)

        return selected

    def _ensure_categories(self):
        categories = list(Category.objects.order_by("id"))
        for index, name in enumerate(self.CATEGORY_NAMES, start=1):
            if any(category.name == name for category in categories):
                continue
            categories.append(
                Category.objects.create(
                    name=name,
                    category_name=name,
                    description=f"Generated category {index}",
                )
            )
        return categories[: len(self.CATEGORY_NAMES)]

    def _build_timestamps(self, count, start, end, min_step_minutes, max_step_minutes):
        if count <= 1:
            return [start]

        points = [start]
        current = start
        for _ in range(count - 1):
            step = timedelta(
                minutes=self.random.randint(min_step_minutes, max_step_minutes)
            )
            current = current + step
            points.append(current)

        if points[-1] > end:
            total_span = (end - start).total_seconds()
            if total_span <= 0:
                return [end for _ in range(count)]
            points = [
                start + timedelta(seconds=(total_span * idx / (count - 1)))
                for idx in range(count)
            ]

        return points

    @transaction.atomic
    def _create_posted_stock_entry(self, sequence, occurred_at, users, suppliers, medicines):
        supplier = self.random.choice(suppliers)
        receiver = users["pharmacist"]
        item_count = self.random.randint(2, 6)
        selected_medicines = self.random.sample(medicines, k=min(item_count, len(medicines)))

        stock_entry = StockEntry.objects.create(
            supplier=supplier,
            invoice_number=f"SEED-IN-{occurred_at:%Y%m%d}-{sequence:05d}",
            status=StockEntry.STATUS_DRAFT,
            total_cost=Decimal("0"),
            tax=Decimal("0"),
            grand_total=Decimal("0"),
            notes=f"Seeded stock entry #{sequence}",
            received_by=receiver,
        )

        total_cost = Decimal("0")
        created_item_ids = []

        for line_no, medicine in enumerate(selected_medicines, start=1):
            quantity = self.random.randint(40, 220)
            unit_price = self._money(
                medicine.cost_price
                * Decimal(str(self.random.uniform(0.9, 1.15)))
            )
            manufacturing_date = (
                occurred_at.date() - timedelta(days=self.random.randint(30, 420))
            )
            expiry_date = occurred_at.date() + timedelta(days=self.random.randint(180, 900))
            line_total = self._money(unit_price * quantity)
            batch_number = (
                f"SED-{medicine.id:04d}-{occurred_at:%y%m%d}-{sequence:04d}-{line_no:02d}"
            )

            item = StockEntryItem.objects.create(
                stock_entry=stock_entry,
                medicine=medicine,
                batch_number=batch_number,
                quantity=quantity,
                unit_price=unit_price,
                total_price=line_total,
                manufacturing_date=manufacturing_date,
                expiry_date=expiry_date,
                reference=f"Seed receipt {sequence}-{line_no}",
                notes=f"Generated batch for {medicine.name}",
            )
            created_item_ids.append(item.id)
            total_cost += line_total

        stock_entry.total_cost = self._money(total_cost)
        stock_entry.tax = self._money(total_cost * Decimal("0.05"))
        stock_entry.grand_total = self._money(stock_entry.total_cost + stock_entry.tax)
        stock_entry.save(update_fields=["total_cost", "tax", "grand_total"])

        _post_stock_entry(stock_entry)
        stock_entry.refresh_from_db()
        self._stamp_stock_entry(stock_entry, occurred_at)

        StockEntryItem.objects.filter(pk__in=created_item_ids).update(
            created_at=occurred_at + timedelta(minutes=5)
        )

    @transaction.atomic
    def _create_posted_sale(self, sequence, occurred_at, users):
        available_batches = list(
            Batches.objects.select_related("product_id")
            .filter(
                quantity__gt=3,
                expiry_date__gt=occurred_at.date() + timedelta(days=7),
                product_id__is_active=True,
                product_id__status=Medicine.STATUS_SUBMITTED,
            )
            .order_by("expiry_date", "created_at")[:120]
        )
        if not available_batches:
            return False

        cashier = users["cashier"]
        item_count = min(
            len(available_batches),
            self.random.randint(1, 4),
        )
        chosen_batches = self.random.sample(available_batches, k=item_count)

        sale = Sale.objects.create(
            customer_name=f"Walk-in Customer {sequence:04d}",
            invoice_number=f"SEED-OUT-{occurred_at:%Y%m%d}-{sequence:05d}",
            cashier=cashier,
            status=Sale.STATUS_DRAFT,
            total_amount=Decimal("0"),
            payment_method=self.random.choice(
                [
                    Sale.PAYMENT_METHOD_CASH,
                    Sale.PAYMENT_METHOD_CARD,
                    Sale.PAYMENT_METHOD_MOBILE,
                ]
            ),
            notes=f"Seeded stock out #{sequence}",
        )

        total_amount = Decimal("0")
        for batch in chosen_batches:
            max_quantity = min(batch.quantity, self.random.randint(2, 24))
            if max_quantity <= 0:
                continue
            quantity = self.random.randint(1, max_quantity)
            unit_price = self._money(
                batch.product_id.selling_price
                * Decimal(str(self.random.uniform(0.95, 1.10)))
            )
            subtotal = self._money(unit_price * quantity)
            SaleItem.objects.create(
                sale=sale,
                medicine=batch.product_id,
                batch=batch,
                quantity=quantity,
                price_at_sale=unit_price,
                subtotal=subtotal,
            )
            total_amount += subtotal

        if not sale.items.exists():
            sale.delete()
            return False

        sale.total_amount = self._money(total_amount)
        sale.save(update_fields=["total_amount"])

        _post_sale(sale)
        sale.refresh_from_db()
        self._stamp_sale(sale, occurred_at)
        return True

    def _stamp_stock_entry(self, stock_entry, occurred_at):
        posted_at = occurred_at
        detail_at = occurred_at + timedelta(minutes=5)
        receipt_at = occurred_at + timedelta(minutes=20)

        StockEntry.objects.filter(pk=stock_entry.pk).update(
            created_at=posted_at,
            updated_at=posted_at,
        )
        StockEntryItem.objects.filter(stock_entry=stock_entry).update(
            created_at=detail_at
        )

        if stock_entry.purchase_id:
            stock_entry.purchase.__class__.objects.filter(pk=stock_entry.purchase_id).update(
                created_at=receipt_at,
                updated_at=receipt_at,
            )

        if stock_entry.goods_receiving_note_id:
            stock_entry.goods_receiving_note.__class__.objects.filter(
                pk=stock_entry.goods_receiving_note_id
            ).update(received_at=receipt_at)

        batch_ids = list(
            stock_entry.items.exclude(batch_id__isnull=True).values_list("batch_id", flat=True)
        )
        if batch_ids:
            Batches.objects.filter(pk__in=batch_ids).update(created_at=receipt_at)

        batch_numbers = list(stock_entry.items.values_list("batch_number", flat=True))
        Inventory.objects.filter(
            medicine_id__in=stock_entry.items.values_list("medicine_id", flat=True),
            batch_number__in=batch_numbers,
        ).update(created_at=receipt_at, updated_at=receipt_at)

        StockLedger.objects.filter(reference_document=stock_entry.invoice_number).update(
            created_at=receipt_at
        )
        CostLayer.objects.filter(stock_entry_item__stock_entry=stock_entry).update(
            received_at=receipt_at
        )
        InventoryValuation.objects.filter(
            medicine_id__in=stock_entry.items.values_list("medicine_id", flat=True)
        ).update(last_movement_at=receipt_at)
        UserLog.objects.filter(
            user=stock_entry.received_by,
            action="Stock Entry Submitted",
            details__contains=stock_entry.posting_number,
        ).update(timestamp=receipt_at)

    def _stamp_sale(self, sale, occurred_at):
        posted_at = occurred_at
        Sale.objects.filter(pk=sale.pk).update(
            created_at=posted_at,
            updated_at=posted_at,
        )
        StockLedger.objects.filter(reference_document=sale.invoice_number).update(
            created_at=posted_at + timedelta(minutes=10)
        )
        InventoryValuation.objects.filter(
            medicine_id__in=sale.items.values_list("medicine_id", flat=True)
        ).update(last_movement_at=posted_at + timedelta(minutes=10))
        UserLog.objects.filter(
            user=sale.cashier,
            action="Stock Out Submitted",
            details__contains=sale.posting_number,
        ).update(timestamp=posted_at + timedelta(minutes=10))

    def _money(self, amount):
        return Decimal(amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
