// Bind events to Patient Encounter form
frappe.ui.form.on('Patient Encounter', {
    onload: function(frm) {
        fetch_medication_requests(frm);
        fetch_procedure_requests(frm);
        fetch_lab_tests(frm);
    },
    refresh: function(frm) {
        fetch_medication_requests(frm);
        fetch_procedure_requests(frm);
        fetch_lab_tests(frm);
    },
    appointment: function(frm) {
        fetch_medication_requests(frm);
        fetch_procedure_requests(frm);
        fetch_lab_tests(frm);
    }
});

// Function to fetch Medication Requests linked to the Patient Appointment
function fetch_medication_requests(frm) {
    if (!frm.doc.appointment) {
        return;
    }

    frappe.db.get_list('Medication Request', {
        filters: {
            custom_visit_id: frm.doc.appointment
        },
        fields: ['medication', 'medication_item', 'dosage', 'period', 'dosage_form', 'name']
    }).then(results => {
        let existing_requests = frm.doc.drug_prescription.map(row => row.medication_request);

        results.forEach(med => {
            if (!existing_requests.includes(med.name)) {
                let row = frm.add_child('drug_prescription');
                row.medication = med.medication;
                row.drug_code = med.medication_item;
                row.dosage = med.dosage;
                row.period = med.period;
                row.dosage_form = med.dosage_form;
                row.medication_request = med.name;
            } else {
                frappe.msgprint(`Medication request ${med.name} already exists.`);
            }
        });

        frm.refresh_field('drug_prescription');
    }).catch(error => {
        console.error('Error fetching medication requests:', error);
    });
}

// Function to fetch Clinical Procedure Requests
function fetch_procedure_requests(frm) {
    if (!frm.doc.appointment) {
        return;
    }

    frappe.db.get_list('Service Request', {
        filters: {
            custom_visit_id: frm.doc.appointment,
            template_dt: 'Clinical Procedure Template'
        },
        fields: ['template_dn', 'order_date', 'name']
    }).then(results => {
        let existing_service_requests = frm.doc.procedure_prescription.map(row => row.service_request);

        results.forEach(sr => {
            if (!existing_service_requests.includes(sr.name)) {
                let row = frm.add_child('procedure_prescription');
                row.procedure = sr.template_dn;
                row.procedure_name = sr.template_dn;
                row.date = sr.order_date;
                row.service_request = sr.name;
                row.invoiced = 0;
            } else {
                frappe.msgprint(`Procedure request ${sr.name} already exists.`);
            }
        });

        frm.refresh_field('procedure_prescription');
    }).catch(error => {
        console.error('Error fetching procedure requests:', error);
    });
}

// Function to fetch Lab Tests linked to the Patient Appointment
function fetch_lab_tests(frm) {
    if (!frm.doc.appointment) {
        return;
    }

    frappe.db.get_list('Service Request', {
        filters: {
            custom_visit_id: frm.doc.appointment,
            template_dt: 'Lab Test Template'
        },
        fields: ['template_dn', 'name']
    }).then(results => {
        let existing_service_requests = frm.doc.lab_test_prescription.map(row => row.service_request);

        results.forEach(sr => {
            if (!existing_service_requests.includes(sr.name)) {
                let row = frm.add_child('lab_test_prescription');
                row.lab_test_code = sr.template_dn;
                row.lab_test_name = sr.template_dn;
                row.service_request = sr.name;
                row.invoiced = 0;
            } else {
                frappe.msgprint(`Lab test request ${sr.name} already exists.`);
            }
        });

        frm.refresh_field('lab_test_prescription');
    }).catch(error => {
        console.error('Error fetching lab tests:', error);
    });
}