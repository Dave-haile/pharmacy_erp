from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


User = get_user_model()


class Command(BaseCommand):
    help = "Seed default application users"

    def handle(self, *args, **options):
        users_to_seed = [
            {
                "email": "admin@pharmacy.com",
                "password": "wsadqe@123",
                "first_name": "System",
                "last_name": "Admin",
                "role": "admin",
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
            {
                "email": "manager@pharmacy.com",
                "password": "password",
                "first_name": "Store",
                "last_name": "Manager",
                "role": "manager",
                "is_staff": False,
                "is_superuser": False,
                "is_active": True,
            },
            {
                "email": "pharmacist@pharmacy.com",
                "password": "password",
                "first_name": "Main",
                "last_name": "Pharmacist",
                "role": "pharmacist",
                "is_staff": False,
                "is_superuser": False,
                "is_active": True,
            },
            {
                "email": "cashier@pharmacy.com",
                "password": "password",
                "first_name": "Front",
                "last_name": "Cashier",
                "role": "cashier",
                "is_staff": False,
                "is_superuser": False,
                "is_active": True,
            },
        ]

        for user_data in users_to_seed:
            password = user_data.pop("password")
            email = user_data["email"]

            user, created = User.objects.update_or_create(
                email=email,
                defaults=user_data,
            )
            user.set_password(password)
            user.save()

            action = "Created" if created else "Updated"
            self.stdout.write(
                self.style.SUCCESS(
                    f"{action} user: {email} ({user.role})"
                )
            )

        self.stdout.write(self.style.SUCCESS("Successfully seeded default users"))
