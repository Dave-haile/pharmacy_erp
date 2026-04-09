

from django.core.management.base import BaseCommand
from tables.model_definitions import Supplier


class Command(BaseCommand):
    help = "Seed database with initial supplier data"

    def handle(self, *args, **options):
        suppler = [
                {
                    "name": "MediSupply Solutions",
                    "contact_person": "Sarah Johnson",
                    "phone": "+1-555-0456",
                    "email": "procurement@medisupply.net",
                    "address": "456 Healthcare Ave, Medical District, MD 67890",
                },
                {
                    "name": "Global API Traders",
                    "contact_person": "Michael Chen",
                    "phone": "+1-555-0789",
                    "email": "m.chen@globalapitraders.com",
                    "address": "789 Commerce St, Industrial Park, IP 45678",
                },
                {
                    "name": "PurePharma Ltd",
                    "contact_person": "Emily Rodriguez",
                    "phone": "+1-555-0321",
                    "email": "sales@purepharma.co.uk",
                    "address": "321 Research Park, Science City, SC 78901"
                },
                {
                    "name": "ChemDistributors Inc",
                    "contact_person": "David Kim",
                    "phone": "+1-555-0654",
                    "email": "d.kim@chemdistributors.com",
                    "address": "555 Chemical Lane, Compound Valley, CV 23456",
                },
                {
                    "name": "MediCo Pharmaceuticals",
                    "contact_person": "Lisa Thompson",
                    "phone": "+1-555-0987",
                    "email": "orders@medicopharma.eu",
                    "address": "888 Wellness Way, Health City, HC 34567",
                },
                {
                    "name": "API Direct Source",
                    "contact_person": "James Wilson",
                    "phone": "+1-555-0147",
                    "email": "j.wilson@apidirect.com",
                    "address": "222 Raw Material Rd, Industrial Zone, IZ 89012",
                },
                {
                    "name": "VetPharma Supplies",
                    "contact_person": "Patricia Martinez",
                    "phone": "+1-555-0369",
                    "email": "p.martinez@vetpharma.org",
                    "address": "777 Animal Health Blvd, Vet Town, VT 45612"
                },
                {
                    "name": "BioChems International",
                    "contact_person": "Robert Taylor",
                    "phone": "+1-555-0258",
                    "email": "r.taylor@biochems.co",
                    "address": "444 Bio Plaza, Research Triangle, RT 78945"
                },
                {
                    "name": "PharmaLink Global",
                    "contact_person": "Jennifer White",
                    "phone": "+1-555-0741",
                    "email": "j.white@pharmalink.global",
                    "address": "666 Distribution Ave, Logistics Park, LP 12378"
                }
            ]
        for supplier in suppler:
            supplier, created = Supplier.objects.get_or_create(
                name=supplier['name'], 
                contact_person=supplier['contact_person'], 
                phone=supplier['phone'], 
                email=supplier['email'], 
                address=supplier['address']
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f'Created supplier: {supplier.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'Supplier already exists: {supplier.name}'))

        self.stdout.write(self.style.SUCCESS('Successfully seeded all suppliers'))