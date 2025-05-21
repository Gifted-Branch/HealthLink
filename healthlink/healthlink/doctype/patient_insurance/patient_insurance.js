// Copyright (c) 2025, Douglas-Nkubitu and contributors
// For license information, please see license.txt

frappe.ui.form.on('Patient Insurance', {
    insurance_name: function (frm) {
        frm.set_query('scheme_name', () => {
            return {
                filters: {
                    insurance_company: frm.doc.insurance_name
                  //  is_active: 1
                }
            };
        });
    }
});