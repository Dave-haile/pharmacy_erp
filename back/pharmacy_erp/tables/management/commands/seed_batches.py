from django.core.management.base import BaseCommand
from tables.models import Batches

class Command(BaseCommand):
    help = 'Seed database with pharmaceutical Batches'

    def handle(self, *args, **kwargs):
        batches_data = [
            {
            "product_id":1,
            "batch_number":"BATCH001",
            "expiry_date":"2025-12-31",
            "manufacturing_date":"2025-01-01",
            "quantity":100,
            "purchase_price":10.00,
            "supplier_id":1
            },
            
        ]
        