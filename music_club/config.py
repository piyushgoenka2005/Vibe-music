import os
from pathlib import Path


def _load_dotenv() -> None:
	"""Lightweight .env loader so we do not require python-dotenv."""
	env_path = Path(__file__).resolve().parent.parent / '.env'
	if not env_path.exists():
		return

	for raw_line in env_path.read_text(encoding='utf-8').splitlines():
		line = raw_line.strip()
		if not line or line.startswith('#') or '=' not in line:
			continue
		key, value = line.split('=', 1)
		key = key.strip()
		value = value.strip().strip('"').strip("'")
		os.environ.setdefault(key, value)


_load_dotenv()

# For sending email to users during registration or password recovery
email = os.environ.get('EMAIL_HOST_USER', 'prasadyuvraj8805@gmail.com')
password = os.environ.get('EMAIL_HOST_PASSWORD', '')

# For integrating with the Razorpay payment gateway.
razorpay_key_id = os.environ.get('RAZORPAY_KEY_ID', 'rzp_test_your_key_id_here')
razorpay_key_secret = os.environ.get('RAZORPAY_KEY_SECRET', 'your_key_secret_here')

# Custom authentication credentials for Vibe Music
DEVELOPER_EMAIL = os.environ.get('DEVELOPER_EMAIL', email)
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'vibe_admin')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'Vibe@Admin2025')
USER_DEFAULT_USERNAME = os.environ.get('USER_DEFAULT_USERNAME', 'vibe_user')
USER_DEFAULT_PASSWORD = os.environ.get('USER_DEFAULT_PASSWORD', 'Vibe@User2025')
