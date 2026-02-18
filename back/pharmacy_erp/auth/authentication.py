from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken


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

        response = Response({"message": "Login successful"}, status=status.HTTP_200_OK)

        # 🔹 Set HttpOnly cookie
        response.set_cookie(
            key="access_token",
            value=str(token),
            httponly=True,
            secure=not settings.DEBUG,
            samesite="Lax",
            expires=expiry
        )

        return response
class LogoutView(APIView):
    def post(self, request):
        response = Response({"message": "Logged out"})
        response.delete_cookie("access_token")
        return response


