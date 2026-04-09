# pharmacy_erp/inventory/utils.py

from tables.model_definitions.naming_series import MedicineNamingSeries

def generate_medicine_naming_series(prefix=None):
    """
    Utility function to generate a unique naming series for medicines.
    
    Args:
        prefix (str, optional): Custom prefix for the naming series. 
                               Defaults to "MED".
    
    Returns:
        str: Generated naming series in format: PREFIX-YYYY-NNNN
             Example: MED-2026-0001
    
    Raises:
        Exception: If there's an error generating the naming series
    """
    try:
        return MedicineNamingSeries.get_next_number(prefix)
    except Exception as e:
        raise Exception(f"Error generating medicine naming series: {str(e)}")

def reset_medicine_naming_series(prefix=None, year=None):
    """
    Utility function to reset the medicine naming series for a specific year.
    
    Args:
        prefix (str, optional): Prefix to reset. Defaults to "MED".
        year (int, optional): Year to reset. Defaults to current year.
    
    Returns:
        bool: True if reset was successful, False otherwise
    """
    try:
        return MedicineNamingSeries.reset_series(prefix, year)
    except Exception:
        return False

def get_current_naming_series_info(prefix=None):
    """
    Get current information about the naming series.
    
    Args:
        prefix (str, optional): Prefix to check. Defaults to "MED".
    
    Returns:
        dict: Information about the current naming series
    """
    from django.utils import timezone
    
    current_year = timezone.now().year
    prefix = prefix or MedicineNamingSeries.PREFIX
    
    try:
        series = MedicineNamingSeries.objects.get(prefix=prefix, year=current_year)
        return {
            'current_number': series.current_number,
            'next_number': series.current_number + 1,
            'prefix': series.prefix,
            'year': series.year,
            'next_series': f"{prefix}-{current_year}-{series.current_number + 1:04d}"
        }
    except MedicineNamingSeries.DoesNotExist:
        return {
            'current_number': 0,
            'next_number': 1,
            'prefix': prefix,
            'year': current_year,
            'next_series': f"{prefix}-{current_year}-0001"
        }
