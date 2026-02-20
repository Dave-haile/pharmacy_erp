from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from auth.models import User


class Command(BaseCommand):
    help = 'Create test tokens for development and testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=5,
            help='Number of test tokens to create'
        )

    def handle(self, *args, **options):
        count = options['count']
        
        # Get or create a test user
        user, created = User.objects.get_or_create(
            email='test@example.com',
            defaults={
                'first_name': 'Test',
                'last_name': 'User',
                'role': 'pharmacist',
                'is_active': True,
            }
        )
        
        if created:
            user.set_password('testpass123')
            user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Created test user: {user.email}')
            )
        
        # Create test tokens
        created_count = 0
        blacklisted_count = 0
        
        for i in range(count):
            # Create a token
            token = AccessToken.for_user(user)
            
            # Vary expiry times
            if i % 3 == 0:
                # Some tokens expired
                expires_at = timezone.now() - timedelta(hours=1)
            elif i % 3 == 1:
                # Some tokens expiring soon
                expires_at = timezone.now() + timedelta(hours=2)
            else:
                # Some tokens with long expiry
                expires_at = timezone.now() + timedelta(days=1)
            
            # Set the expiry
            token.set_exp(lifetime=expires_at - timezone.now())
            
            # Create outstanding token
            outstanding_token = OutstandingToken.objects.create(
                user=user,
                jti=token['jti'],
                token=str(token),
                created_at=timezone.now() - timedelta(minutes=i*10),
                expires_at=expires_at
            )
            created_count += 1
            
            # Blacklist some tokens
            if i % 2 == 0:
                BlacklistedToken.objects.create(token=outstanding_token)
                blacklisted_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Created {created_count} test tokens ({blacklisted_count} blacklisted)'
            )
        )
        
        # Create tokens for admin user if exists
        admin_users = User.objects.filter(is_staff=True)
        for admin_user in admin_users[:2]:  # Limit to first 2 admin users
            token = AccessToken.for_user(admin_user)
            expires_at = timezone.now() + timedelta(hours=8)
            token.set_exp(lifetime=expires_at - timezone.now())
            
            OutstandingToken.objects.create(
                user=admin_user,
                jti=token['jti'],
                token=str(token),
                created_at=timezone.now() - timedelta(minutes=5),
                expires_at=expires_at
            )
            created_count += 1
            
            self.stdout.write(
                self.style.SUCCESS(f'Created token for admin user: {admin_user.email}')
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Total tokens created: {created_count}. Check the Django admin to view them.'
            )
        )
