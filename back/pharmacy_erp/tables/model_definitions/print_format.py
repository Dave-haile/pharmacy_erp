from django.db import models, transaction
from django.utils.text import slugify


class PrintFormat(models.Model):
    DOCUMENT_TYPE_MEDICINE = "medicine"
    DOCUMENT_TYPE_SUPPLIER = "supplier"
    DOCUMENT_TYPE_EMPLOYEE = "employee"
    DOCUMENT_TYPE_DEPARTMENT = "department"
    DOCUMENT_TYPE_CATEGORY = "category"
    DOCUMENT_TYPE_STOCK_ENTRY = "stock_entry"
    DOCUMENT_TYPE_STOCK_OUT = "stock_out"
    DOCUMENT_TYPE_STOCK_ADJUSTMENT = "stock_adjustment"
    DOCUMENT_TYPE_SALES_RETURN = "sales_return"
    DOCUMENT_TYPE_SUPPLIER_RETURN = "supplier_return"
    DOCUMENT_TYPE_PURCHASE = "purchase"
    DOCUMENT_TYPE_GRN = "grn"

    DOCUMENT_TYPE_CHOICES = [
        (DOCUMENT_TYPE_MEDICINE, "Medicine"),
        (DOCUMENT_TYPE_SUPPLIER, "Supplier"),
        (DOCUMENT_TYPE_EMPLOYEE, "Employee"),
        (DOCUMENT_TYPE_DEPARTMENT, "Department"),
        (DOCUMENT_TYPE_CATEGORY, "Category"),
        (DOCUMENT_TYPE_STOCK_ENTRY, "Stock Entry"),
        (DOCUMENT_TYPE_STOCK_OUT, "Stock Out"),
        (DOCUMENT_TYPE_STOCK_ADJUSTMENT, "Stock Adjustment"),
        (DOCUMENT_TYPE_SALES_RETURN, "Sales Return"),
        (DOCUMENT_TYPE_SUPPLIER_RETURN, "Supplier Return"),
        (DOCUMENT_TYPE_PURCHASE, "Purchase"),
        (DOCUMENT_TYPE_GRN, "GRN"),
    ]

    TEMPLATE_STANDARD = "standard"
    TEMPLATE_COMPACT = "compact"
    TEMPLATE_INVOICE = "invoice"
    TEMPLATE_RECEIPT = "receipt"

    TEMPLATE_CHOICES = [
        (TEMPLATE_STANDARD, "Standard"),
        (TEMPLATE_COMPACT, "Compact"),
        (TEMPLATE_INVOICE, "Invoice"),
        (TEMPLATE_RECEIPT, "Receipt"),
    ]

    ORIENTATION_PORTRAIT = "portrait"
    ORIENTATION_LANDSCAPE = "landscape"
    ORIENTATION_CHOICES = [
        (ORIENTATION_PORTRAIT, "Portrait"),
        (ORIENTATION_LANDSCAPE, "Landscape"),
    ]

    PAPER_A4 = "A4"
    PAPER_LETTER = "Letter"
    PAPER_THERMAL = "Thermal"
    PAPER_SIZE_CHOICES = [
        (PAPER_A4, "A4"),
        (PAPER_LETTER, "Letter"),
        (PAPER_THERMAL, "Thermal"),
    ]

    document_type = models.CharField(
        max_length=40,
        choices=DOCUMENT_TYPE_CHOICES,
        db_index=True,
    )
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=160)
    template_key = models.CharField(max_length=40, choices=TEMPLATE_CHOICES)
    description = models.CharField(max_length=255, blank=True)
    html_template = models.TextField(blank=True)
    css_template = models.TextField(blank=True)
    js_template = models.TextField(blank=True)
    paper_size = models.CharField(
        max_length=20,
        choices=PAPER_SIZE_CHOICES,
        default=PAPER_A4,
    )
    orientation = models.CharField(
        max_length=20,
        choices=ORIENTATION_CHOICES,
        default=ORIENTATION_PORTRAIT,
    )
    is_active = models.BooleanField(default=True, db_index=True)
    is_default = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)

        with transaction.atomic():
            super().save(*args, **kwargs)
            if self.is_default:
                type(self).objects.filter(document_type=self.document_type).exclude(
                    pk=self.pk
                ).update(is_default=False)

    def __str__(self):
        return f"{self.get_document_type_display()} - {self.name}"

    class Meta:
        db_table = "PrintFormat"
        ordering = ["document_type", "-is_default", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["document_type", "slug"],
                name="uniq_print_format_document_type_slug",
            )
        ]
