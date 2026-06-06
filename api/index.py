import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'music_club.settings')

if os.environ.get('VERCEL') == '1' and os.environ.get('VERCEL_AUTO_MIGRATE', '1') == '1':
    import django
    from django.core.management import call_command

    django.setup()

    from django.contrib.auth.models import User
    from music_club.config import (
        ADMIN_USERNAME,
        ADMIN_PASSWORD,
        DEVELOPER_EMAIL,
        USER_DEFAULT_USERNAME,
        USER_DEFAULT_PASSWORD,
    )
    from User.models import Profile

    call_command('migrate', interactive=False, run_syncdb=True, verbosity=0)

    def _ensure_admin_user() -> None:
        if not ADMIN_USERNAME or not ADMIN_PASSWORD:
            return
        admin_user, _ = User.objects.get_or_create(username=ADMIN_USERNAME)
        admin_user.email = DEVELOPER_EMAIL or admin_user.email
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.is_active = True
        admin_user.set_password(ADMIN_PASSWORD)
        admin_user.save()

    def _ensure_default_user() -> None:
        if not USER_DEFAULT_USERNAME or not USER_DEFAULT_PASSWORD:
            return
        user, _ = User.objects.get_or_create(username=USER_DEFAULT_USERNAME)
        if not user.email:
            user.email = DEVELOPER_EMAIL or ''
        user.is_active = True
        user.set_password(USER_DEFAULT_PASSWORD)
        user.save()

        profile, _ = Profile.objects.get_or_create(user=user)
        profile.is_verified = True
        profile.save()

    _ensure_admin_user()
    _ensure_default_user()

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()
