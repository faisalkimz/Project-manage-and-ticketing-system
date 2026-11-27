from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .models import User


def _user_to_scim(user):
    return {
        "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
        "id": str(user.id),
        "userName": user.username,
        "name": {
            "givenName": user.first_name or "",
            "familyName": user.last_name or "",
        },
        "emails": [{"value": user.email, "primary": True}],
        "active": user.is_active,
        "title": user.job_title or "",
    }


class SCIMUsersView(APIView):
    """SCIM 2.0 Users provisioning endpoint (List & Create)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN' and not request.user.is_superuser:
            return Response({'detail': 'Admin role required'}, status=status.HTTP_403_FORBIDDEN)
        users = User.objects.all().order_by('id')
        resources = [_user_to_scim(u) for u in users]
        return Response({
            "schemas": ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
            "totalResults": len(resources),
            "Resources": resources,
        })

    def post(self, request):
        if request.user.role != 'ADMIN' and not request.user.is_superuser:
            return Response({'detail': 'Admin role required'}, status=status.HTTP_403_FORBIDDEN)
        username = request.data.get('userName')
        if not username:
            return Response({'detail': 'userName is required'}, status=status.HTTP_400_BAD_REQUEST)
        emails = request.data.get('emails') or []
        email = emails[0].get('value') if emails and isinstance(emails[0], dict) else f"{username}@example.com"
        name = request.data.get('name') or {}
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'first_name': name.get('givenName', ''),
                'last_name': name.get('familyName', ''),
                'is_active': request.data.get('active', True),
                'role': 'MEMBER',
                'bio': '',
                'otp_secret': '',
            }
        )
        return Response(_user_to_scim(user), status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class SCIMUserDetailView(APIView):
    """SCIM 2.0 User detail endpoint (GET, PATCH, DELETE)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(_user_to_scim(user))

    def patch(self, request, pk):
        if request.user.role != 'ADMIN' and not request.user.is_superuser:
            return Response({'detail': 'Admin role required'}, status=status.HTTP_403_FORBIDDEN)
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        if 'active' in request.data:
            user.is_active = bool(request.data['active'])
        if 'title' in request.data:
            user.job_title = request.data['title']
        user.save()
        return Response(_user_to_scim(user))

    def delete(self, request, pk):
        if request.user.role != 'ADMIN' and not request.user.is_superuser:
            return Response({'detail': 'Admin role required'}, status=status.HTTP_403_FORBIDDEN)
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        user.is_active = False
        user.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)
