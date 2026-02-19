from rest_framework.serializers import ModelSerializer, Serializer
from .models import User
from rest_framework import serializers
from django.contrib.auth import authenticate

class UserSerializer(ModelSerializer):
    
    class Meta:
        model = User
        fields =("id", "email", "first_name", "last_name", "role", "is_staff", "is_active")

class RegisterUserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ("email", "first_name", "last_name", "role", "password")
        extra_kwargs = {"password":{"write_only":True}}
        
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
        
      
class LoginUserSerializer(Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        user = authenticate(username=data['email'], password=data['password'])
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Incorrect credentials!")