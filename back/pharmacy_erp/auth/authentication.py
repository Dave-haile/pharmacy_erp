from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken


class LoginView(APIView):
    def post(self, request):
        email = request.data.get("email") or request.data.get("username")
        password = request.data.get("password")

        user = authenticate(request, username=email, password=password)

        if not user:
            return Response(
                {"error": "Incorrect email or password"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # 🔹 Calculate next 6 AM
        now = datetime.now()
        six_am_today = now.replace(hour=6, minute=0, second=0, microsecond=0)

        if now >= six_am_today:
            expiry = six_am_today + timedelta(days=1)
        else:
            expiry = six_am_today

        lifetime = expiry - now

        # 🔹 Create access token
        token = AccessToken.for_user(user)
        token.set_exp(from_time=now, lifetime=lifetime)

        # 🔹 Record token in OutstandingToken table
        OutstandingToken.objects.create(
            user=user,
            jti=token['jti'],
            token=str(token),
            created_at=now,
            expires_at=expiry
        )

        response = Response({
            "message": "Login successful",
            "access_token": str(token),
            "token_type": "Bearer",
            "expires_at": expiry.isoformat()
        }, status=status.HTTP_200_OK)

        # 🔹 Set HttpOnly cookie
        response.set_cookie(
            key="access_token",
            value=str(token),
            httponly=True,
            secure=False,  # Set to False for development
            samesite="Lax",
            expires=expiry,
            domain=None if settings.DEBUG else None  # Let browser handle domain in dev
        )

        return response
class LogoutView(APIView):
    def post(self, request):
        # Get the token from cookie or Authorization header
        raw_token = request.COOKIES.get("access_token")
        if raw_token is None:
            auth_header = request.META.get('HTTP_AUTHORIZATION')
            if auth_header and auth_header.startswith('Bearer '):
                raw_token = auth_header.split(' ')[1]
        
        if raw_token:
            try:
                # Find the outstanding token and blacklist it
                outstanding_token = OutstandingToken.objects.get(token=raw_token)
                if not BlacklistedToken.objects.filter(token=outstanding_token).exists():
                    BlacklistedToken.objects.create(token=outstanding_token)
            except OutstandingToken.DoesNotExist:
                pass  # Token not found in outstanding tokens
        
        response = Response({"message": "Logged out"})
        response.delete_cookie("access_token")
        return response

