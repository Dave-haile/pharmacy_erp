from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tables", "0023_printformat_template_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="printformat",
            name="document_type",
            field=models.CharField(
                choices=[
                    ("medicine", "Medicine"),
                    ("supplier", "Supplier"),
                    ("employee", "Employee"),
                    ("department", "Department"),
                    ("category", "Category"),
                    ("stock_entry", "Stock Entry"),
                    ("stock_out", "Stock Out"),
                    ("stock_adjustment", "Stock Adjustment"),
                    ("sales_return", "Sales Return"),
                    ("supplier_return", "Supplier Return"),
                    ("purchase", "Purchase"),
                    ("grn", "GRN"),
                ],
                db_index=True,
                max_length=40,
            ),
        ),
        migrations.AddField(
            model_name="category",
            name="print",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="categories",
                to="tables.printformat",
            ),
        ),
        migrations.AddField(
            model_name="goodrecivingnote",
            name="print",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="goods_receiving_notes",
                to="tables.printformat",
            ),
        ),
        migrations.AddField(
            model_name="medicine",
            name="print",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="medicines",
                to="tables.printformat",
            ),
        ),
        migrations.AddField(
            model_name="purchase",
            name="print",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="purchases",
                to="tables.printformat",
            ),
        ),
        migrations.AddField(
            model_name="sale",
            name="print",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="sales",
                to="tables.printformat",
            ),
        ),
        migrations.AddField(
            model_name="salesreturn",
            name="print",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="sales_returns",
                to="tables.printformat",
            ),
        ),
        migrations.AddField(
            model_name="stockadjustment",
            name="print",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="stock_adjustments",
                to="tables.printformat",
            ),
        ),
        migrations.AddField(
            model_name="stockentry",
            name="print",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="stock_entries",
                to="tables.printformat",
            ),
        ),
        migrations.AddField(
            model_name="supplier",
            name="print",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="suppliers",
                to="tables.printformat",
            ),
        ),
        migrations.AddField(
            model_name="supplierreturn",
            name="print",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="supplier_returns",
                to="tables.printformat",
            ),
        ),
    ]
