import frappe
from frappe.utils import getdate, now_datetime, date_diff

def before_submit(doc, method=None):
    if doc.status != "Admitted":
        return

    if not doc.admitted_datetime:
        return

    admission_date = getdate(doc.admitted_datetime)
    today = getdate(now_datetime())
    days = max(1, date_diff(today, admission_date))

    for row in doc.billables:
        if not row.item:
            continue
        item_group = frappe.db.get_value("Item", row.item, "item_group")
        if item_group == "Bed Charges":
            row.quantity = days
            row.uom = "Day"
