from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from tables.model_definitions import (
    Batches,
    Category,
    GoodRecivingNote,
    GoodRecivingNoteItem,
    Medicine,
    PrintFormat,
    StockEntry,
    StockEntryItem,
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

    def test_medicine_export_respects_filters(self):
        self._create_medicine(name="Paracetamol", barcode="BAR-EXPORT-1")
        self._create_medicine(name="Ibuprofen", barcode="BAR-EXPORT-2")

        response = self.client.get(
            "/api/inventory/medicines/export/",
            {"export_format": "csv", "search": "Ibu", "include_inactive": "true"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/csv")
        csv_text = response.content.decode("utf-8")
        self.assertIn("Ibuprofen", csv_text)
        self.assertNotIn("Paracetamol", csv_text)

    def test_medicine_export_xlsx_returns_workbook_file(self):
        self._create_medicine(name="Export Sheet", barcode="BAR-XLSX-1")

        response = self.client.get(
            "/api/inventory/medicines/export/",
            {"export_format": "xlsx", "include_inactive": "true"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response["Content-Type"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        self.assertTrue(response.content.startswith(b"PK"))

    def test_medicine_import_csv_creates_records(self):
        csv_payload = (
            "Name,Generic Name,Barcode,Category ID,Supplier ID,Cost Price,Selling Price,Status,Is Active,Description\n"
            f"Imported Med,Imported Generic,IMP-001,{self.category.id},{self.supplier.id},12.50,18.75,Submitted,true,Imported from CSV\n"
        )

        response = self.client.post(
            "/api/inventory/medicines/import/",
            {
                "file": SimpleUploadedFile(
                    "medicines.csv",
                    csv_payload.encode("utf-8"),
                    content_type="text/csv",
                )
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["created"], 1)
        imported = Medicine.objects.get(barcode="IMP-001")
        self.assertEqual(imported.name, "Imported Med")
        self.assertEqual(imported.status, Medicine.STATUS_SUBMITTED)

    def test_medicine_import_preview_reports_missing_columns_and_type_errors(self):
        csv_payload = (
            "Name,Barcode,Category ID,Cost Price,Selling Price,Status,Is Active\n"
            f"Preview Med,PRE-001,{self.category.id},abc,19.50,Submitted,yes\n"
        )

        response = self.client.post(
            "/api/inventory/medicines/import/preview/",
            {
                "file": SimpleUploadedFile(
                    "preview.csv",
                    csv_payload.encode("utf-8"),
                    content_type="text/csv",
                )
            },
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertFalse(payload["can_import"])
        self.assertEqual(payload["missing_columns"], [])
        self.assertEqual(payload["invalid_rows"], 1)
        self.assertEqual(payload["sample_rows"][0]["row"], 2)
        self.assertEqual(payload["sample_rows"][0]["values"]["Name"], "Preview Med")
        self.assertTrue(
            any(
                issue["column"] == "Cost Price" and "number" in issue["message"].lower()
                for issue in payload["errors"]
            )
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

    def test_print_formats_endpoint_filters_by_document_type(self):
        response = self.client.get(
            "/api/inventory/print-formats/",
            {"document_type": "stock_entry", "is_active": "true"},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertGreaterEqual(len(payload["results"]), 1)
        self.assertTrue(
            all(item["document_type"] == "stock_entry" for item in payload["results"])
        )
        self.assertTrue(any(item["is_default"] for item in payload["results"]))

    def test_stock_entry_detail_can_be_fetched_by_posting_number(self):
        medicine = self._create_medicine(barcode="BAR-STOCK-DETAIL")
        stock_entry = StockEntry.objects.create(
            supplier=self.supplier,
            invoice_number="INV-300",
            status=StockEntry.STATUS_DRAFT,
            total_cost=Decimal("50.00"),
            tax=Decimal("5.00"),
            grand_total=Decimal("55.00"),
            received_by=self.user,
            notes="Preview test",
        )
        StockEntryItem.objects.create(
            stock_entry=stock_entry,
            medicine=medicine,
            batch=None,
            batch_number="BATCH-300",
            quantity=5,
            unit_price=Decimal("10.00"),
            total_price=Decimal("50.00"),
            manufacturing_date="2026-01-01",
            expiry_date="2027-01-01",
            reference="PO-1",
            notes="Line note",
        )

        response = self.client.get(
            f"/api/inventory/stock-entries/by-posting-number/{stock_entry.posting_number}/"
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["posting_number"], stock_entry.posting_number)
        self.assertEqual(payload["invoice_number"], "INV-300")
        self.assertEqual(len(payload["items"]), 1)

    def test_print_format_can_be_created_with_custom_code(self):
        response = self.client.post(
            "/api/inventory/print-formats/create/",
            {
                "document_type": "stock_entry",
                "name": "Custom HTML Layout",
                "slug": "custom-html-layout",
                "template_key": "standard",
                "description": "User-defined template",
                "html_template": "<div id='app'>{{ data.posting_number }}</div>",
                "css_template": "#app { color: #111; }",
                "js_template": "console.log(window.PRINT_DATA);",
                "paper_size": "A4",
                "orientation": "portrait",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        payload = response.json()["print_format"]
        self.assertEqual(payload["slug"], "custom-html-layout")
        self.assertTrue(payload["has_custom_template"])
        self.assertEqual(
            PrintFormat.objects.get(slug="custom-html-layout").html_template,
            "<div id='app'>{{ data.posting_number }}</div>",
        )

    def test_print_format_can_be_created_for_medicine_documents(self):
        response = self.client.post(
            "/api/inventory/print-formats/create/",
            {
                "document_type": "medicine",
                "name": "Medicine Spec Sheet",
                "slug": "medicine-spec-sheet",
                "template_key": "standard",
                "description": "User-defined medicine print format",
                "html_template": "<div>{{ data.name }}</div>",
                "css_template": ".page { color: #111; }",
                "js_template": "",
                "paper_size": "A4",
                "orientation": "portrait",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        payload = response.json()["print_format"]
        self.assertEqual(payload["document_type"], "medicine")

        medicine = self._create_medicine(barcode="BAR-PRINT-LINK")
        medicine.print = PrintFormat.objects.get(slug="medicine-spec-sheet")
        medicine.save(update_fields=["print"])

        medicine.refresh_from_db()
        self.assertEqual(medicine.print.slug, "medicine-spec-sheet")

    def test_print_format_can_be_updated(self):
        print_format = PrintFormat.objects.create(
            document_type="stock_entry",
            name="Original Layout",
            slug="original-layout",
            template_key="standard",
            description="Original",
            html_template="<div>Old</div>",
            css_template="",
            js_template="",
            paper_size="A4",
            orientation="portrait",
        )

        response = self.client.put(
            f"/api/inventory/print-formats/{print_format.id}/update/",
            {
                "document_type": "medicine",
                "name": "Updated Layout",
                "slug": "updated-layout",
                "template_key": "invoice",
                "description": "Updated",
                "html_template": "<div>New</div>",
                "css_template": ".page { color: red; }",
                "js_template": "console.log('updated');",
                "paper_size": "Letter",
                "orientation": "landscape",
                "is_default": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        print_format.refresh_from_db()
        self.assertEqual(print_format.document_type, "stock_entry")
        self.assertEqual(print_format.name, "Updated Layout")
        self.assertEqual(print_format.slug, "updated-layout")
        self.assertEqual(print_format.template_key, "invoice")
        self.assertEqual(print_format.paper_size, "Letter")
        self.assertEqual(print_format.orientation, "landscape")

    def test_default_print_format_cannot_be_deleted(self):
        default_format = PrintFormat.objects.create(
            document_type="stock_entry",
            name="Protected Default",
            slug="protected-default",
            template_key="standard",
            description="Default",
            html_template="",
            css_template="",
            js_template="",
            paper_size="A4",
            orientation="portrait",
            is_default=True,
        )

        response = self.client.delete(
            f"/api/inventory/print-formats/{default_format.id}/delete/"
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["error"], "Default print formats cannot be deleted."
        )

    def test_non_default_print_format_can_be_deleted(self):
        print_format = PrintFormat.objects.create(
            document_type="stock_entry",
            name="Delete Me",
            slug="delete-me",
            template_key="standard",
            description="Delete target",
            html_template="",
            css_template="",
            js_template="",
            paper_size="A4",
            orientation="portrait",
            is_default=False,
        )

        response = self.client.delete(
            f"/api/inventory/print-formats/{print_format.id}/delete/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(PrintFormat.objects.filter(id=print_format.id).exists())
