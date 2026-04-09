# models/management/commands/seed_data.py
from django.core.management.base import BaseCommand

from tables.model_definitions.seeder.inventory_hub_seeder import InventoryHubSeeder


class Command(BaseCommand):
    help = 'Seed the database with initial data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--truncate',
            action='store_true',
            help='Truncate tables before seeding',
        )

    def handle(self, *args, **options):
        if options['truncate']:
            self.stdout.write(self.style.WARNING('Truncating tables...'))
            InventoryHubSeeder.truncate()
        
        self.stdout.write(self.style.SUCCESS('Starting to seed data...'))
        InventoryHubSeeder.seed()
        self.stdout.write(self.style.SUCCESS('Successfully seeded data!'))