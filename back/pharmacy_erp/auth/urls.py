from django.urls import path
from auth.authentication import LoginView, LogoutView
from .views import me, register

urlpatterns = [
    path("login/", LoginView.as_view()),
    path("logout/", LogoutView.as_view()),
    path("me/", me),
    path("register/", register),
]