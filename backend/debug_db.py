import os
import django
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_api.settings')
django.setup()

from users.models import User

try:
    print("Checking database access...")
    count = User.objects.count()
    print(f"User count: {count}")
    
    first = User.objects.first()
    if first:
        print(f"First user: {first.username}")
        print(f"Role: {first.role} (Type: {type(first.role)})")
    else:
        print("No users found.")
        
except Exception as e:
    print(f"DB Error: {e}")
