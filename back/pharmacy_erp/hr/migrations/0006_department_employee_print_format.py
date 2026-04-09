from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tables", "0024_document_print_format_links"),
        ("hr", "0005_merge_20260331_1609"),
    ]

    operations = [
        migrations.AddField(
            model_name="department",
            name="print",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="departments",
                to="tables.printformat",
            ),
        ),
        migrations.AddField(
            model_name="employee",
            name="print",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="employees",
                to="tables.printformat",
            ),
        ),
    ]
