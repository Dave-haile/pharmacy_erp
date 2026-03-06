from datetime import timedelta
from django.conf import settings
from django.contrib.auth import authenticate
from django.utils import timezone
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

        # 🔹 Calculate next 6 AM in the current time zone
        now_local = timezone.localtime()
        six_am_today_local = now_local.replace(hour=6, minute=0, second=0, microsecond=0)

        if now_local >= six_am_today_local:
            expiry_local = six_am_today_local + timedelta(days=1)
        else:
            expiry_local = six_am_today_local

        # Lifetime from "now" until the next 6 AM, regardless of creation time
        lifetime = expiry_local - now_local

        # Use UTC-aware "now" for JWT and DB
        now_utc = timezone.now()
        expiry_utc = now_utc + lifetime

        # 🔹 Create access token
        token = AccessToken.for_user(user)
        token.set_exp(from_time=now_utc, lifetime=lifetime)

        # 🔹 Record token in OutstandingToken table
        OutstandingToken.objects.create(
            user=user,
            jti=token['jti'],
            token=str(token),
            created_at=now_utc,
            expires_at=expiry_utc
        )

        response = Response({
            "message": "Login successful",
            "access_token": str(token),
            "token_type": "Bearer",
            "expires_at": expiry_utc.isoformat()
        }, status=status.HTTP_200_OK)

        # 🔹 Set HttpOnly cookie
        response.set_cookie(
            key="access_token",
            value=str(token),
            httponly=True,
            secure=False,  # Set to False for development
            samesite="Lax",
            expires=expiry_utc,
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

