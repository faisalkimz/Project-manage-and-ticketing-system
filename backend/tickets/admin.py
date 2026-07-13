from django.contrib import admin
from .models import Ticket, SLAPolicy, TicketQueue, TicketCategory

admin.site.register(Ticket)
admin.site.register(SLAPolicy)
admin.site.register(TicketQueue)
admin.site.register(TicketCategory)
