# Table Registry - Stores metadata about tables for search, import, and shortcuts

from django.db import models


class TableRegistry(models.Model):
    """
    Stores metadata about system tables for:
    - Global search functionality
    - Import operations
    - Shortcut creation
    - Navigation and discovery
    """

    # Table identification
    table_code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Unique code for the table (e.g., 'medicine', 'category')"
    )
    table_name = models.CharField(
        max_length=100,
        help_text="Display name of the table (e.g., 'Medicine Register')"
    )

    # Module classification
    module = models.CharField(
        max_length=50,
        db_index=True,
        help_text="Module this table belongs to (e.g., 'inventory', 'hr', 'system')"
    )
    submodule = models.CharField(
        max_length=50,
        blank=True,
        help_text="Submodule classification (e.g., 'master_data', 'transactions')"
    )

    # Navigation
    frontend_path = models.CharField(
        max_length=200,
        blank=True,
        help_text="Frontend route path (e.g., '/inventory/medicines')"
    )
    backend_endpoint = models.CharField(
        max_length=200,
        blank=True,
        help_text="Backend API endpoint (e.g., '/api/medicines/')"
    )

    # Search keywords (stored as JSON array)
    search_keywords = models.JSONField(
        default=list,
        help_text="Array of search keywords for global search"
    )

    # Import/Export configuration
    importable = models.BooleanField(
        default=False,
        help_text="Whether this table supports data import"
    )
    exportable = models.BooleanField(
        default=False,
        help_text="Whether this table supports data export"
    )
    import_template = models.CharField(
        max_length=200,
        blank=True,
        help_text="Path to import template file if applicable"
    )

    # Column definitions for import (JSON format)
    # Example: [
    #   {
    #     "name": "name",
    #     "label": "Name",
    #     "type": "string",
    #     "required": true,
    #     "description": "Item name",
    #     "example": "Paracetamol 500mg",
    #     "include_in_import": true,  # Show in template download
    #     "include_in_export": true,  # Include in export
    #     "is_identifier": false,     # Can be used for update matching
    #     "choices": null,           # Array of valid choices
    #     "max_length": 200
    #   }
    # ]
    columns = models.JSONField(
        default=list,
        help_text="Column definitions for import/export. Each column has: name, label, type, required, description, example, include_in_import, include_in_export, is_identifier"
    )

    # Table metadata
    description = models.TextField(
        blank=True,
        help_text="Description of what this table stores"
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        help_text="Icon name for UI (e.g., 'Package', 'Users', 'Settings')"
    )

    # Database info (for dynamic queries)
    db_table_name = models.CharField(
        max_length=100,
        blank=True,
        help_text="Actual database table name"
    )
    model_class = models.CharField(
        max_length=100,
        blank=True,
        help_text="Django model class path (e.g., 'tables.Medicine')"
    )

    # Permissions
    requires_auth = models.BooleanField(
        default=True,
        help_text="Whether authentication is required to access"
    )
    required_permissions = models.JSONField(
        default=list,
        help_text="Array of required permission codenames"
    )

    # Status
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Whether this table is currently active/enabled"
    )
    is_system = models.BooleanField(
        default=False,
        help_text="Whether this is a system table that shouldn't be deleted"
    )
    display_order = models.PositiveIntegerField(
        default=0,
        help_text="Display order for listing"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "TableRegistry"
        verbose_name_plural = "Table Registries"
        ordering = ["module", "display_order", "table_name"]

    def __str__(self):
        return f"{self.table_name} ({self.table_code})"

    def get_keywords_list(self):
        """Return search keywords as a list."""
        return self.search_keywords if self.search_keywords else []

    def add_keyword(self, keyword: str):
        """Add a search keyword."""
        if not self.search_keywords:
            self.search_keywords = []
        if keyword not in self.search_keywords:
            self.search_keywords.append(keyword)

    def matches_search(self, query: str) -> bool:
        """Check if this table matches a search query."""
        query = query.lower()
        if query in self.table_name.lower():
            return True
        if query in self.table_code.lower():
            return True
        return any(query in kw.lower() for kw in self.get_keywords_list())
