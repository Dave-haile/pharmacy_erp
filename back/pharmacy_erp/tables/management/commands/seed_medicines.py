# pharmacy/management/commands/seed_medicines.py
from django.core.management.base import BaseCommand
from tables.models import Category, Supplier, Medicine
from decimal import Decimal

class Command(BaseCommand):
    help = 'Seed database with initial medicine data'

    def handle(self, *args, **kwargs):
        # First, create categories
        categories = {
            'raw_materials': Category.objects.get_or_create(
                name='Raw Materials',
                defaults={'description': 'Active pharmaceutical ingredients and raw materials'}
            )[0],
            'packaging': Category.objects.get_or_create(
                name='Packaging & Excipients',
                defaults={'description': 'Packaging materials and pharmaceutical excipients'}
            )[0],
            'solvents': Category.objects.get_or_create(
                name='Solvents',
                defaults={'description': 'Industrial and pharmaceutical grade solvents'}
            )[0],
        }

        # Create a default supplier (you can modify this based on your needs)
        default_supplier, _ = Supplier.objects.get_or_create(
            name='PharmaSource International',
            defaults={
                'contact_person': 'John Smith',
                'phone': '+1-555-0123',
                'email': 'orders@pharmasource.com',
                'address': '123 Pharma Blvd, Chemical City, CC 12345'
            }
        )

        # Medicine seed data
        medicines_data = [
            {
                "name": "Aspirin Active Pharmaceutical Ingredient",
                "generic_name": "Acetylsalicylic Acid",
                "category": categories['raw_materials'],
                "supplier": default_supplier,
                "cost_price": Decimal("120.00"),
                "selling_price": Decimal("150.00"),
                "barcode": "RAWASP001123",
                "description": "High purity aspirin API for pharmaceutical manufacturing",
                "is_active": True,
            },
            {
                "name": "Metformin Hydrochloride Pure",
                "generic_name": "Metformin HCl",
                "category": categories['raw_materials'],
                "supplier": default_supplier,
                "cost_price": Decimal("450.00"),
                "selling_price": Decimal("525.00"),
                "barcode": "RAWMET500456",
                "description": "Pure metformin hydrochloride for diabetes medication",
                "is_active": True,
            },
            {
                "name": "Pharma-Grade Gelatin Shells",
                "generic_name": "Gelatin Capsules",
                "category": categories['packaging'],
                "supplier": default_supplier,
                "cost_price": Decimal("85.00"),
                "selling_price": Decimal("110.00"),
                "barcode": "CAP0000789",
                "description": "Empty gelatin capsules for pharmaceutical encapsulation",
                "is_active": True,
            },
            {
                "name": "Industrial Ethanol 99%",
                "generic_name": "Ethanol",
                "category": categories['solvents'],
                "supplier": default_supplier,
                "cost_price": Decimal("12.50"),
                "selling_price": Decimal("18.75"),
                "barcode": "SOLETH99012",
                "description": "High purity ethanol suitable for pharmaceutical use",
                "is_active": True,
            },
            {
                "name": "Saline Solution Buffer",
                "generic_name": "Sodium Chloride Solution",
                "category": categories['raw_materials'],
                "supplier": default_supplier,
                "cost_price": Decimal("5.20"),
                "selling_price": Decimal("8.99"),
                "barcode": "RAWSAL10034",
                "description": "Sterile saline solution for medical preparations",
                "is_active": True,
            },
            {
                "name": "Amoxicillin Trihydrate",
                "generic_name": "Amoxicillin",
                "category": categories['raw_materials'],
                "supplier": default_supplier,
                "cost_price": Decimal("310.00"),
                "selling_price": Decimal("375.00"),
                "barcode": "RAWAMX25056",
                "description": "Broad-spectrum antibiotic API",
                "is_active": True,
            },
            {
                "name": "Ibuprofen USP Grade",
                "generic_name": "Ibuprofen",
                "category": categories['raw_materials'],
                "supplier": default_supplier,
                "cost_price": Decimal("180.00"),
                "selling_price": Decimal("225.00"),
                "barcode": "RAWIBU40078",
                "description": "USP grade ibuprofen for pain relief medications",
                "is_active": True,
            },
            {
                "name": "Paracetamol Micronized",
                "generic_name": "Acetaminophen",
                "category": categories['raw_materials'],
                "supplier": default_supplier,
                "cost_price": Decimal("95.00"),
                "selling_price": Decimal("125.00"),
                "barcode": "RAWPAR50090",
                "description": "Micronized paracetamol for better dissolution",
                "is_active": True,
            },
            {
                "name": "Omeprazole Pellets 8.5%",
                "generic_name": "Omeprazole",
                "category": categories['raw_materials'],
                "supplier": default_supplier,
                "cost_price": Decimal("520.00"),
                "selling_price": Decimal("650.00"),
                "barcode": "RAWOME02011",
                "description": "Enteric-coated omeprazole pellets for acid reflux medication",
                "is_active": True,
            },
            {
                "name": "Atorvastatin Calcium",
                "generic_name": "Atorvastatin",
                "category": categories['raw_materials'],
                "supplier": default_supplier,
                "cost_price": Decimal("1250.00"),
                "selling_price": Decimal("1500.00"),
                "barcode": "RAWATO01022",
                "description": "Cholesterol-lowering medication API",
                "is_active": True,
            },
            {
                "name": "Lisinopril Dihydrate",
                "generic_name": "Lisinopril",
                "category": categories['raw_materials'],
                "supplier": default_supplier,
                "cost_price": Decimal("890.00"),
                "selling_price": Decimal("1075.00"),
                "barcode": "RAWLIS00533",
                "description": "ACE inhibitor for hypertension treatment",
                "is_active": True,
            },
            {
                "name": "Azithromycin Dihydrate",
                "generic_name": "Azithromycin",
                "category": categories['raw_materials'],
                "supplier": default_supplier,
                "cost_price": Decimal("640.00"),
                "selling_price": Decimal("800.00"),
                "barcode": "RAWAZI25044",
                "description": "Macrolide antibiotic API",
                "is_active": True,
            },
            {
                "name": "Sertraline Hydrochloride",
                "generic_name": "Sertraline",
                "category": categories['raw_materials'],
                "supplier": default_supplier,
                "cost_price": Decimal("720.00"),
                "selling_price": Decimal("895.00"),
                "barcode": "RAWSER05055",
                "description": "SSRI antidepressant API",
                "is_active": True,
            },
            {
                "name": "Amlodipine Besylate",
                "generic_name": "Amlodipine",
                "category": categories['raw_materials'],
                "supplier": default_supplier,
                "cost_price": Decimal("410.00"),
                "selling_price": Decimal("525.00"),
                "barcode": "RAWAML00566",
                "description": "Calcium channel blocker for hypertension",
                "is_active": True,
            },
            {
                "name": "Hydrochlorothiazide",
                "generic_name": "Hydrochlorothiazide",
                "category": categories['raw_materials'],
                "supplier": default_supplier,
                "cost_price": Decimal("230.00"),
                "selling_price": Decimal("300.00"),
                "barcode": "RAWHCT02577",
                "description": "Diuretic medication API",
                "is_active": True,
            }
        ]

        # Create medicines
        for medicine_data in medicines_data:
            medicine, created = Medicine.objects.get_or_create(
                barcode=medicine_data['barcode'],
                defaults=medicine_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created medicine: {medicine.name}'))
            else:
                self.stdout.write(f'Medicine already exists: {medicine.name}')

        self.stdout.write(self.style.SUCCESS('Successfully seeded medicine data'))