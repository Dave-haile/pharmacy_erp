from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.paginator import EmptyPage, Paginator
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.token_blacklist.models import (
    BlacklistedToken,
    OutstandingToken,
)
from rest_framework_simplejwt.tokens import AccessToken

from .serializers import (
    PasswordResetSerializer,
    UserCreateSerializer,
    UserSerializer,
    UserUpdateSerializer,
)


# Create your views here.
class UserInfoView(RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


def _normalize_email(value):
    return get_user_model().objects.normalize_email((value or "").strip())


def _get_target_user_or_403(request, email):
    normalized_email = _normalize_email(email)
    User = get_user_model()
    user = get_object_or_404(User, email=normalized_email)

    if request.user.role != "admin" and request.user.pk != user.pk:
        return None, Response(
            {"error": "You can only manage your own account."},
            status=status.HTTP_403_FORBIDDEN,
        )

    return user, None


def _get_target_user_by_id_or_403(request, user_id):
    User = get_user_model()
    user = get_object_or_404(User, pk=user_id)

    if request.user.role != "admin" and request.user.pk != user.pk:
        return None, Response(
            {"error": "You can only manage your own account."},
            status=status.HTTP_403_FORBIDDEN,
        )

    return user, None


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def users(request):
    User = get_user_model()

    if request.method == "POST":
        if request.user.role != "admin":
            return Response(
                {"error": "Only admins can create users."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    queryset = User.objects.all().order_by("-date_joined", "-id")
    if request.user.role != "admin":
        queryset = queryset.filter(pk=request.user.pk)

    email = (request.GET.get("email") or "").strip()
    name = (request.GET.get("name") or "").strip()
    role = (request.GET.get("role") or "").strip()
    is_active = (request.GET.get("is_active") or "").strip().lower()

    if email:
        queryset = queryset.filter(email__icontains=email)

    if name:
        queryset = queryset.filter(
            Q(first_name__icontains=name)
            | Q(last_name__icontains=name)
            | Q(email__icontains=name)
        )

    if role:
        queryset = queryset.filter(role=role)

    if is_active in {"true", "false"}:
        queryset = queryset.filter(is_active=is_active == "true")

    try:
        page_number = max(int(request.GET.get("page", 1)), 1)
    except (TypeError, ValueError):
        page_number = 1

    try:
        page_size = int(request.GET.get("page_size", 10))
    except (TypeError, ValueError):
        page_size = 10

    page_size = min(max(page_size, 1), 100)
    paginator = Paginator(queryset, page_size)

    try:
        page = paginator.page(page_number)
    except EmptyPage:
        page = paginator.page(paginator.num_pages or 1)

    serializer = UserSerializer(page.object_list, many=True)
    return Response(
        {
            "count": paginator.count,
            "num_pages": paginator.num_pages,
            "current_page": page.number,
            "results": serializer.data,
            "has_next": page.has_next(),
            "has_previous": page.has_previous(),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_detail_by_email(request, email):
    user, error_response = _get_target_user_or_403(request, email)
    if error_response:
        return error_response

    return Response(UserSerializer(user).data)


@api_view(["PATCH", "PUT"])
@permission_classes([IsAuthenticated])
def user_detail(request, user_id):
    user, error_response = _get_target_user_by_id_or_403(request, user_id)
    if error_response:
        return error_response

    if request.user.role != "admin":
        attempted_restricted_fields = [
            field for field in ("role", "is_active") if field in request.data
        ]
        if attempted_restricted_fields:
            return Response(
                {"error": "You cannot change your role or activation status."},
                status=status.HTTP_403_FORBIDDEN,
            )
        payload = {
            field: value
            for field, value in request.data.items()
            if field in {"email", "first_name", "last_name"}
        }
    else:
        payload = request.data

    partial = request.method == "PATCH"
    serializer = UserUpdateSerializer(user, data=payload, partial=partial)
    serializer.is_valid(raise_exception=True)
    updated_user = serializer.save()
    return Response(UserSerializer(updated_user).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reset_password(request, user_id):
    user, error_response = _get_target_user_by_id_or_403(request, user_id)
    if error_response:
        return error_response

    serializer = PasswordResetSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    current_password = serializer.validated_data.get("current_password")
    new_password = serializer.validated_data["new_password"]

    if request.user.role != "admin":
        if request.user.pk != user.pk:
            return Response(
                {"error": "You can only reset your own password."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not current_password:
            return Response(
                {"error": "Current password is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not request.user.check_password(current_password):
            return Response(
                {"error": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    user.set_password(new_password)
    user.save(update_fields=["password"])

    return Response(
        {
            "message": "Password reset successfully."
            if request.user.role == "admin"
            else "Password changed successfully."
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(
        {
            "id": request.user.id,
            "email": request.user.email,
            "role": request.user.role,
            "first_name": request.user.first_name,
            "last_name": request.user.last_name,
        }
    )


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
    user.is_staff = role == "admin"
    user.first_name = request.data.get("first_name", "")
    user.last_name = request.data.get("last_name", "")
    user.save(update_fields=["is_staff", "first_name", "last_name"])

    return Response(
        {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "first_name": user.first_name,
            "last_name": user.last_name,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([IsAdminUser])
def create_test_token(request):
    """Create a test token for a specified user"""
    try:
        user_id = request.data.get("user_id")
        email = request.data.get("email")

        if user_id:
            user = get_user_model().objects.get(id=user_id)
        elif email:
            user = get_user_model().objects.get(email=email)
        else:
            return Response(
                {"error": "Provide either user_id or email"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create token
        token = AccessToken.for_user(user)
        expires_at = timezone.now() + timedelta(hours=8)
        token.set_exp(lifetime=expires_at - timezone.now())

        # Record in OutstandingToken
        outstanding_token = OutstandingToken.objects.create(
            user=user,
            jti=token["jti"],
            token=str(token),
            created_at=timezone.now(),
            expires_at=expires_at,
        )

        return Response(
            {
                "message": "Test token created successfully",
                "token_id": outstanding_token.jti,
                "user": user.email,
                "expires_at": expires_at.isoformat(),
            }
        )

    except get_user_model().DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def token_stats(request):
    """Get statistics about tokens"""
    try:
        total_tokens = OutstandingToken.objects.count()
        blacklisted_tokens = BlacklistedToken.objects.count()
        expired_tokens = OutstandingToken.objects.filter(
            expires_at__lt=timezone.now()
        ).count()
        live_tokens = total_tokens - expired_tokens - blacklisted_tokens

        return Response(
            {
                "total_tokens": total_tokens,
                "live_tokens": live_tokens,
                "expired_tokens": expired_tokens,
                "blacklisted_tokens": blacklisted_tokens,
                "users_with_tokens": OutstandingToken.objects.values("user")
                .distinct()
                .count(),
            }
        )

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
