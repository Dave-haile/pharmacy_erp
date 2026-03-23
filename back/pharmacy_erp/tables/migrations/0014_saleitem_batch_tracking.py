from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tables", "0013_sale_stock_out_workflow"),
    ]

    operations = [
        migrations.AddField(
            model_name="saleitem",
            name="batch",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.PROTECT,
                related_name="sale_items",
                to="tables.batches",
            ),
        ),
        migrations.RemoveIndex(
            model_name="saleitem",
            name="SaleItem_sale_id_0248c3_idx",
        ),
        migrations.AddIndex(
            model_name="saleitem",
            index=models.Index(
                fields=["sale", "medicine", "batch"],
                name="SaleItem_sale_id_41eae0_idx",
            ),
        ),
    ]
