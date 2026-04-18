from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from music_club.config import ADMIN_USERNAME, ADMIN_PASSWORD, DEVELOPER_EMAIL

class Command(BaseCommand):
    help = 'Create Vibe Music admin user with new developer credentials'

    def handle(self, *args, **options):
        self.stdout.write('Creating Vibe Music admin user...')
        
        try:
            # Check if admin user already exists
            if User.objects.filter(username=ADMIN_USERNAME).exists():
                # Update existing admin user
                admin_user = User.objects.get(username=ADMIN_USERNAME)
                admin_user.email = DEVELOPER_EMAIL
                admin_user.set_password(ADMIN_PASSWORD)
                admin_user.is_staff = True
                admin_user.is_superuser = True
                admin_user.save()
                self.stdout.write(self.style.SUCCESS(f'Updated existing admin user: {ADMIN_USERNAME}'))
            else:
                # Create new admin user
                admin_user = User.objects.create_user(
                    username=ADMIN_USERNAME,
                    email=DEVELOPER_EMAIL,
                    password=ADMIN_PASSWORD,
                    is_staff=True,
                    is_superuser=True
                )
                self.stdout.write(self.style.SUCCESS(f'Created new admin user: {ADMIN_USERNAME}'))
            
            self.stdout.write(self.style.SUCCESS(f'Admin credentials:'))
            self.stdout.write(self.style.SUCCESS(f'  Username: {ADMIN_USERNAME}'))
            self.stdout.write(self.style.SUCCESS(f'  Password: {ADMIN_PASSWORD}'))
            self.stdout.write(self.style.SUCCESS(f'  Email: {DEVELOPER_EMAIL}'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating admin user: {str(e)}'))
