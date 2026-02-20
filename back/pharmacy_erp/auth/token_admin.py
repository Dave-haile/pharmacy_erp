from django.contrib import admin
from django.utils.html import format_html
from django.utils.timezone import now
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from rest_framework_simplejwt.token_blacklist.admin import OutstandingTokenAdmin as DefaultOutstandingTokenAdmin, BlacklistedTokenAdmin as DefaultBlacklistedTokenAdmin
from .models import User

# Unregister the default admin classes
admin.site.unregister(OutstandingToken)
admin.site.unregister(BlacklistedToken)


@admin.register(OutstandingToken)
class OutstandingTokenAdmin(admin.ModelAdmin):
    list_display = ('user_info', 'jti_short', 'created_at', 'expires_at', 'is_expired', 'token_status')
    list_filter = ('created_at', 'expires_at', 'user')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'jti')
    readonly_fields = ('id', 'jti', 'token', 'created_at', 'expires_at', 'user')
    ordering = ('-created_at',)
    actions = ['blacklist_selected_tokens']
    
    def blacklist_selected_tokens(self, request, queryset):
        """Blacklist selected tokens"""
        blacklisted_count = 0
        for token in queryset:
            # Check if already blacklisted
            if not BlacklistedToken.objects.filter(token=token).exists():
                BlacklistedToken.objects.create(token=token)
                blacklisted_count += 1
        
        self.message_user(request, f'Successfully blacklisted {blacklisted_count} tokens.')
    blacklist_selected_tokens.short_description = 'Blacklist selected tokens'
    
    def user_info(self, obj):
        if obj.user:
            return format_html(
                '<strong>{}</strong><br><small>{}</small>',
                obj.user.email,
                obj.user.full_name or 'No name'
            )
        return "Anonymous"
    user_info.short_description = 'User'
    
    def jti_short(self, obj):
        return obj.jti[:8] + "..." if len(obj.jti) > 8 else obj.jti
    jti_short.short_description = 'Token ID (JTI)'
    
    def is_expired(self, obj):
        expired = obj.expires_at < now()
        color = 'red' if expired else 'green'
        status = 'Expired' if expired else 'Valid'
        return format_html('<span style="color: {};">{}</span>', color, status)
    is_expired.short_description = 'Status'
    
    def token_status(self, obj):
        # Check if token is blacklisted
        is_blacklisted = BlacklistedToken.objects.filter(token=obj).exists()
        if is_blacklisted:
            return format_html('<span style="color: red; font-weight: bold;">{}</span>', 'BLACKLISTED')
        elif obj.expires_at < now():
            return format_html('<span style="color: orange;">{}</span>', 'EXPIRED')
        else:
            return format_html('<span style="color: green; font-weight: bold;">{}</span>', 'LIVE')
    token_status.short_description = 'Token Status'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(BlacklistedToken)
class BlacklistedTokenAdmin(admin.ModelAdmin):
    list_display = ('token_info', 'blacklisted_at', 'user_info')
    list_filter = ('blacklisted_at',)
    search_fields = ('token__jti', 'token__user__email')
    readonly_fields = ('id', 'token', 'blacklisted_at')
    ordering = ('-blacklisted_at',)
    
    def token_info(self, obj):
        return format_html(
            '<strong>JTI:</strong> {}<br><strong>Expires:</strong> {}',
            obj.token.jti[:16] + "..." if len(obj.token.jti) > 16 else obj.token.jti,
            obj.token.expires_at.strftime('%Y-%m-%d %H:%M:%S')
        )
    token_info.short_description = 'Token Info'
    
    def user_info(self, obj):
        if obj.token.user:
            return format_html(
                '<strong>{}</strong><br><small>{}</small>',
                obj.token.user.email,
                obj.token.user.full_name or 'No name'
            )
        return "Anonymous"
    user_info.short_description = 'User'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


# Customize User# Extend the existing User admin
class UserTokenAdminMixin:
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.prefetch_related('outstandingtoken_set', 'outstandingtoken_set__blacklistedtoken')


# Enhanced User admin class that can be mixed in
class UserAdmin(UserTokenAdminMixin, admin.ModelAdmin):
    list_display = ('email', 'full_name', 'role', 'is_active', 'token_count', 'blacklisted_count')
    list_filter = ('role', 'is_active', 'date_joined')
    search_fields = ('email', 'first_name', 'last_name')
    readonly_fields = ('date_joined', 'last_login', 'token_info')
    
    def token_count(self, obj):
        count = obj.outstandingtoken_set.count()
        return format_html('<span style="color: blue;">{}</span>', count)
    token_count.short_description = 'Live Tokens'
    
    def blacklisted_count(self, obj):
        count = obj.outstandingtoken_set.filter(blacklistedtoken__isnull=False).count()
        return format_html('<span style="color: red;">{}</span>', count)
    blacklisted_count.short_description = 'Blacklisted'
    
    def token_info(self, obj):
        outstanding = obj.outstandingtoken_set.all()
        blacklisted = outstanding.filter(blacklistedtoken__isnull=False)
        live = outstanding.filter(blacklistedtoken__isnull=True, expires_at__gt=now())
        
        return format_html(
            '<div><strong>Total:</strong> {}</div>'
            '<div><strong>Live:</strong> {}</div>'
            '<div><strong>Blacklisted:</strong> {}</div>',
            outstanding.count(),
            live.count(),
            blacklisted.count()
        )
    token_info.short_description = 'Token Summary'
