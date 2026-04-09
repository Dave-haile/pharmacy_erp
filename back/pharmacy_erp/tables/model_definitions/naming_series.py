# pharmacy_erp/tables/modle/naming_series.py

from django.db import IntegrityError, models, transaction

class MedicineNamingSeries(models.Model):
    """
    Model to manage naming series for medicines.
    Generates unique medicine codes in format: MED-YYYY-NNNN
    """
    
    PREFIX = "MED"
    
    series_name = models.CharField(max_length=50, unique=True, default="medicine_series")
    current_number = models.PositiveIntegerField(default=0)
    prefix = models.CharField(max_length=10, default=PREFIX)
    year = models.PositiveIntegerField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'MedicineNamingSeries'
        verbose_name = 'Medicine Naming Series'
        verbose_name_plural = 'Medicine Naming Series'
        unique_together = ['prefix', 'year']
    
    def __str__(self):
        return f"{self.prefix}-{self.year}-{self.current_number:04d}"

    @classmethod
    def build_series_name(cls, prefix, year):
        return f"{prefix.lower()}_series_{year}"
    
    @classmethod
    @transaction.atomic
    def get_next_number(cls, prefix=None):
        """
        Get the next number in the series for the current year.
        Creates a new series entry if it doesn't exist for the current year.
        """
        from django.utils import timezone
        
        current_year = timezone.now().year
        prefix = prefix or cls.PREFIX
        series_name = cls.build_series_name(prefix, current_year)
        
        series = cls.objects.select_for_update().filter(
            prefix=prefix,
            year=current_year,
        ).first()

        if series is None:
            try:
                series = cls.objects.create(
                    prefix=prefix,
                    year=current_year,
                    series_name=series_name,
                    current_number=1,
                )
            except IntegrityError:
                # Another request created the same prefix/year series first.
                series = cls.objects.select_for_update().get(
                    prefix=prefix,
                    year=current_year,
                )
                series.current_number += 1
        else:
            series.current_number += 1

        if series.series_name != series_name:
            series.series_name = series_name
        
        series.save()
        
        # Generate the naming series code
        return f"{prefix}-{current_year}-{series.current_number:04d}"
    
    @classmethod
    def reset_series(cls, prefix=None, year=None):
        """
        Reset the naming series for a specific prefix and year.
        """
        from django.utils import timezone
        
        year = year or timezone.now().year
        prefix = prefix or cls.PREFIX
        
        series = cls.objects.filter(prefix=prefix, year=year).first()
        if series:
            series.current_number = 0
            series.save()
            return True
        return False
