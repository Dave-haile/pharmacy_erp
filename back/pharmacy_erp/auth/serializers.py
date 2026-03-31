from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework.serializers import ModelSerializer, Serializer

from .models import User


class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_staff",
            "is_active",
            "date_joined",
            "updated_at",
        )


class RegisterUserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ("email", "first_name", "last_name", "role", "password")
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class UserCreateSerializer(ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            "email",
            "first_name",
            "last_name",
            "role",
            "password",
            "is_active",
        )

    def validate_email(self, value):
        email = User.objects.normalize_email(value)
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("Email already exists.")
        return email

    def create(self, validated_data):
        password = validated_data.pop("password")
        role = validated_data.get("role", "pharmacist")
        validated_data["is_staff"] = role == "admin"
        return User.objects.create_user(password=password, **validated_data)


class UserUpdateSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ("email", "first_name", "last_name", "role", "is_active")

    def validate_email(self, value):
        email = User.objects.normalize_email(value)
        queryset = User.objects.exclude(pk=self.instance.pk)
        if queryset.filter(email=email).exists():
            raise serializers.ValidationError("Email already exists.")
        return email

    def update(self, instance, validated_data):
        role = validated_data.get("role", instance.role)
        instance.is_staff = role == "admin"
        return super().update(instance, validated_data)


class PasswordResetSerializer(Serializer):
    current_password = serializers.CharField(required=False, write_only=True)
    new_password = serializers.CharField(min_length=8, write_only=True)


class LoginUserSerializer(Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data["email"], password=data["password"])
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Incorrect credentials!")
