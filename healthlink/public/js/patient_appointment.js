frappe.ui.form.on('Patient Appointment', {
    custom_payment_option: function(frm) {
        toggle_insurance_fields(frm);
    },
    onload: function(frm) {
        toggle_insurance_fields(frm);
    }
});

function toggle_insurance_fields(frm) {
    const is_insurance = frm.doc.custom_payment_option === "Insurance";

    frm.set_df_property('custom_insurance_details', 'hidden', !is_insurance);
    frm.set_df_property('custom_member_no', 'hidden', !is_insurance);
    frm.set_df_property('custom_scheme_name', 'hidden', !is_insurance);
    frm.set_df_property('custom_scheme_period', 'hidden', !is_insurance);
}


frappe.ui.form.on('Patient Appointment', {
    refresh: function(frm) {
        // Fetch current date
        const currentDate = frappe.datetime.get_today();
        // Check if appointment date is today
        if (frm.doc.appointment_date === currentDate) {            
            // Add patient to Patient Queue
            add_patient_to_queue(frm);
        } else {
            frappe.msgprint('Appointment date is not today. No action taken.');
        }

        // Display department buttons for patient actions regardless of queue status
        show_department_buttons(frm);
    }
});

// Function to add patient to queue
function add_patient_to_queue(frm) {
    // Check if the patient is already in the queue
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Patient Queue",
            filters: {
                appointment: frm.doc.name,
                status: "Waiting"
            },
            fields: ["name"]
        },
        callback: function(response) {
            if (response.message && response.message.length > 0) {
    
            } else {
                // Create new Patient Queue entry
                frappe.call({
                    method: "frappe.client.insert",
                    args: {
                        doc: {
                            doctype: "Patient Queue",
                            patient: frm.doc.patient,                    // Patient
                            appointment: frm.doc.name,                   // Appointment
                            patient_name: frm.doc.patient_name,          // Patient Name (from Appointment)
                            visit: frm.doc.visit,                        // Visit (you can change this field name as needed)
                            department: "Front Desk",                  // Default department (you can update this based on department)
                            status: "Waiting",
                            queue_time: frappe.datetime.now_datetime(), // Current Queue Time
                            assigned_to: frm.doc.assigned_to            // Assigned To (if applicable)
                        }
                    },
                    callback: function(res) {
                        if (res.message) {
                            frappe.msgprint(__('Patient added to queue.'));
                        }
                    }
                });
            }
        }
    });
}

// Function to show department buttons for actions
function show_department_buttons(frm) {
    // Mapping: Button label → department name & color class
    const departmentButtons = {
        'Send to Triage':    { department: 'Nursing',      color: 'btn-primary' },
        'Send to Doctor':    { department: 'Consultation', color: 'btn-success' },
        'Send to Lab':       { department: 'Laboratory',   color: 'btn-warning' },
        // Removed 'Send to Pharmacy' and 'Send to Billing'
        // 'Send to Pharmacy':  { department: 'Pharmacy',     color: 'btn-info' },
        // 'Send to Billing':   { department: 'Billing',      color: 'btn-secondary' },
        'Send to Radiology': { department: 'Radiology',    color: 'btn-danger' }
    };

    // Optional headline to organize buttons visually
    frm.dashboard.set_headline(__('Send Patient To:'));

    // Loop through each button config
    for (const [label, { department, color }] of Object.entries(departmentButtons)) {
        if (frm.doc.department !== department) {
            frm.add_custom_button(label, () => {
                send_to_next_department(frm, department);
            }, null, color);  // ✅ null = no group, color = button class
        }
    }
}

// Function to queue the patient to the selected department
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
                            patient_name: frm.doc.patient_name,          // Ensure patient name is passed correctly
                            visit: frm.doc.visit,                        // Visit field, update if needed
                            department: next_department,                 // Department sent to
                            from_department: frm.doc.department,         // Current department
                            status: "Waiting",
                            queue_time: frappe.datetime.now_datetime(), // Current Queue Time
                            assigned_to: frm.doc.assigned_to            // Assigned to field
                        }
                    },
                    callback: function(res) {
                        frappe.msgprint(`Patient sent to ${next_department}`);
                    }
                });
            });
        }
    );
}
