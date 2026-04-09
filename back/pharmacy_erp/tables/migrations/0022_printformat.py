from django.db import migrations, models


def seed_default_print_formats(apps, schema_editor):
    PrintFormat = apps.get_model("tables", "PrintFormat")

    defaults = [
        {
            "document_type": "stock_entry",
            "name": "Standard Stock Entry",
            "slug": "standard",
            "template_key": "standard",
            "description": "Full-page supplier receipt layout for stock entries.",
            "paper_size": "A4",
            "orientation": "portrait",
            "is_active": True,
            "is_default": True,
        },
        {
            "document_type": "stock_entry",
            "name": "Compact Stock Entry",
            "slug": "compact",
            "template_key": "compact",
            "description": "Condensed stock entry layout for quick review.",
            "paper_size": "A4",
            "orientation": "portrait",
            "is_active": True,
            "is_default": False,
        },
        {
            "document_type": "stock_out",
            "name": "Sales Invoice",
            "slug": "invoice",
            "template_key": "invoice",
            "description": "Customer-facing invoice layout for stock-out documents.",
            "paper_size": "A4",
            "orientation": "portrait",
            "is_active": True,
            "is_default": True,
        },
        {
            "document_type": "stock_out",
            "name": "Receipt Preview",
            "slug": "receipt",
            "template_key": "receipt",
            "description": "Compact receipt-style preview for stock-out documents.",
            "paper_size": "Letter",
            "orientation": "portrait",
            "is_active": True,
            "is_default": False,
        },
    ]

    for payload in defaults:
        PrintFormat.objects.update_or_create(
            document_type=payload["document_type"],
            slug=payload["slug"],
            defaults=payload,
        )


def remove_default_print_formats(apps, schema_editor):
    PrintFormat = apps.get_model("tables", "PrintFormat")
    PrintFormat.objects.filter(
        document_type__in=["stock_entry", "stock_out"],
        slug__in=["standard", "compact", "invoice", "receipt"],
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("tables", "0021_rename_sale_status_9b0f4b_idx_sale_status_e6014d_idx_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="PrintFormat",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("document_type", models.CharField(choices=[("stock_entry", "Stock Entry"), ("stock_out", "Stock Out"), ("stock_adjustment", "Stock Adjustment"), ("sales_return", "Sales Return"), ("supplier_return", "Supplier Return"), ("purchase", "Purchase"), ("grn", "GRN")], db_index=True, max_length=40)),
                ("name", models.CharField(max_length=120)),
                ("slug", models.SlugField(max_length=160)),
                ("template_key", models.CharField(choices=[("standard", "Standard"), ("compact", "Compact"), ("invoice", "Invoice"), ("receipt", "Receipt")], max_length=40)),
                ("description", models.CharField(blank=True, max_length=255)),
                ("paper_size", models.CharField(choices=[("A4", "A4"), ("Letter", "Letter"), ("Thermal", "Thermal")], default="A4", max_length=20)),
                ("orientation", models.CharField(choices=[("portrait", "Portrait"), ("landscape", "Landscape")], default="portrait", max_length=20)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("is_default", models.BooleanField(db_index=True, default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "PrintFormat",
                "ordering": ["document_type", "-is_default", "name"],
            },
        ),
        migrations.AddConstraint(
            model_name="printformat",
            constraint=models.UniqueConstraint(fields=("document_type", "slug"), name="uniq_print_format_document_type_slug"),
        ),
        migrations.RunPython(seed_default_print_formats, remove_default_print_formats),
    ]
