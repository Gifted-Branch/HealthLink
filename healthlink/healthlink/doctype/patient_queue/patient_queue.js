// Copyright (c) 2025, Douglas-Nkubitu and contributors
// For license information, please see license.txt

frappe.ui.form.on('Patient Queue', {
    refresh: function(frm) {
        if (frm.doc.status === 'In Progress' || frm.doc.status === 'Waiting') {

            // Mapping: Button label → department name & color class
            const departmentButtons = {
                'Send to Triage':    { department: 'Nursing',      color: 'btn-primary' },
                'Send to Doctor':    { department: 'Consultation', color: 'btn-success' },
                'Send to Lab':       { department: 'Laboratory',   color: 'btn-warning' },
                'Send to Pharmacy':  { department: 'Pharmacy',     color: 'btn-info' },
                'Send to Billing':   { department: 'Billing',      color: 'btn-secondary' },
                'Send to Radiology': { department: 'Radiology',    color: 'btn-danger' },
                'Pick Patient':      { department: '',             color: 'btn-primary' } // New button for Pick Patient
            };

            // Optional headline to organize buttons visually
            frm.dashboard.set_headline(__('Send Patient To:'));

            // Loop through each button config
            for (const [label, { department, color }] of Object.entries(departmentButtons)) {
                if (frm.doc.department !== department) {
                    frm.add_custom_button(label, () => {
                        if (label === 'Pick Patient') {
                            pick_patient(frm); // Call the function for Pick Patient
                        } else {
                            send_to_next_department(frm, department);
                        }
                    }, null, color);  // ✅ null = no group, color = button class
                }
            }
        }
    }
});

// Function to pick the patient from the form view
function pick_patient(frm) {
    frappe.confirm(
        'Do you want to pick this patient for processing?',
        () => {
            // Update the status of the patient to 'In Progress'
            frm.set_value('status', 'In Progress');
            frm.save().then(() => {
                frappe.msgprint('Patient picked for processing');
            });
        }
    );
}

// Function to send the patient to the next department
function send_to_next_department(frm, next_department) {
    frappe.confirm(
        `Send patient to ${next_department}?`,
        () => {
            frm.set_value('status', 'Completed');
            frm.save().then(() => {
                frappe.call({
                    method: "frappe.client.insert",
                    args: {
                        doc: {
                            doctype: "Patient Queue",
                            patient: frm.doc.patient,
                            appointment: frm.doc.appointment,
                            department: next_department,
                            from_department: frm.doc.department,
                            status: "Waiting",
                            queue_time: frappe.datetime.now_datetime()
                        }
                    },
                    callback: function(res) {
                        frappe.msgprint(`Patient sent to ${next_department}`);
                        
                        // Redirect to the Kanban view of Patient Queue
                        frappe.set_route('List', 'Patient Queue', {'view': 'kanban'});
                    }
                });
            });
        }
    );
}

// Adding "Pick Patient" button to List View
frappe.listview_settings['Patient Queue'] = {
    onload: function(listview) {
        // Add a "Pick Patient" button to the List View
        listview.page.add_action('Pick Patient', function() {
            let selected_patient = listview.get_checked_items();
            
            if (selected_patient.length > 0) {
                let patient = selected_patient[0];  // Assuming only one patient is selected
                pick_patient_from_list(patient);  // Call the function for processing the selected patient
            } else {
                frappe.msgprint(__('Please select a patient first.'));
            }
        });
    }
};

// Function to pick the patient from the list
function pick_patient_from_list(patient) {
    frappe.confirm(
        'Do you want to pick this patient for processing?',
        () => {
            // Update the status of the patient to 'In Progress'
            frappe.call({
                method: 'frappe.client.set_value',
                args: {
                    doctype: 'Patient Queue',
                    name: patient.name,
                    fieldname: 'status',
                    value: 'In Progress'
                },
                callback: function(response) {
                    frappe.msgprint('Patient picked for processing');
                    // Optionally refresh the list view to show updated status
                    frappe.views.listview.refresh();
                }
            });
        }
    );
}
