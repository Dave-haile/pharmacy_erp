# Generated manually for stock entry support.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tables", "0008_medicine_naming_series_medicinenamingseries"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="StockEntry",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("posting_number", models.CharField(blank=True, max_length=30, unique=True)),
                ("invoice_number", models.CharField(db_index=True, max_length=50)),
                (
                    "status",
                    models.CharField(
                        choices=[("draft", "Draft"), ("posted", "Posted"), ("cancelled", "Cancelled")],
                        db_index=True,
                        default="draft",
                        max_length=20,
                    ),
                ),
                ("total_cost", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("tax", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("grand_total", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "goods_receiving_note",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="stock_entries",
                        to="tables.goodrecivingnote",
                    ),
                ),
                (
                    "purchase",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="stock_entries",
                        to="tables.purchase",
                    ),
                ),
                (
                    "received_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="stock_entries_received",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "supplier",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="stock_entries",
                        to="tables.supplier",
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "Stock Entries",
                "db_table": "StockEntry",
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(fields=["supplier", "created_at"], name="StockEntry_supplie_770f4e_idx"),
                    models.Index(fields=["status", "created_at"], name="StockEntry_status_32d4bb_idx"),
                    models.Index(fields=["invoice_number"], name="StockEntry_invoice_21fef0_idx"),
                ],
            },
        ),
        migrations.CreateModel(
            name="StockEntryItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("quantity", models.PositiveIntegerField()),
                ("unit_price", models.DecimalField(decimal_places=2, max_digits=10)),
                ("total_price", models.DecimalField(decimal_places=2, max_digits=12)),
                ("manufacturing_date", models.DateField()),
                ("expiry_date", models.DateField()),
                ("reference", models.CharField(blank=True, max_length=100)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "batch",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="stock_entry_items",
                        to="tables.batches",
                    ),
                ),
                (
                    "medicine",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="stock_entry_items",
                        to="tables.medicine",
                    ),
                ),
                (
                    "stock_entry",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="items",
                        to="tables.stockentry",
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "Stock Entry Items",
                "db_table": "StockEntryItem",
                "indexes": [
                    models.Index(fields=["stock_entry", "medicine"], name="StockEntryI_stock_e_69f8ef_idx"),
                    models.Index(fields=["batch"], name="StockEntryI_batch_i_a8ad4a_idx"),
                ],
            },
        ),
    ]
