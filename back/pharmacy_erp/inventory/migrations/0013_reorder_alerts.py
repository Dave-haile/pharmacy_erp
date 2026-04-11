# Generated migration for Reorder Alert models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('tables', '0027_tableregistry_columns'),
        ('inventory', '0012_stock_take'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ReorderAlert',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('current_stock', models.DecimalField(decimal_places=2, help_text='Stock level when alert was triggered', max_digits=10)),
                ('reorder_level', models.DecimalField(decimal_places=2, help_text='Configured reorder level', max_digits=10)),
                ('status', models.CharField(choices=[('Active', 'Active'), ('Acknowledged', 'Acknowledged'), ('Resolved', 'Resolved'), ('Dismissed', 'Dismissed')], db_index=True, default='Active', max_length=20)),
                ('priority', models.CharField(choices=[('Low', 'Low'), ('Medium', 'Medium'), ('High', 'High'), ('Critical', 'Critical')], db_index=True, default='Medium', max_length=20)),
                ('notes', models.TextField(blank=True)),
                ('triggered_at', models.DateTimeField(auto_now_add=True)),
                ('acknowledged_at', models.DateTimeField(blank=True, null=True)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('acknowledged_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='acknowledged_reorder_alerts', to=settings.AUTH_USER_MODEL)),
                ('medicine', models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name='reorder_alerts', to='tables.medicine')),
            ],
            options={
                'db_table': 'ReorderAlert',
                'ordering': ['-triggered_at'],
            },
        ),
        migrations.CreateModel(
            name='ReorderConfig',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reorder_level', models.DecimalField(decimal_places=2, default=10, help_text='Stock level that triggers reorder alert', max_digits=10)),
                ('safety_stock', models.DecimalField(decimal_places=2, default=5, help_text='Minimum safety stock to maintain', max_digits=10)),
                ('reorder_quantity', models.DecimalField(decimal_places=2, default=50, help_text='Default quantity to order when reorder is triggered', max_digits=10)),
                ('lead_time_days', models.PositiveIntegerField(default=7, help_text='Expected lead time for restocking in days')),
                ('is_active', models.BooleanField(default=True)),
                ('last_updated', models.DateTimeField(auto_now=True)),
                ('medicine', models.OneToOneField(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name='reorder_config', to='tables.medicine')),
            ],
            options={
                'db_table': 'ReorderConfig',
            },
        ),
    ]
