import frappe
from frappe import _

def validate(doc, method=None):
    if doc.start_date and doc.end_date:
        start_year = doc.start_date.year
        end_year = doc.end_date.year
        doc.name = f"{start_year}-{end_year}"