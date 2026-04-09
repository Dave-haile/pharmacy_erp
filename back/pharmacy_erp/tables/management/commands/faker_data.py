from django.core.management.base import BaseCommand
from faker import Faker

import random
from decimal import Decimal

from django.contrib.auth import get_user_model
from tables.model_definitions import Supplier, Medicine, Inventory, Category

User = get_user_model()


class Command(BaseCommand):
    help = "Seed database with mock pharmacy data"

    def handle(self, *args, **kwargs):
        fake = Faker()

        self.stdout.write(self.style.SUCCESS("Seeding database..."))

        # 1️⃣ Create Users
        for i in range(5):
            User.objects.create_user(
                email=fake.email(),
                password="wsadqe",
                role="cashier",
                first_name=fake.first_name(),
                last_name=fake.last_name(),
            )

        # 2️⃣ Create Categories
        categories = []
        for _ in range(5):
            category = Category.objects.create(
                name=fake.unique.word().capitalize(),
                description=fake.text()
            )
            categories.append(category)

        # 3️⃣ Create Suppliers
        suppliers = []
        for _ in range(5):
            supplier = Supplier.objects.create(
                name=fake.company(),
                contact_person=fake.name(),
                phone=fake.phone_number(),
                email=fake.email(),
                address=fake.address(),
            )
            suppliers.append(supplier)

        # 4️⃣ Create Medicines
        medicines = []
        for _ in range(20):
            medicine = Medicine.objects.create(
                name=fake.word().capitalize(),
                generic_name=fake.word(),
                category=random.choice(categories),
                supplier=random.choice(suppliers),
                cost_price=Decimal(random.uniform(10, 50)).quantize(Decimal("0.01")),
                selling_price=Decimal(random.uniform(60, 120)).quantize(Decimal("0.01")),
                barcode=fake.unique.ean13(),
                description=fake.text(),
                is_active=True,
            )
            medicines.append(medicine)

        # 5️⃣ Create Inventory
        for medicine in medicines:
            Inventory.objects.create(
                medicine=medicine,
                quantity=random.randint(50, 200),
                batch_number=fake.unique.bothify(text="BATCH-#####"),
                expiry_date=fake.date_between(start_date="+30d", end_date="+365d"),
                location="Main Store"
            )

        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))