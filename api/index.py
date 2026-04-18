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
    call_command('migrate', interactive=False, run_syncdb=True, verbosity=0)

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()
