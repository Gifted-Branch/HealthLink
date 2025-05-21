frappe.ui.form.on('Vital Signs', {
    refresh: function(frm) {
        // Display buttons when the document is opened
        if (!frm.doc.appointment) {
            return;
        }

        frm.add_custom_button(__('Send to Doctor'), () => {
            send_to_next_department(frm, 'Consultation');
        });

        frm.add_custom_button(__('Send to Front Desk'), () => {
            send_to_next_department(frm, 'Front Desk');
        });
    }
});

// Function to send patient to next department and update Patient Queue
function send_to_next_department(frm, next_department) {
    const patient = frm.doc.patient;
    const appointment = frm.doc.appointment;

    // Fetch Patient Queue for the given appointment
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Patient Queue",
            filters: {
                appointment: appointment,
                department: "Nursing", // Only check if the department is Nursing
                status: ["!=", "Completed"] // Only select those not completed
            },
            fields: ["name", "status", "department"]
        },
        callback: function(r) {
            if (r.message && r.message.length > 0) {
                // Patient found in queue
                const queue = r.message[0];
                // Check if we need to update the existing queue record
                if (queue.status !== "Completed") {
                    // Update the status of the Patient Queue to 'Completed'
                    frappe.call({
                        method: "frappe.client.set_value",
                        args: {
                            doctype: "Patient Queue",
                            name: queue.name,
                            fieldname: {
                                status: "Completed"
                            }
                        },
                        callback: function() {
                            // Insert or update the next department
                            create_or_update_patient_queue(frm, patient, appointment, next_department);
                        }
                    });
                } else {
                    // If the status is already "Completed", show a message and do nothing
                    frappe.msgprint(`Patient is already sent to ${next_department}, no further action needed.`);
                }
            } else {
                // No Patient Queue record found, proceed to insert a new one
                create_or_update_patient_queue(frm, patient, appointment, next_department);
            }
        }
    });
}

// Function to create or update a Patient Queue record for the next department
function create_or_update_patient_queue(frm, patient, appointment, next_department) {
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Patient Queue",
            filters: {
                appointment: appointment,
                department: next_department,
                status: ["!=", "Completed"] // Only check for non-completed status
            },
            fields: ["name"]
        },
        callback: function(r) {
            if (r.message && r.message.length > 0) {
                // Patient is already in the next department's queue, update the status
                const queue = r.message[0];
                frappe.call({
                    method: "frappe.client.set_value",
                    args: {
                        doctype: "Patient Queue",
                        name: queue.name,
                        fieldname: {
                            status: "Waiting"
                        }
                    },
                    callback: function() {
                        frappe.msgprint(`Patient's status updated in ${next_department} queue.`);
                    }
                });
            } else {
                // No record found, insert a new Patient Queue entry
                frappe.call({
                    method: "frappe.client.insert",
                    args: {
                        doc: {
                            doctype: "Patient Queue",
                            patient: patient,
                            appointment: appointment,
                            department: next_department,
                            from_department: "Nursing", // From Nursing
                            status: "Waiting",
                            queue_time: frappe.datetime.now_datetime()
                        }
                    },
                    callback: function() {
                        frappe.msgprint(`Patient sent to ${next_department}`);
                        frm.refresh(); // Refresh the form
                    }
                });
            }
        }
    });
}
