# Generated migration for Stock Take models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('tables', '0027_tableregistry_columns'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='StockTake',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('posting_number', models.CharField(blank=True, db_index=True, max_length=20, null=True, unique=True)),
                ('title', models.CharField(help_text='Stock take title/reference', max_length=200)),
                ('notes', models.TextField(blank=True)),
                ('status', models.CharField(choices=[('Draft', 'Draft'), ('In Progress', 'In Progress'), ('Completed', 'Completed'), ('Cancelled', 'Cancelled')], default='Draft', max_length=20)),
                ('started_at', models.DateTimeField(blank=True, null=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='stock_takes', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'StockTake',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='StockTakeItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('system_quantity', models.DecimalField(decimal_places=2, help_text='Quantity in system before count', max_digits=10)),
                ('counted_quantity', models.DecimalField(decimal_places=2, help_text='Actual counted quantity', max_digits=10)),
                ('unit_cost', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('notes', models.TextField(blank=True)),
                ('counted_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('batch', models.ForeignKey(blank=True, help_text='Optional batch reference for batch-specific counting', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='stock_take_items', to='tables.batches')),
                ('counted_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='counted_stock_take_items', to=settings.AUTH_USER_MODEL)),
                ('medicine', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='stock_take_items', to='tables.medicine')),
                ('stock_take', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='inventory.stocktake')),
            ],
            options={
                'db_table': 'StockTakeItem',
                'ordering': ['stock_take', 'medicine__name'],
            },
        ),
        migrations.AlterUniqueTogether(
            name='stocktakeitem',
            unique_together={('stock_take', 'medicine', 'batch')},
        ),
    ]
