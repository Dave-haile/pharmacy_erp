from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        # First try to get token from cookie
        raw_token = request.COOKIES.get("access_token")
        print(f"Authenticating request, cookies: {request.COOKIES}")  # Debug log
        
        # If no cookie, try Authorization header
        if raw_token is None:
            auth_header = request.META.get('HTTP_AUTHORIZATION')
            if auth_header and auth_header.startswith('Bearer '):
                raw_token = auth_header.split(' ')[1]
                print(f"Token from Authorization header: {raw_token[:20] if raw_token else None}...")  # Debug log
        
        print(f"Token found: {raw_token[:20] if raw_token else None}...")  # Debug log

        if raw_token is None:
            print("No token found in cookies or Authorization header")  # Debug log
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
            user = self.get_user(validated_token)
            print(f"Successfully authenticated user: {user.email if user else None}")  # Debug log
            return user, validated_token
        except Exception as e:
            print(f"Token validation failed: {e}")  # Debug log
            return None
