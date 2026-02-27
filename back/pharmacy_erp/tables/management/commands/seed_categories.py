# pharmacy/management/commands/seed_categories.py
from django.core.management.base import BaseCommand
from tables.models import Category

class Command(BaseCommand):
    help = 'Seed database with pharmaceutical categories'

    def handle(self, *args, **kwargs):
        categories_data = [
            {
                "name": "Antibiotics",
                "description": "Medications used to treat bacterial infections including penicillins, cephalosporins, macrolides, and tetracyclines"
            },
            {
                "name": "Analgesics",
                "description": "Pain relievers including NSAIDs, opioids, and combination pain medications"
            },
            {
                "name": "Cardiovascular",
                "description": "Medications for heart conditions including antihypertensives, statins, beta-blockers, and ACE inhibitors"
            },
            {
                "name": "Antidiabetics",
                "description": "Medications for diabetes management including insulin, metformin, and other oral hypoglycemics"
            },
            {
                "name": "Gastrointestinal",
                "description": "Medications for digestive system including antacids, PPIs, antiemetics, and laxatives"
            },
            {
                "name": "Respiratory",
                "description": "Medications for respiratory conditions including bronchodilators, corticosteroids, and antihistamines"
            },
            {
                "name": "Central Nervous System",
                "description": "Medications affecting the brain and nerves including antidepressants, antipsychotics, and anticonvulsants"
            },
            {
                "name": "Hormones",
                "description": "Hormonal medications including thyroid hormones, contraceptives, and corticosteroids"
            },
            {
                "name": "Vitamins & Supplements",
                "description": "Dietary supplements, vitamins, minerals, and nutritional products"
            },
            {
                "name": "Topical Preparations",
                "description": "Creams, ointments, gels, and lotions for external use including antifungals and steroids"
            },
            {
                "name": "Ophthalmics",
                "description": "Eye care medications including eye drops, ointments, and solutions"
            },
            {
                "name": "Raw Materials",
                "description": "Active pharmaceutical ingredients (APIs) and bulk chemicals for compounding"
            },
            {
                "name": "Packaging & Excipients",
                "description": "Packaging materials and inactive pharmaceutical ingredients"
            },
            {
                "name": "Solvents",
                "description": "Pharmaceutical grade solvents and solutions"
            },
            {
                "name": "Vaccines",
                "description": "Immunizations and biological products"
            },
            {
                "name": "Antivirals",
                "description": "Medications for viral infections including influenza, HIV, and hepatitis treatments"
            },
            {
                "name": "Antifungals",
                "description": "Medications for fungal infections including topical and systemic treatments"
            },
            {
                "name": "Musculoskeletal",
                "description": "Medications for muscle and bone conditions including muscle relaxants and osteoporosis treatments"
            },
            {
                "name": "Dermatologicals",
                "description": "Skin care medications including acne treatments, antifungals, and corticosteroids"
            },
            {
                "name": "Oncology",
                "description": "Cancer treatments including chemotherapy drugs and supportive care medications"
            }
        ]

        for category_data in categories_data:
            category, created = Category.objects.get_or_create(
                name=category_data['name'],
                defaults={'description': category_data['description']}
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created category: {category.name}')
                )
            else:
                # Update description if category already exists
                if category.description != category_data['description']:
                    category.description = category_data['description']
                    category.save()
                    self.stdout.write(
                        self.style.WARNING(f'Updated category: {category.name}')
                )
                else:
                    self.stdout.write(f'Category already exists: {category.name}')

        self.stdout.write(
            self.style.SUCCESS('Successfully seeded all categories')
        )