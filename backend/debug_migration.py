import os
import django
try:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_api.settings')
    print("Setting up Django...")
    django.setup()
    print("Django setup complete.")

    print("Importing User...")
    from users.models import User
    print("User imported:", User)

    print("Importing Project...")
    from projects.models import Project
    print("Project imported:", Project)
    
except Exception as e:
    import traceback
    traceback.print_exc()
