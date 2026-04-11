"""
Management command to generate reorder and expiry alerts.
Run periodically via cron or scheduler.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from decimal import Decimal

from tables.model_definitions import (
    Batches,
    Medicine,
    ReorderAlert,
    ReorderConfig,
    ExpiryNotification,
    ExpiryConfig,
)


class Command(BaseCommand):
    help = "Generate reorder and expiry alerts based on current inventory"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reorder",
            action="store_true",
            help="Only generate reorder alerts",
        )
        parser.add_argument(
            "--expiry",
            action="store_true",
            help="Only generate expiry alerts",
        )

    def handle(self, *args, **options):
        generate_reorder = not options["expiry"]
        generate_expiry = not options["reorder"]

        if options["reorder"] or (generate_reorder and not options["expiry"]):
            self.generate_reorder_alerts()

        if options["expiry"] or (generate_expiry and not options["reorder"]):
            self.generate_expiry_notifications()

    @transaction.atomic
    def generate_reorder_alerts(self):
        """Generate reorder alerts for medicines below reorder level."""
        self.stdout.write("Generating reorder alerts...")

        # Get all medicines with reorder config
        configs = ReorderConfig.objects.filter(is_active=True).select_related("medicine")

        alerts_created = 0
        alerts_resolved = 0

        for config in configs:
            medicine = config.medicine

            # Calculate current stock
            batches = Batches.objects.filter(
                product_id=medicine, quantity__gt=0
            )
            current_stock = sum(b.quantity for b in batches)

            # Check if alert should be triggered
            if current_stock <= config.reorder_level:
                # Check for existing active alert
                existing_alert = ReorderAlert.objects.filter(
                    medicine=medicine,
                    status__in=[ReorderAlert.STATUS_ACTIVE, ReorderAlert.STATUS_ACKNOWLEDGED],
                ).first()

                if not existing_alert:
                    # Determine priority
                    if current_stock == 0:
                        priority = ReorderAlert.PRIORITY_CRITICAL
                    elif current_stock <= config.safety_stock:
                        priority = ReorderAlert.PRIORITY_HIGH
                    else:
                        priority = ReorderAlert.PRIORITY_MEDIUM

                    ReorderAlert.objects.create(
                        medicine=medicine,
                        current_stock=current_stock,
                        reorder_level=config.reorder_level,
                        status=ReorderAlert.STATUS_ACTIVE,
                        priority=priority,
                    )
                    alerts_created += 1
            else:
                # Resolve any active alerts if stock is replenished
                resolved = ReorderAlert.objects.filter(
                    medicine=medicine,
                    status__in=[ReorderAlert.STATUS_ACTIVE, ReorderAlert.STATUS_ACKNOWLEDGED],
                ).update(status=ReorderAlert.STATUS_RESOLVED, resolved_at=timezone.now())
                alerts_resolved += resolved

        self.stdout.write(
            self.style.SUCCESS(
                f"Reorder alerts: {alerts_created} created, {alerts_resolved} resolved"
            )
        )

    @transaction.atomic
    def generate_expiry_notifications(self):
        """Generate expiry notifications for batches approaching expiration."""
        self.stdout.write("Generating expiry notifications...")

        config = ExpiryConfig.get_config()
        today = timezone.localdate()

        # Get batches that will expire within warning period
        batches = Batches.objects.filter(
            quantity__gt=0,
            expiry_date__lte=today + timezone.timedelta(days=config.warning_days),
        ).select_related("product_id")

        notifications_created = 0
        notifications_updated = 0

        for batch in batches:
            days_to_expiry = (batch.expiry_date - today).days
            medicine = batch.product_id

            # Determine priority
            priority = ExpiryNotification.calculate_priority(days_to_expiry)

            # Determine notification type
            if days_to_expiry <= 0:
                notification_type = "expired"
            elif days_to_expiry <= config.critical_days:
                notification_type = "expiry_warning"
            else:
                notification_type = "expiry_warning"

            # Check for existing notification
            existing = ExpiryNotification.objects.filter(
                batch=batch, status=ExpiryNotification.STATUS_PENDING
            ).first()

            if existing:
                # Update existing notification
                existing.days_to_expiry = days_to_expiry
                existing.quantity_at_risk = batch.quantity
                existing.priority = priority
                existing.notification_type = notification_type
                existing.save()
                notifications_updated += 1
            else:
                # Create new notification
                ExpiryNotification.objects.create(
                    batch=batch,
                    medicine=medicine,
                    expiry_date=batch.expiry_date,
                    days_to_expiry=days_to_expiry,
                    quantity_at_risk=batch.quantity,
                    status=ExpiryNotification.STATUS_PENDING,
                    priority=priority,
                    notification_type=notification_type,
                )
                notifications_created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Expiry notifications: {notifications_created} created, {notifications_updated} updated"
            )
        )