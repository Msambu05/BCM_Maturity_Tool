from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import Group
from django.utils.html import format_html
from django.urls import reverse
from .models import User, Organization, Department


# Unregister the default Group admin
admin.site.unregister(Group)


# Custom Organization Admin
@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'contact_email', 'contact_phone', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'code', 'contact_email']
    ordering = ['name']

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'code', 'description')
        }),
        ('Contact Information', {
            'fields': ('address', 'contact_email', 'contact_phone')
        }),
        ('Status & Audit', {
            'fields': ('is_active', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ['created_at', 'updated_at']

    actions = ['activate_organizations', 'deactivate_organizations']

    def activate_organizations(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, f"Activated {queryset.count()} organizations.")
    activate_organizations.short_description = "Activate selected organizations"

    def deactivate_organizations(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f"Deactivated {queryset.count()} organizations.")
    deactivate_organizations.short_description = "Deactivate selected organizations"


# Custom Department Admin
@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'organization', 'manager_name', 'is_active', 'created_at']
    list_filter = ['is_active', 'organization', 'created_at']
    search_fields = ['name', 'code', 'manager_name', 'manager_email']
    ordering = ['organization__name', 'name']

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'code', 'organization', 'description')
        }),
        ('Manager Information', {
            'fields': ('manager_name', 'manager_email')
        }),
        ('Status & Audit', {
            'fields': ('is_active', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ['created_at', 'updated_at']

    actions = ['activate_departments', 'deactivate_departments']

    def activate_departments(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, f"Activated {queryset.count()} departments.")
    activate_departments.short_description = "Activate selected departments"

    def deactivate_departments(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f"Deactivated {queryset.count()} departments.")
    deactivate_departments.short_description = "Deactivate selected departments"


# Custom User Admin
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # Display fields in list view
    list_display = [
        'username', 'get_full_name', 'email', 'role', 'organization',
        'department', 'is_active', 'is_staff', 'is_superuser', 'last_login'
    ]

    # Filters
    list_filter = [
        'is_active', 'is_staff', 'is_superuser', 'role', 'organization',
        'department', 'date_joined', 'last_login'
    ]

    # Search fields
    search_fields = [
        'username', 'first_name', 'last_name', 'email',
        'employee_id', 'organization__name', 'department__name'
    ]

    # Ordering
    ordering = ['last_name', 'first_name']

    # Fieldsets for add/edit forms
    fieldsets = (
        ('Account Information', {
            'fields': ('username', 'password')
        }),
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'title', 'email', 'employee_id')
        }),
        ('Contact Information', {
            'fields': ('phone_number', 'mobile_number', 'office_location')
        }),
        ('Organization & Role', {
            'fields': ('role', 'organization', 'department')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Important dates', {
            'fields': ('last_login', 'date_joined', 'last_activity'),
            'classes': ('collapse',)
        }),
    )

    # Fieldsets for add form (simplified)
    add_fieldsets = (
        ('Account Information', {
            'fields': ('username', 'password1', 'password2')
        }),
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'title', 'email', 'employee_id')
        }),
        ('Contact Information', {
            'fields': ('phone_number', 'mobile_number', 'office_location')
        }),
        ('Organization & Role', {
            'fields': ('role', 'organization', 'department')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser')
        }),
    )

    # Read-only fields
    readonly_fields = ['date_joined', 'last_login', 'last_activity']

    # Custom actions for user management
    actions = [
        'activate_users',
        'deactivate_users',
        'make_staff',
        'remove_staff',
        'make_superuser',
        'remove_superuser',
        'reset_passwords'
    ]

    def get_queryset(self, request):
        """Optimize queryset with select_related for better performance"""
        return super().get_queryset(request).select_related('organization', 'department')

    def get_full_name(self, obj):
        """Display full name in list view"""
        return obj.get_full_name() or obj.username
    get_full_name.short_description = 'Full Name'
    get_full_name.admin_order_field = 'last_name'

    def activate_users(self, request, queryset):
        """Activate selected users"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f"Activated {updated} users.")
    activate_users.short_description = "✓ Activate selected users"

    def deactivate_users(self, request, queryset):
        """Deactivate selected users"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f"Deactivated {updated} users.")
    deactivate_users.short_description = "✗ Deactivate selected users"

    def make_staff(self, request, queryset):
        """Make selected users staff"""
        updated = queryset.update(is_staff=True)
        self.message_user(request, f"Made {updated} users staff members.")
    make_staff.short_description = "👥 Make staff"

    def remove_staff(self, request, queryset):
        """Remove staff status from selected users"""
        updated = queryset.update(is_staff=False)
        self.message_user(request, f"Removed staff status from {updated} users.")
    remove_staff.short_description = "👤 Remove staff status"

    def make_superuser(self, request, queryset):
        """Make selected users superusers"""
        updated = queryset.update(is_superuser=True, is_staff=True)
        self.message_user(request, f"Made {updated} users superusers.")
    make_superuser.short_description = "👑 Make superuser"

    def remove_superuser(self, request, queryset):
        """Remove superuser status from selected users"""
        updated = queryset.update(is_superuser=False)
        self.message_user(request, f"Removed superuser status from {updated} users.")
    remove_superuser.short_description = "👤 Remove superuser status"

    def reset_passwords(self, request, queryset):
        """Reset passwords for selected users (they'll need to set new passwords)"""
        from django.contrib.auth.hashers import make_password
        from django.utils.crypto import get_random_string

        updated_count = 0
        for user in queryset:
            # Generate a temporary password
            temp_password = get_random_string(12)
            user.set_password(temp_password)
            user.save()
            updated_count += 1

        self.message_user(
            request,
            f"Reset passwords for {updated_count} users. "
            "They will need to set new passwords on next login."
        )
    reset_passwords.short_description = "🔑 Reset passwords"

    # Custom CSS and JS for better UX
    class Media:
        css = {
            'all': ('admin/css/custom_admin.css',)
        }
        js = ('admin/js/custom_admin.js',)


# Custom Admin Site Configuration
admin.site.site_header = "BCM Maturity Tool Administration"
admin.site.site_title = "BCM Admin Portal"
admin.site.index_title = "Welcome to BCM Administration"

# Custom admin CSS (create this file)
admin_css = """
/* Custom admin styles for better UX */
.action-checkbox-column {
    width: 30px;
}

.actions .button {
    margin-right: 5px;
}

.fieldset.collapsed .fieldset-content {
    display: none;
}

.fieldset.collapsed .fieldset-heading::before {
    content: "▶ ";
}

.fieldset .fieldset-heading::before {
    content: "▼ ";
}

/* Better button grouping */
.actions {
    padding: 10px;
    background: #f8f8f8;
    border-bottom: 1px solid #ddd;
}

.actions .clear {
    clear: both;
}

/* Status indicators */
.boolean-icon {
    display: inline-block;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    margin-right: 5px;
}

.boolean-icon.true {
    background-color: #28a745;
}

.boolean-icon.false {
    background-color: #dc3545;
}
"""

# Create custom admin CSS file
import os
os.makedirs('backend/static/admin/css', exist_ok=True)
with open('backend/static/admin/css/custom_admin.css', 'w', encoding='utf-8') as f:
    f.write(admin_css)
