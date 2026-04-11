import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from hr.models import Department, Employee


class Command(BaseCommand):
    help = "Seed mock employees for HR testing."

    FIRST_NAMES = [
        "Amina", "Samuel", "Hana", "Dawit", "Meron", "Abel", "Ruth", "Biruk",
        "Meklit", "Nahom", "Elsa", "Surafel", "Liya", "Henok", "Rahel", "Natnael",
    ]
    LAST_NAMES = [
        "Tesfaye", "Bekele", "Abebe", "Kebede", "Wolde", "Tadesse", "Mekonnen", "Assefa",
        "Alemu", "Haile", "Demissie", "Getachew",
    ]
    DESIGNATIONS = [
        "HR Officer", "Cashier", "Pharmacist", "Store Keeper", "Sales Associate", "Supervisor",
    ]
    EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "intern"]
    GENDERS = ["male", "female"]

    def add_arguments(self, parser):
        parser.add_argument("--count", type=int, default=20)

    def handle(self, *args, **options):
        count = max(1, options["count"])
        departments = list(Department.objects.filter(is_active=True))
        if not departments:
            departments = [
                Department.objects.create(name="Human Resources"),
                Department.objects.create(name="Sales"),
                Department.objects.create(name="Warehouse"),
                Department.objects.create(name="Pharmacy"),
            ]

        created = 0
        today = timezone.localdate()

        for index in range(count):
            first_name = random.choice(self.FIRST_NAMES)
            last_name = random.choice(self.LAST_NAMES)
            middle_name = random.choice(self.LAST_NAMES)
            email = f"{first_name.lower()}.{last_name.lower()}.{Employee.objects.count() + index + 1}@example.com"

            if Employee.objects.filter(work_email=email).exists():
                continue

            hire_date = today - timedelta(days=random.randint(30, 1400))
            status = random.choice([Employee.STATUS_ACTIVE, Employee.STATUS_ACTIVE, Employee.STATUS_ON_LEAVE])

            Employee.objects.create(
                first_name=first_name,
                middle_name=middle_name,
                last_name=last_name,
                work_email=email,
                personal_email=f"{first_name.lower()}.{last_name.lower()}@gmail.com",
                phone=f"+2519{random.randint(10000000, 99999999)}",
                alternate_phone="",
                department=random.choice(departments),
                designation=random.choice(self.DESIGNATIONS),
                employment_type=random.choice(self.EMPLOYMENT_TYPES),
                status=status,
                gender=random.choice(self.GENDERS),
                date_of_birth=hire_date - timedelta(days=random.randint(7000, 14000)),
                hire_date=hire_date,
                confirmation_date=hire_date + timedelta(days=90),
                salary=f"{random.randint(8000, 35000)}.00",
                manager_name="System Seed",
                emergency_contact_name=f"{random.choice(self.FIRST_NAMES)} {random.choice(self.LAST_NAMES)}",
                emergency_contact_phone=f"+2519{random.randint(10000000, 99999999)}",
                address="Addis Ababa",
                notes="Seeded employee for HR testing.",
                is_active=True,
            )
            created += 1

        self.stdout.write(self.style.SUCCESS(f"Created {created} mock employees."))
