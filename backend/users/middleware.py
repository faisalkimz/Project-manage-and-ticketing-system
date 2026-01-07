from django.http import HttpResponseForbidden
from django.utils import timezone
from .models import UserSession

class SecurityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            error = self.check_ip_whitelist(request)
            if error:
                return error
            self.update_session(request)
            
        return self.get_response(request)
        
    def check_ip_whitelist(self, request):
        ip = self.get_client_ip(request)
        
        # Check Enterprise Whitelist
        if request.user.enterprise and request.user.enterprise.enforce_ip_whitelist:
            if ip not in request.user.enterprise.ip_whitelist:
                return HttpResponseForbidden("Access Denied: IP not authorized by organization")
        
        # Check User Whitelist
        if request.user.enforce_ip_whitelist:
            if ip not in request.user.ip_whitelist:
                return HttpResponseForbidden("Access Denied: IP not authorized")
        return None
    
    def update_session(self, request):
        # In a real implementation, you would track session expiry here
        pass

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
