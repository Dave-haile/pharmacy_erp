from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model

# Create your views here.
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