from django.urls import path

from auth.authentication import LoginView, LogoutView

from .views import (
    me,
    register,
    reset_password,
    user_detail,
    user_detail_by_email,
    users,
)

urlpatterns = [
    path("login/", LoginView.as_view()),
    path("logout/", LogoutView.as_view()),
    path("me/", me),
    path("register/", register),
    path("users/", users),
    path("users/by-email/<path:email>/", user_detail_by_email),
    path("users/<int:user_id>/reset-password/", reset_password),
    path("users/<int:user_id>/", user_detail),
]
