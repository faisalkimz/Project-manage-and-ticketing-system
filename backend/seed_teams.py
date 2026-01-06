import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_api.settings')
django.setup()

from users.models import Team, User

def seed_teams():
    print("🚀 Seeding Operational Pods...")
    users = list(User.objects.all())
    if not users:
        print("No users found. Run seed_data.py first.")
        return

    admin = User.objects.get(username='admin')
    
    pods = [
        ("Core Engineering", "Focus on backend architecture, security, and high-performance API development."),
        ("Product Design", "Human-centric UX/UI development and design system orchestration."),
        ("Customer Success", "Bridging the gap between user requirements and technical implementation.")
    ]

    for name, desc in pods:
        team, created = Team.objects.get_or_create(
            name=name,
            defaults={'description': desc, 'lead': admin}
        )
        if created:
            # Add some members
            team.members.add(*users[:3])
            print(f"   - Created {name}")

    print("✅ Teams seeded successfully!")

if __name__ == '__main__':
    seed_teams()
