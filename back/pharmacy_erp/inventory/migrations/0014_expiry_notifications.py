# Generated migration for Expiry Notification models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('tables', '0027_tableregistry_columns'),
        ('inventory', '0013_reorder_alerts'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ExpiryNotification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('expiry_date', models.DateField(db_index=True)),
                ('days_to_expiry', models.PositiveIntegerField(help_text='Days until expiration')),
                ('quantity_at_risk', models.DecimalField(decimal_places=2, help_text='Quantity that will expire', max_digits=10)),
                ('status', models.CharField(choices=[('Pending', 'Pending'), ('Acknowledged', 'Acknowledged'), ('Actioned', 'Actioned'), ('Dismissed', 'Dismissed')], db_index=True, default='Pending', max_length=20)),
                ('priority', models.CharField(choices=[('Low', 'Low'), ('Medium', 'Medium'), ('High', 'High'), ('Critical', 'Critical')], db_index=True, default='Medium', max_length=20)),
                ('notification_type', models.CharField(default='expiry_warning', help_text='Type: expiry_warning, expired, or disposal_required', max_length=50)),
                ('notes', models.TextField(blank=True)),
                ('action_taken', models.TextField(blank=True, help_text='Description of action taken (discount, return, dispose)')),
                ('notified_at', models.DateTimeField(auto_now_add=True)),
                ('acknowledged_at', models.DateTimeField(blank=True, null=True)),
                ('actioned_at', models.DateTimeField(blank=True, null=True)),
                ('acknowledged_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='acknowledged_expiry_notifications', to=settings.AUTH_USER_MODEL)),
                ('actioned_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='actioned_expiry_notifications', to=settings.AUTH_USER_MODEL)),
                ('batch', models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name='expiry_notifications', to='tables.batches')),
                ('medicine', models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name='expiry_notifications', to='tables.medicine')),
            ],
            options={
                'db_table': 'ExpiryNotification',
                'ordering': ['expiry_date', '-priority'],
            },
        ),
        migrations.CreateModel(
            name='ExpiryConfig',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('warning_days', models.PositiveIntegerField(default=90, help_text='Days before expiry to start warnings')),
                ('critical_days', models.PositiveIntegerField(default=30, help_text='Days before expiry for critical alert')),
                ('notification_frequency_days', models.PositiveIntegerField(default=7, help_text='How often to send recurring notifications')),
                ('auto_dispose_expired', models.BooleanField(default=False, help_text='Automatically mark expired batches for disposal')),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'ExpiryConfig',
            },
        ),
        migrations.AddIndex(
            model_name='expirynotification',
            index=models.Index(fields=['status', 'priority'], name='inventory_en_status_priority_idx'),
        ),
        migrations.AddIndex(
            model_name='expirynotification',
            index=models.Index(fields=['expiry_date'], name='inventory_en_expiry_date_idx'),
        ),
        migrations.AddIndex(
            model_name='expirynotification',
            index=models.Index(fields=['medicine', 'status'], name='inventory_en_medicine_status_idx'),
        ),
    ]
