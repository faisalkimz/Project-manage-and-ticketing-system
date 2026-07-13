from django.contrib import admin
from .models import User, Team, TeamInvite, Enterprise, SubscriptionPlan, EnterpriseSubscription, UserSession, OAuthConnection

admin.site.register(User)
admin.site.register(Team)
admin.site.register(TeamInvite)
admin.site.register(Enterprise)
admin.site.register(SubscriptionPlan)
admin.site.register(EnterpriseSubscription)
admin.site.register(UserSession)
admin.site.register(OAuthConnection)
