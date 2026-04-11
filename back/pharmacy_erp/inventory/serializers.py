from rest_framework import serializers

from tables.model_definitions import (
    Batches,
    Category,
    GoodRecivingNote,
    GoodRecivingNoteItem,
    Inventory,
    InventoryValuation,
    Medicine,
    PrintFormat,
    Purchase,
    PurchaseItem,
    Sale,
    SaleItem,
    SalesReturn,
    SalesReturnItem,
    StockAdjustment,
    StockAdjustmentItem,
    StockEntry,
    StockEntryItem,
    StockLedger,
    Supplier,
    SupplierReturn,
    SupplierReturnItem,
)


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model."""

    parent_category_name = serializers.CharField(
        source="parent_category.name", read_only=True
    )
    medicine_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "category_name",
            "parent_category",
            "parent_category_name",
            "description",
            "naming_series",
            "medicine_count",
            "created_at",
        ]

    def get_medicine_count(self, obj):
        return obj.medicines.count()

    def validate_name(self, value):
        normalized = value.strip()
        queryset = Category.objects.filter(name__iexact=normalized)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(
                "A category with this name already exists."
            )
        return normalized


class SupplierSerializer(serializers.ModelSerializer):
    """Serializer for Supplier model."""

    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Supplier
        fields = [
            "id",
            "name",
            "contact_person",
            "phone",
            "email",
            "address",
            "naming_series",
            "status",
            "status_label",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["naming_series"]

    def validate_name(self, value):
        return value.strip()

    def validate_email(self, value):
        if value:
            return value.strip().lower()
        return value


class MedicineSerializer(serializers.ModelSerializer):
    """Serializer for Medicine model."""

    category_name = serializers.CharField(source="category.name", read_only=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    costing_method_label = serializers.CharField(
        source="get_costing_method_display", read_only=True
    )
    print_name = serializers.CharField(source="print.name", read_only=True)
    current_stock = serializers.SerializerMethodField()
    average_cost = serializers.SerializerMethodField()

    class Meta:
        model = Medicine
        fields = [
            "id",
            "name",
            "generic_name",
            "category",
            "category_name",
            "supplier",
            "supplier_name",
            "cost_price",
            "selling_price",
            "barcode",
            "print",
            "print_name",
            "naming_series",
            "description",
            "status",
            "status_label",
            "costing_method",
            "costing_method_label",
            "is_active",
            "current_stock",
            "average_cost",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["naming_series"]

    def get_current_stock(self, obj):
        """Get total stock quantity across all batches."""
        from tables.model_definitions import Batches

        batches = Batches.objects.filter(product_id=obj)
        return sum(b.quantity for b in batches if b.quantity > 0)

    def get_average_cost(self, obj):
        """Get average cost from InventoryValuation if available."""
        try:
            valuation = InventoryValuation.objects.get(medicine=obj)
            return valuation.average_cost
        except (InventoryValuation.DoesNotExist, Exception):
            return obj.cost_price

    def validate_name(self, value):
        normalized = value.strip()
        queryset = Medicine.objects.filter(name__iexact=normalized)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(
                "A medicine with this name already exists."
            )
        return normalized

    def validate_barcode(self, value):
        if value:
            normalized = value.strip()
            queryset = Medicine.objects.filter(barcode__iexact=normalized)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError(
                    "A medicine with this barcode already exists."
                )
            return normalized
        return value


class BatchSerializer(serializers.ModelSerializer):
    """Serializer for Batches model."""

    product_name = serializers.CharField(source="product_id.name", read_only=True)
    supplier_name = serializers.CharField(source="supplier_id.name", read_only=True)
    days_to_expiry = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = Batches
        fields = [
            "batch_id",
            "product_id",
            "product_name",
            "batch_number",
            "expiry_date",
            "manufacturing_date",
            "quantity",
            "purchase_price",
            "supplier_id",
            "supplier_name",
            "days_to_expiry",
            "is_expired",
            "created_at",
        ]

    def get_days_to_expiry(self, obj):
        from django.utils import timezone

        return (obj.expiry_date - timezone.localdate()).days

    def get_is_expired(self, obj):
        from django.utils import timezone

        return obj.expiry_date < timezone.localdate()


class InventorySerializer(serializers.ModelSerializer):
    """Serializer for Inventory model."""

    medicine_name = serializers.CharField(source="medicine.name", read_only=True)

    class Meta:
        model = Inventory
        fields = [
            "id",
            "medicine",
            "medicine_name",
            "quantity",
            "batch_number",
            "expiry_date",
            "location",
            "created_at",
            "updated_at",
        ]


class StockLedgerSerializer(serializers.ModelSerializer):
    """Serializer for StockLedger model."""

    medicine_name = serializers.CharField(source="medicine.name", read_only=True)
    batch_number = serializers.CharField(source="batch.batch_number", read_only=True)
    transaction_type_label = serializers.CharField(
        source="get_transaction_type_display", read_only=True
    )

    class Meta:
        model = StockLedger
        fields = [
            "transaction_id",
            "medicine",
            "medicine_name",
            "batch",
            "batch_number",
            "transaction_type",
            "transaction_type_label",
            "quantity",
            "unit_price",
            "reference_document",
            "notes",
            "created_at",
        ]


class StockEntryItemSerializer(serializers.ModelSerializer):
    """Serializer for StockEntryItem model."""

    medicine_name = serializers.CharField(source="medicine.name", read_only=True)
    medicine_barcode = serializers.CharField(source="medicine.barcode", read_only=True)

    class Meta:
        model = StockEntryItem
        fields = [
            "id",
            "stock_entry",
            "medicine",
            "medicine_name",
            "medicine_barcode",
            "batch",
            "batch_number",
            "quantity",
            "unit_price",
            "total_price",
            "manufacturing_date",
            "expiry_date",
            "reference",
            "notes",
            "created_at",
        ]


class StockEntrySerializer(serializers.ModelSerializer):
    """Serializer for StockEntry model."""

    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    purchase_invoice = serializers.CharField(
        source="purchase.invoice_number", read_only=True
    )
    received_by_name = serializers.CharField(
        source="received_by.username", read_only=True
    )
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    items = StockEntryItemSerializer(many=True, read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = StockEntry
        fields = [
            "id",
            "posting_number",
            "supplier",
            "supplier_name",
            "purchase",
            "purchase_invoice",
            "goods_receiving_note",
            "invoice_number",
            "status",
            "status_label",
            "total_cost",
            "tax",
            "grand_total",
            "notes",
            "received_by",
            "received_by_name",
            "items",
            "item_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["posting_number", "received_by"]

    def get_item_count(self, obj):
        return obj.items.count()


class SaleItemSerializer(serializers.ModelSerializer):
    """Serializer for SaleItem model."""

    medicine_name = serializers.CharField(source="medicine.name", read_only=True)
    batch_number = serializers.CharField(source="batch.batch_number", read_only=True)
    gross_profit = serializers.ReadOnlyField()
    profit_margin = serializers.ReadOnlyField()

    class Meta:
        model = SaleItem
        fields = [
            "id",
            "sale",
            "medicine",
            "medicine_name",
            "quantity",
            "batch",
            "batch_number",
            "price_at_sale",
            "subtotal",
            "calculated_cost",
            "unit_cost",
            "cost_layers_used",
            "costing_method",
            "gross_profit",
            "profit_margin",
        ]


class SaleSerializer(serializers.ModelSerializer):
    """Serializer for Sale model."""

    cashier_name = serializers.CharField(source="cashier.username", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    payment_method_label = serializers.CharField(
        source="get_payment_method_display", read_only=True
    )
    items = SaleItemSerializer(many=True, read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = [
            "id",
            "posting_number",
            "invoice_number",
            "customer_name",
            "cashier",
            "cashier_name",
            "status",
            "status_label",
            "total_amount",
            "payment_method",
            "payment_method_label",
            "notes",
            "items",
            "item_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["posting_number", "invoice_number", "cashier"]

    def get_item_count(self, obj):
        return obj.items.count()


class StockAdjustmentItemSerializer(serializers.ModelSerializer):
    """Serializer for StockAdjustmentItem model."""

    medicine_name = serializers.CharField(source="medicine.name", read_only=True)

    class Meta:
        model = StockAdjustmentItem
        fields = [
            "id",
            "adjustment",
            "medicine",
            "medicine_name",
            "batch",
            "batch_number",
            "quantity_before",
            "quantity_after",
            "adjustment_reason",
            "notes",
        ]


class StockAdjustmentSerializer(serializers.ModelSerializer):
    """Serializer for StockAdjustment model."""

    created_by_name = serializers.CharField(source="created_by.username", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    reason_label = serializers.CharField(source="get_reason_display", read_only=True)
    items = StockAdjustmentItemSerializer(many=True, read_only=True)

    class Meta:
        model = StockAdjustment
        fields = [
            "id",
            "posting_number",
            "reason",
            "reason_label",
            "status",
            "status_label",
            "created_by",
            "created_by_name",
            "notes",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["posting_number", "created_by"]


class SalesReturnItemSerializer(serializers.ModelSerializer):
    """Serializer for SalesReturnItem model."""

    medicine_name = serializers.CharField(source="medicine.name", read_only=True)

    class Meta:
        model = SalesReturnItem
        fields = [
            "id",
            "sales_return",
            "medicine",
            "medicine_name",
            "quantity",
            "unit_price",
            "total_amount",
            "reason",
        ]


class SalesReturnSerializer(serializers.ModelSerializer):
    """Serializer for SalesReturn model."""

    created_by_name = serializers.CharField(source="created_by.username", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    items = SalesReturnItemSerializer(many=True, read_only=True)

    class Meta:
        model = SalesReturn
        fields = [
            "id",
            "posting_number",
            "reference_invoice",
            "customer_name",
            "created_by",
            "created_by_name",
            "status",
            "status_label",
            "notes",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["posting_number", "created_by"]


class SupplierReturnItemSerializer(serializers.ModelSerializer):
    """Serializer for SupplierReturnItem model."""

    medicine_name = serializers.CharField(source="medicine.name", read_only=True)

    class Meta:
        model = SupplierReturnItem
        fields = [
            "id",
            "supplier_return",
            "medicine",
            "medicine_name",
            "batch",
            "quantity",
            "unit_price",
            "total_amount",
            "reason",
        ]


class SupplierReturnSerializer(serializers.ModelSerializer):
    """Serializer for SupplierReturn model."""

    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    items = SupplierReturnItemSerializer(many=True, read_only=True)

    class Meta:
        model = SupplierReturn
        fields = [
            "id",
            "posting_number",
            "supplier",
            "supplier_name",
            "reference_document",
            "created_by",
            "created_by_name",
            "status",
            "status_label",
            "notes",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["posting_number", "created_by"]


class PrintFormatSerializer(serializers.ModelSerializer):
    """Serializer for PrintFormat model."""

    document_type_label = serializers.CharField(
        source="get_document_type_display", read_only=True
    )
    template_label = serializers.CharField(source="get_template_key_display", read_only=True)
    has_custom_template = serializers.SerializerMethodField()

    class Meta:
        model = PrintFormat
        fields = [
            "id",
            "document_type",
            "document_type_label",
            "name",
            "slug",
            "template_key",
            "template_label",
            "description",
            "html_template",
            "css_template",
            "js_template",
            "has_custom_template",
            "paper_size",
            "orientation",
            "is_active",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["slug"]

    def get_has_custom_template(self, obj):
        return bool(
            (obj.html_template or "").strip()
            or (obj.css_template or "").strip()
            or (obj.js_template or "").strip()
        )


class InventoryValuationSerializer(serializers.ModelSerializer):
    """Serializer for InventoryValuation model."""

    medicine_name = serializers.CharField(source="medicine.name", read_only=True)

    class Meta:
        model = InventoryValuation
        fields = [
            "id",
            "medicine",
            "medicine_name",
            "total_quantity",
            "total_value",
            "average_cost",
            "last_movement_at",
            "last_updated",
        ]


class PurchaseItemSerializer(serializers.ModelSerializer):
    """Serializer for PurchaseItem model."""

    medicine_name = serializers.CharField(source="medicine.name", read_only=True)

    class Meta:
        model = PurchaseItem
        fields = [
            "id",
            "purchase",
            "medicine",
            "medicine_name",
            "quantity",
            "unit_price",
            "total_price",
        ]


class PurchaseSerializer(serializers.ModelSerializer):
    """Serializer for Purchase model."""

    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    items = PurchaseItemSerializer(many=True, read_only=True)

    class Meta:
        model = Purchase
        fields = [
            "id",
            "posting_number",
            "supplier",
            "supplier_name",
            "status",
            "status_label",
            "total_amount",
            "notes",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["posting_number"]


class GoodReceivingNoteItemSerializer(serializers.ModelSerializer):
    """Serializer for GoodReceivingNoteItem model."""

    medicine_name = serializers.CharField(source="medicine.name", read_only=True)

    class Meta:
        model = GoodRecivingNoteItem
        fields = [
            "id",
            "grn",
            "medicine",
            "medicine_name",
            "quantity",
            "unit_price",
            "total_price",
        ]


class GoodReceivingNoteSerializer(serializers.ModelSerializer):
    """Serializer for GoodReceivingNote model."""

    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    items = GoodReceivingNoteItemSerializer(many=True, read_only=True)

    class Meta:
        model = GoodRecivingNote
        fields = [
            "id",
            "posting_number",
            "supplier",
            "supplier_name",
            "status",
            "status_label",
            "total_amount",
            "notes",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["posting_number"]


class StockTakeItemSerializer(serializers.ModelSerializer):
    """Serializer for StockTakeItem model."""

    medicine_name = serializers.CharField(source="medicine.name", read_only=True)
    medicine_barcode = serializers.CharField(source="medicine.barcode", read_only=True)
    batch_number = serializers.CharField(source="batch.batch_number", read_only=True, allow_null=True)
    variance = serializers.ReadOnlyField()
    variance_percentage = serializers.ReadOnlyField()
    variance_status = serializers.ReadOnlyField()
    unit_cost_display = serializers.SerializerMethodField()
    counted_by_name = serializers.CharField(source="counted_by.username", read_only=True)

    class Meta:
        model = StockTakeItem
        fields = [
            "id",
            "stock_take",
            "medicine",
            "medicine_name",
            "medicine_barcode",
            "batch",
            "batch_number",
            "system_quantity",
            "counted_quantity",
            "variance",
            "variance_percentage",
            "variance_status",
            "unit_cost",
            "unit_cost_display",
            "notes",
            "counted_by",
            "counted_by_name",
            "counted_at",
            "created_at",
        ]
        read_only_fields = ["system_quantity", "counted_by", "counted_at"]

    def get_unit_cost_display(self, obj):
        return str(obj.unit_cost) if obj.unit_cost else None


class StockTakeSerializer(serializers.ModelSerializer):
    """Serializer for StockTake model."""

    created_by_name = serializers.CharField(source="created_by.username", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    items = StockTakeItemSerializer(many=True, read_only=True)
    totals = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = StockTake
        fields = [
            "id",
            "posting_number",
            "title",
            "notes",
            "status",
            "status_label",
            "started_at",
            "completed_at",
            "created_by",
            "created_by_name",
            "items",
            "totals",
            "item_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["posting_number", "created_by"]

    def get_totals(self, obj):
        return obj.calculate_totals()

    def get_item_count(self, obj):
        return obj.items.count()


class ReorderConfigSerializer(serializers.ModelSerializer):
    """Serializer for ReorderConfig model."""

    medicine_name = serializers.CharField(source="medicine.name", read_only=True)

    class Meta:
        model = ReorderConfig
        fields = [
            "id",
            "medicine",
            "medicine_name",
            "reorder_level",
            "safety_stock",
            "reorder_quantity",
            "lead_time_days",
            "is_active",
            "last_updated",
        ]


class ReorderAlertSerializer(serializers.ModelSerializer):
    """Serializer for ReorderAlert model."""

    medicine_name = serializers.CharField(source="medicine.name", read_only=True)
    medicine_barcode = serializers.CharField(source="medicine.barcode", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    priority_label = serializers.CharField(source="get_priority_display", read_only=True)
    shortage_quantity = serializers.ReadOnlyField()
    suggested_order_quantity = serializers.ReadOnlyField()
    acknowledged_by_name = serializers.CharField(source="acknowledged_by.username", read_only=True)

    class Meta:
        model = ReorderAlert
        fields = [
            "id",
            "medicine",
            "medicine_name",
            "medicine_barcode",
            "current_stock",
            "reorder_level",
            "shortage_quantity",
            "suggested_order_quantity",
            "status",
            "status_label",
            "priority",
            "priority_label",
            "notes",
            "triggered_at",
            "acknowledged_at",
            "acknowledged_by",
            "acknowledged_by_name",
            "resolved_at",
        ]
        read_only_fields = ["triggered_at"]


class ExpiryNotificationSerializer(serializers.ModelSerializer):
    """Serializer for ExpiryNotification model."""

    medicine_name = serializers.CharField(source="medicine.name", read_only=True)
    batch_number = serializers.CharField(source="batch.batch_number", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    priority_label = serializers.CharField(source="get_priority_display", read_only=True)
    is_expired = serializers.ReadOnlyField()
    is_critical = serializers.ReadOnlyField()
    total_value_at_risk = serializers.ReadOnlyField()
    acknowledged_by_name = serializers.CharField(source="acknowledged_by.username", read_only=True)
    actioned_by_name = serializers.CharField(source="actioned_by.username", read_only=True)

    class Meta:
        model = ExpiryNotification
        fields = [
            "id",
            "batch",
            "batch_number",
            "medicine",
            "medicine_name",
            "expiry_date",
            "days_to_expiry",
            "quantity_at_risk",
            "total_value_at_risk",
            "status",
            "status_label",
            "priority",
            "priority_label",
            "is_expired",
            "is_critical",
            "notification_type",
            "notes",
            "action_taken",
            "notified_at",
            "acknowledged_at",
            "acknowledged_by",
            "acknowledged_by_name",
            "actioned_at",
            "actioned_by",
            "actioned_by_name",
        ]
        read_only_fields = ["notified_at"]


class ExpiryConfigSerializer(serializers.ModelSerializer):
    """Serializer for ExpiryConfig model."""

    class Meta:
        model = ExpiryConfig
        fields = [
            "id",
            "name",
            "warning_days",
            "critical_days",
            "notification_frequency_days",
            "auto_dispose_expired",
            "is_active",
            "created_at",
            "updated_at",
        ]