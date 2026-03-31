from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from tables.modle import (
    Batches,
    Category,
    GoodRecivingNote,
    GoodRecivingNoteItem,
    Medicine,
    Supplier,
)

from inventory.views import _normalize_sale_payload, _normalize_stock_entry_payload


class InventoryDocumentRulesTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            email="admin@example.com",
            password="secret123",
            first_name="Admin",
            last_name="User",
            role="admin",
            is_staff=True,
        )
        self.client.force_authenticate(self.user)

        self.category = Category.objects.create(
            name="Pain Relief",
            category_name="Pain Relief",
            naming_series="CAT-TEST-001",
        )
        self.supplier = Supplier.objects.create(
            name="Main Supplier",
            naming_series="SUP-TEST-001",
            status=Supplier.STATUS_SUBMITTED,
            is_active=True,
        )

    def _create_medicine(self, **overrides):
        payload = {
            "name": "Paracetamol",
            "generic_name": "Acetaminophen",
            "category": self.category,
            "supplier": self.supplier,
            "cost_price": Decimal("10.00"),
            "selling_price": Decimal("15.00"),
            "barcode": overrides.pop("barcode", None)
            or f"BAR-{Medicine.objects.count() + 1}",
            "naming_series": overrides.pop("naming_series", None)
            or f"MED-TEST-{Medicine.objects.count() + 1:03d}",
            "status": Medicine.STATUS_SUBMITTED,
            "is_active": True,
        }
        payload.update(overrides)
        return Medicine.objects.create(**payload)

    def _create_batch(self, medicine, **overrides):
        payload = {
            "product_id": medicine,
            "batch_number": overrides.pop("batch_number", None)
            or f"BATCH-{Batches.objects.count() + 1}",
            "expiry_date": "2027-12-31",
            "manufacturing_date": "2026-01-01",
            "quantity": 20,
            "purchase_price": Decimal("9.50"),
            "supplier_id": self.supplier,
        }
        payload.update(overrides)
        return Batches.objects.create(**payload)

    def test_inventory_eligible_only_excludes_inactive_and_draft_medicines(self):
        active_medicine = self._create_medicine(barcode="BAR-ACTIVE")
        inactive_medicine = self._create_medicine(
            name="Inactive Med",
            barcode="BAR-INACTIVE",
            is_active=False,
        )
        draft_medicine = self._create_medicine(
            name="Draft Med",
            barcode="BAR-DRAFT",
            status=Medicine.STATUS_DRAFT,
        )

        self._create_batch(active_medicine, batch_number="ACTIVE-1")
        self._create_batch(inactive_medicine, batch_number="INACTIVE-1")
        self._create_batch(draft_medicine, batch_number="DRAFT-1")

        response = self.client.get("/api/inventory/", {"eligible_only": "true"})

        self.assertEqual(response.status_code, 200)
        batch_numbers = {item["batch_number"] for item in response.json()["items"]}
        self.assertEqual(batch_numbers, {"ACTIVE-1"})

    def test_sale_payload_rejects_inactive_or_draft_medicines(self):
        inactive_medicine = self._create_medicine(
            name="Inactive Med",
            barcode="BAR-INACTIVE-2",
            is_active=False,
        )

        with self.assertRaisesMessage(
            ValueError,
            "Item #1: medicine must be active and submitted before it can be used in another document.",
        ):
            _normalize_sale_payload(
                {
                    "items": [
                        {
                            "medicine_id": inactive_medicine.id,
                            "quantity": 1,
                            "unit_price": "12.00",
                        }
                    ]
                }
            )

    def test_medicine_delete_is_blocked_when_document_items_reference_it(self):
        medicine = self._create_medicine(barcode="BAR-GRN")
        grn = GoodRecivingNote.objects.create(
            purchase=None,
            received_by=self.user,
            supplier_id=self.supplier,
            invoice_number="INV-100",
            total_amount=Decimal("20.00"),
            notes="linked",
        )
        GoodRecivingNoteItem.objects.create(
            good_reciving_note=grn,
            medicine=medicine,
            quantity=2,
            unit_price=Decimal("10.00"),
            total_price=Decimal("20.00"),
            batch_number=None,
            expiry_date="2027-12-31",
        )

        response = self.client.delete(f"/api/inventory/medicines/delete/{medicine.id}/")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["error"],
            "This medicine cannot be deleted because it is linked to other documents.",
        )

    def test_stock_entry_payload_rejects_draft_supplier(self):
        medicine = self._create_medicine(barcode="BAR-STOCK")
        draft_supplier = Supplier.objects.create(
            name="Draft Supplier",
            naming_series="SUP-TEST-002",
            status=Supplier.STATUS_DRAFT,
            is_active=True,
        )

        with self.assertRaisesMessage(
            ValueError,
            "Supplier must be active and submitted before it can be used in stock entry.",
        ):
            _normalize_stock_entry_payload(
                {
                    "supplier_id": draft_supplier.id,
                    "invoice_number": "INV-200",
                    "items": [
                        {
                            "medicine_id": medicine.id,
                            "batch_number": "BATCH-200",
                            "manufacturing_date": "2026-01-01",
                            "expiry_date": "2027-01-01",
                            "quantity": 5,
                            "unit_price": "10.00",
                            "reference": "",
                            "notes": "",
                        }
                    ],
                }
            )
