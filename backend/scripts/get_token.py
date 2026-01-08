import os, sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_api.settings')
# ensure project root on path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import django
django.setup()
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
User = get_user_model()
try:
    u = User.objects.get(username='admin')
except User.DoesNotExist:
    print('no admin')
    sys.exit(1)
refresh = RefreshToken.for_user(u)
print('ACCESS:', str(refresh.access_token))
print('REFRESH:', str(refresh))