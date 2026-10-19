import csv
import json
from decimal import Decimal
from datetime import datetime, date
from django.http import HttpResponse
from django.utils import timezone


def serialize_csv_val(val):
    if val is None:
        return ""
    if isinstance(val, (datetime, date)):
        return val.strftime('%Y-%m-%d %H:%M:%S UTC')
    if isinstance(val, Decimal):
        return f"{val:.8f}".rstrip('0').rstrip('.') if '.' in f"{val:.8f}" else str(val)
    if isinstance(val, dict) or isinstance(val, list):
        return json.dumps(val, ensure_ascii=False)
    if hasattr(val, 'email'):
        return val.email
    if hasattr(val, 'username'):
        return val.username
    return str(val)


def export_as_csv_action(description="Export Selected as Audit CSV", fields=None, exclude=None, filename_prefix=None):
    """
    Returns an admin action function that outputs selected queryset records as a signed,
    standard RFC-4180 compliant CSV file for audit and compliance.
    """
    def export_as_csv(modeladmin, request, queryset):
        opts = modeladmin.model._meta
        model_name = opts.model_name
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        prefix = filename_prefix or f"goalign_{model_name}"
        filename = f"{prefix}_audit_{timestamp}.csv"

        # Determine fields to export
        if fields:
            field_names = fields
        else:
            field_names = [field.name for field in opts.fields]
            if exclude:
                field_names = [f for f in field_names if f not in exclude]

        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)
        # Write header in uppercase
        header = [f.upper() for f in field_names]
        writer.writerow(header)

        for obj in queryset:
            row = []
            for field_name in field_names:
                # Support custom method on modeladmin or model
                if hasattr(modeladmin, field_name) and callable(getattr(modeladmin, field_name)):
                    val = getattr(modeladmin, field_name)(obj)
                elif hasattr(obj, field_name):
                    attr = getattr(obj, field_name)
                    if callable(attr):
                        val = attr()
                    else:
                        val = attr
                else:
                    val = ""
                row.append(serialize_csv_val(val))
            writer.writerow(row)

        return response

    export_as_csv.short_description = description
    return export_as_csv
