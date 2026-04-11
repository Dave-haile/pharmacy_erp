from django.contrib import admin

from tables.model_definitions import (
    Batches,
    CostLayer,
    ExpiryConfig,
    ExpiryNotification,
    GoodRecivingNote,
    GoodRecivingNoteItem,
    InventoryValuation,
    PrintFormat,
    ReorderAlert,
    ReorderConfig,
    SalesReturn,
    SalesReturnItem,
    StockAdjustment,
    StockAdjustmentItem,
    StockEntry,
    StockEntryItem,
    StockLedger,
    StockTake,
    StockTakeItem,
    SupplierReturn,
    SupplierReturnItem,
)


class StockEntryItemInline(admin.TabularInline):
    model = StockEntryItem
    extra = 1
    fields = ("medicine", "batch_number", "quantity", "unit_price", "total_price")


class StockAdjustmentItemInline(admin.TabularInline):
    model = StockAdjustmentItem
    extra = 1
    fields = ("medicine", "batch_number", "quantity_before", "quantity_after")


class SalesReturnItemInline(admin.TabularInline):
    model = SalesReturnItem
    extra = 1
    fields = ("medicine", "quantity", "unit_price", "total_amount")


class SupplierReturnItemInline(admin.TabularInline):
    model = SupplierReturnItem
    extra = 1
    fields = ("medicine", "batch", "quantity", "unit_price", "total_amount")


class GoodReceivingNoteItemInline(admin.TabularInline):
    model = GoodRecivingNoteItem
    extra = 1
    fields = ("medicine", "quantity", "unit_price", "total_price")


@admin.register(Batches)
class BatchesAdmin(admin.ModelAdmin):
    list_display = (
        "batch_number",
        "product_id",
        "expiry_date",
        "quantity",
        "purchase_price",
        "supplier_id",
    )
    list_filter = ("supplier_id", "expiry_date")
    search_fields = ("batch_number", "product_id__name")
    date_hierarchy = "expiry_date"


@admin.register(InventoryValuation)
class InventoryValuationAdmin(admin.ModelAdmin):
    list_display = (
        "medicine",
        "total_quantity",
        "total_value",
        "average_cost",
        "last_updated",
    )
    search_fields = ("medicine__name",)
    readonly_fields = ("last_movement_at", "last_updated")


@admin.register(StockEntry)
class StockEntryAdmin(admin.ModelAdmin):
    list_display = (
        "posting_number",
        "supplier",
        "invoice_number",
        "total_cost",
        "status",
        "received_by",
        "created_at",
    )
    list_filter = ("status", "created_at", "supplier")
    search_fields = ("posting_number", "invoice_number", "supplier__name")
    readonly_fields = ("posting_number", "created_at", "updated_at")
    inlines = [StockEntryItemInline]
    date_hierarchy = "created_at"


@admin.register(StockEntryItem)
class StockEntryItemAdmin(admin.ModelAdmin):
    list_display = (
        "stock_entry",
        "medicine",
        "batch_number",
        "quantity",
        "unit_price",
        "expiry_date",
    )
    list_filter = ("expiry_date",)
    search_fields = ("stock_entry__posting_number", "medicine__name", "batch_number")


@admin.register(StockLedger)
class StockLedgerAdmin(admin.ModelAdmin):
    list_display = (
        "transaction_id",
        "medicine",
        "transaction_type",
        "quantity",
        "unit_price",
        "reference_document",
        "created_at",
    )
    list_filter = ("transaction_type", "created_at")
    search_fields = ("medicine__name", "reference_document")
    readonly_fields = ("created_at",)
    date_hierarchy = "created_at"


@admin.register(CostLayer)
class CostLayerAdmin(admin.ModelAdmin):
    list_display = (
        "medicine",
        "inventory",
        "unit_cost",
        "original_quantity",
        "remaining_quantity",
        "sequence_number",
        "expiry_date",
        "is_active",
    )
    list_filter = ("is_active", "expiry_date")
    search_fields = ("medicine__name",)
    readonly_fields = ("sequence_number",)


@admin.register(StockAdjustment)
class StockAdjustmentAdmin(admin.ModelAdmin):
    list_display = (
        "posting_number",
        "reason",
        "status",
        "created_by",
        "created_at",
    )
    list_filter = ("reason", "status", "created_at")
    search_fields = ("posting_number",)
    readonly_fields = ("posting_number", "created_at", "updated_at")
    inlines = [StockAdjustmentItemInline]
    date_hierarchy = "created_at"


@admin.register(StockAdjustmentItem)
class StockAdjustmentItemAdmin(admin.ModelAdmin):
    list_display = (
        "stock_adjustment",
        "medicine",
        "batch",
        "quantity_change",
        "unit_cost",
    )
    search_fields = ("stock_adjustment__posting_number", "medicine__name", "batch__batch_number")


@admin.register(SalesReturn)
class SalesReturnAdmin(admin.ModelAdmin):
    list_display = (
        "posting_number",
        "reference_invoice",
        "customer_name",
        "status",
        "created_by",
        "created_at",
    )
    list_filter = ("status", "created_at")
    search_fields = ("posting_number", "reference_invoice", "customer_name")
    readonly_fields = ("posting_number", "created_at", "updated_at")
    inlines = [SalesReturnItemInline]
    date_hierarchy = "created_at"


@admin.register(SalesReturnItem)
class SalesReturnItemAdmin(admin.ModelAdmin):
    list_display = ("sales_return", "medicine", "quantity", "unit_price", "cost_to_restore")
    search_fields = ("sales_return__posting_number", "medicine__name", "batch__batch_number")


@admin.register(SupplierReturn)
class SupplierReturnAdmin(admin.ModelAdmin):
    list_display = (
        "posting_number",
        "supplier",
        "reference_document",
        "status",
        "created_by",
        "created_at",
    )
    list_filter = ("status", "created_at")
    search_fields = ("posting_number", "supplier__name", "reference_document")
    readonly_fields = ("posting_number", "created_at", "updated_at")
    inlines = [SupplierReturnItemInline]
    date_hierarchy = "created_at"


@admin.register(SupplierReturnItem)
class SupplierReturnItemAdmin(admin.ModelAdmin):
    list_display = (
        "supplier_return",
        "medicine",
        "quantity",
        "unit_price",
        "total_cost_reversed",
    )
    search_fields = ("supplier_return__posting_number", "medicine__name", "batch__batch_number")


@admin.register(PrintFormat)
class PrintFormatAdmin(admin.ModelAdmin):
    list_display = (
        "document_type",
        "name",
        "template_key",
        "paper_size",
        "orientation",
        "is_active",
        "is_default",
    )
    list_filter = ("document_type", "template_key", "is_active", "is_default")
    search_fields = ("name", "slug", "description")
    readonly_fields = ("slug", "created_at", "updated_at")


@admin.register(GoodRecivingNote)
class GoodReceivingNoteAdmin(admin.ModelAdmin):
    list_display = (
        "good_reciving_note_id",
        "supplier_display",
        "invoice_number",
        "total_amount",
        "received_at",
    )
    list_filter = ("received_at", "supplier_id")
    search_fields = ("invoice_number", "supplier_id__name", "good_reciving_note_id")
    readonly_fields = ("good_reciving_note_id", "received_at")
    inlines = [GoodReceivingNoteItemInline]
    date_hierarchy = "received_at"

    @admin.display(description="Supplier", ordering="supplier_id")
    def supplier_display(self, obj):
        return obj.supplier_id


@admin.register(GoodRecivingNoteItem)
class GoodReceivingNoteItemAdmin(admin.ModelAdmin):
    list_display = ("good_reciving_note", "medicine", "quantity", "unit_price", "total_price")
    search_fields = ("good_reciving_note__good_reciving_note_id", "medicine__name")


class StockTakeItemInline(admin.TabularInline):
    model = StockTakeItem
    extra = 1
    fields = ("medicine", "batch", "system_quantity", "counted_quantity", "variance", "notes")
    readonly_fields = ("system_quantity", "variance")


@admin.register(StockTake)
class StockTakeAdmin(admin.ModelAdmin):
    list_display = (
        "posting_number",
        "title",
        "status",
        "created_by",
        "started_at",
        "completed_at",
    )
    list_filter = ("status", "created_at")
    search_fields = ("posting_number", "title")
    readonly_fields = ("posting_number", "created_at", "updated_at")
    inlines = [StockTakeItemInline]
    date_hierarchy = "created_at"


@admin.register(StockTakeItem)
class StockTakeItemAdmin(admin.ModelAdmin):
    list_display = (
        "stock_take",
        "medicine",
        "system_quantity",
        "counted_quantity",
        "variance",
    )
    list_filter = ("stock_take__status",)
    search_fields = ("stock_take__posting_number", "medicine__name")


@admin.register(ReorderConfig)
class ReorderConfigAdmin(admin.ModelAdmin):
    list_display = (
        "medicine",
        "reorder_level",
        "safety_stock",
        "reorder_quantity",
        "lead_time_days",
        "is_active",
    )
    list_filter = ("is_active",)
    search_fields = ("medicine__name",)


@admin.register(ReorderAlert)
class ReorderAlertAdmin(admin.ModelAdmin):
    list_display = (
        "medicine",
        "current_stock",
        "reorder_level",
        "status",
        "priority",
        "triggered_at",
    )
    list_filter = ("status", "priority", "triggered_at")
    search_fields = ("medicine__name",)
    readonly_fields = ("triggered_at",)


@admin.register(ExpiryNotification)
class ExpiryNotificationAdmin(admin.ModelAdmin):
    list_display = (
        "medicine",
        "batch",
        "expiry_date",
        "days_to_expiry",
        "quantity_at_risk",
        "status",
        "priority",
    )
    list_filter = ("status", "priority", "expiry_date")
    search_fields = ("medicine__name", "batch__batch_number")
    readonly_fields = ("notified_at",)


@admin.register(ExpiryConfig)
class ExpiryConfigAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "warning_days",
        "critical_days",
        "notification_frequency_days",
        "is_active",
    )
    list_filter = ("is_active",)
