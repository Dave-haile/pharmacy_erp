from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework.generics import RetrieveUpdateAPIView
from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from .serializers import UserSerializer

# Create your views here.
class UserInfoView(RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response({
        "id": request.user.id,
        "email": request.user.email,
        "role": request.user.role
    })

@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    email = request.data.get("email")
    role = request.data.get("role")
    password = request.data.get("password")

    if not email or not role or not password:
        return Response(
            {"error": "email, role, and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    User = get_user_model()

    if User.objects.filter(email=email).exists():
        return Response(
            {"error": "Email already exists"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.create_user(email=email, password=password, role=role)

    return Response(
        {"id": user.id, "email": user.email, "role": user.role},
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_test_token(request):
    """Create a test token for a specified user"""
    try:
        user_id = request.data.get('user_id')
        email = request.data.get('email')
        
        if user_id:
            user = get_user_model().objects.get(id=user_id)
        elif email:
            user = get_user_model().objects.get(email=email)
        else:
            return Response(
                {'error': 'Provide either user_id or email'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create token
        token = AccessToken.for_user(user)
        expires_at = timezone.now() + timedelta(hours=8)
        token.set_exp(lifetime=expires_at - timezone.now())
        
        # Record in OutstandingToken
        outstanding_token = OutstandingToken.objects.create(
            user=user,
            jti=token['jti'],
            token=str(token),
            created_at=timezone.now(),
            expires_at=expires_at
        )
        
        return Response({
            'message': 'Test token created successfully',
            'token_id': outstanding_token.jti,
            'user': user.email,
            'expires_at': expires_at.isoformat()
        })
        
    except get_user_model().DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def token_stats(request):
    """Get statistics about tokens"""
    try:
        total_tokens = OutstandingToken.objects.count()
        blacklisted_tokens = BlacklistedToken.objects.count()
        expired_tokens = OutstandingToken.objects.filter(expires_at__lt=timezone.now()).count()
        live_tokens = total_tokens - expired_tokens - blacklisted_tokens
        
        return Response({
            'total_tokens': total_tokens,
            'live_tokens': live_tokens,
            'expired_tokens': expired_tokens,
            'blacklisted_tokens': blacklisted_tokens,
            'users_with_tokens': OutstandingToken.objects.values('user').distinct().count()
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )