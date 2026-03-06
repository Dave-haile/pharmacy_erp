# your_app_name/seeders/inventory_hub_seeder.py
from django.core.management.base import BaseCommand
from tables.modle.invertoryHub import InventoryHub

class InventoryHubSeeder:
    """
    Seeder class for InventoryHub model
    Usage: Call the seed() method to populate the database
    """
    
    @classmethod
    def seed(cls):
        """Main seeding method"""
        print("🌱 Seeding InventoryHub data...")
        
        # Your provided data
        data = [
            {'label': 'Inventory Control', 'path': '/inventory/control', 'highlighted': True},
            {'label': 'Medicine Master', 'path': '/inventory/medicine-master', 'highlighted': True},
            {'label': 'Medicine Grouping', 'path': '/inventory/medicine-grouping', 'highlighted': True},
            {'label': 'Medicine Bundles', 'path': '#', 'highlighted': True},
            {'label': 'Global Price List', 'path': '#', 'highlighted': False},
            {'label': 'SKU Pricing', 'path': '#', 'highlighted': False},
            {'label': 'Shipping Rules', 'path': '#', 'highlighted': False},
            {'label': 'Item Alternatives', 'path': '#', 'highlighted': False},
            {'label': 'Manufacturer Registry', 'path': '#', 'highlighted': False},
            {'label': 'Customs Tariff Database', 'path': '#', 'highlighted': False},
        ]
        
        created_count = 0
        updated_count = 0
        
        for item in data:
            # Use update_or_create to avoid duplicates
            obj, created = InventoryHub.objects.update_or_create(
                label=item['label'],  # Match by label to avoid duplicates
                defaults={
                    'path': item['path'],
                    'highlighted': item['highlighted']
                }
            )
            
            if created:
                created_count += 1
                print(f"  ✅ Created: {item['label']}")
            else:
                updated_count += 1
                print(f"  📝 Updated: {item['label']}")
        
        print(f"\n✨ Seeding complete! Created: {created_count}, Updated: {updated_count}")
        
    @classmethod
    def truncate(cls):
        """Delete all records from the table"""
        count = InventoryHub.objects.all().delete()[0]
        print(f"🗑️  Deleted {count} records from InventoryHub")
        return count