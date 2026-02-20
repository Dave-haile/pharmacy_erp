from django.contrib import admin

from .models import User
from .token_admin import UserAdmin

admin.site.register(User, UserAdmin)
