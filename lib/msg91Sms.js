/**
 * MSG91 SMS Service
 * Sends DLT-registered SMS messages via the MSG91 Flow API.
 *
 * Template mapping (Sender ID: VSLMDC):
 *  1. Appointment Delay Notice    → 1077278040026083978  vars: name, time1, time2, min
 *  2. Appointment Cancellation    → 1077517870026095180  vars: name, time
 *  3. Appointment Reminder        → 1077118720026108981  vars: name, time
 *  4. Appointment Confirmation    → 1077196220026117026  vars: name, time
 *  5. Appointment Reschedule      → 1077299910026131064  vars: name, time1, time2
 *  6. Post-Appointment Thank You  → 1077149550009302307  vars: name
 *  7. OTP Verification            → 1077574200017115541  vars: otp
 */

const MSG91_FLOW_URL = 'https://control.msg91.com/api/v5/flow';

// DLT Template IDs registered with MSG91
const TEMPLATE_IDS = {
    APPOINTMENT_DELAY:        '6a96e720323c686a8103d7a3',
    APPOINTMENT_CANCELLATION: '6a96e7735ec74120ef0ab734',
    APPOINTMENT_REMINDER:     '6a96e7b532ce5e952a0f5e43',
    APPOINTMENT_CONFIRMATION: '6a96e7e80537e79af0009ba4',
    APPOINTMENT_RESCHEDULE:   '6a96e83a0b5c34900102b142',
    POST_APPOINTMENT_THANKS:  '6a96e5cb91c64821840f1583',
    OTP_VERIFICATION:         '6a9d95b8fb6500fee6031553',
};

/**
 * Format phone number to 91XXXXXXXXXX (12-digit Indian format).
 * Accepts: 10-digit, +91..., or 91... forms.
 * @param {string} phone
 * @returns {string}
 */
function formatPhone(phone) {
    if (!phone) return '';
    // Strip all non-digit characters
    let digits = phone.toString().replace(/\D/g, '');
    // If it starts with 91 and has 12 digits, keep it
    if (digits.length === 12 && digits.startsWith('91')) {
        return digits;
    }
    // Take the last 10 digits (in case of 0 prefix, +91, etc.) and prepend 91
    if (digits.length >= 10) {
        return '91' + digits.slice(-10);
    }
    return digits;
}

/**
 * Truncate any variable to at most 30 characters as required by DLT regulations.
 * @param {any} val
 * @returns {string}
 */
function sanitizeVar(val) {
    if (val === undefined || val === null) return '';
    const str = String(val).trim();
    return str.length > 30 ? str.slice(0, 30).trim() : str;
}

/**
 * Core sender — calls the MSG91 Flow API.
 * @param {string} templateId  - MSG91 template ID
 * @param {string} mobile      - Formatted mobile number (91XXXXXXXXXX)
 * @param {Object} variables   - Key-value pairs matching the ##var## placeholders
 * @returns {Promise<Object>}
 */
async function sendFlow(templateId, mobile, variables) {
    const authKey = process.env.MSG91_AUTH_KEY;

    if (!authKey) {
        throw new Error('MSG91_AUTH_KEY is not configured');
    }

    // Ensure every variable strictly conforms to the DLT max 30 character limit
    const cleanVariables = {};
    for (const [k, v] of Object.entries(variables || {})) {
        cleanVariables[k] = sanitizeVar(v);
    }

    const payload = {
        template_id: templateId,
        short_url: '0',
        recipients: [
            {
                mobiles: mobile,
                ...cleanVariables
            }
        ]
    };

    console.log(`[MSG91 SMS] Sending template ${templateId} to ${mobile}`, cleanVariables);

    const response = await fetch(MSG91_FLOW_URL, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'authkey': authKey,
            'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('[MSG91 SMS] Response:', JSON.stringify(data));

    if (!response.ok || data.type === 'error') {
        throw new Error(data.message || `MSG91 API error (HTTP ${response.status})`);
    }

    return { success: true, data };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public helper functions — one per SMS template
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Template 1 – Appointment Delay Notice
 * "Dear ##name##, your appointment has been delayed.
 *  Original appointment: ##time1##. New appointment: ##time2##.
 *  Delay: ##min## minutes. For concerns, contact +91 7300843777 or +91 9837033107."
 *
 * @param {string} phone
 * @param {{ patientName: string, originalTime: string, newTime: string, delayMinutes: number }} details
 */
async function sendAppointmentDelaySMS(phone, { patientName, originalTime, newTime, delayMinutes }) {
    return sendFlow(
        TEMPLATE_IDS.APPOINTMENT_DELAY,
        formatPhone(phone),
        {
            name:  patientName,
            time1: originalTime,
            time2: newTime,
            min:   String(delayMinutes)
        }
    );
}

/**
 * Template 2 – Appointment Cancellation
 * "Dear ##name##, your appointment scheduled for ##time## has been cancelled.
 *  To reschedule, please book a new appointment or contact +91 7300843777 or +91 9837033107.
 *  We hope to serve you soon."
 *
 * @param {string} phone
 * @param {{ patientName: string, appointmentTime: string }} details
 */
async function sendAppointmentCancellationSMS(phone, { patientName, appointmentTime }) {
    return sendFlow(
        TEMPLATE_IDS.APPOINTMENT_CANCELLATION,
        formatPhone(phone),
        {
            name: patientName,
            time: appointmentTime
        }
    );
}

/**
 * Template 3 – Appointment Reminder
 * "Dear ##name##, this is a reminder about your upcoming appointment.
 *  Appointment details: ##time##.
 *  Please arrive 10 minutes early. To reschedule, contact +91 7300843777 or +91 9837033107."
 *
 * @param {string} phone
 * @param {{ patientName: string, appointmentTime: string }} details
 */
async function sendAppointmentReminderSMS(phone, { patientName, appointmentTime }) {
    return sendFlow(
        TEMPLATE_IDS.APPOINTMENT_REMINDER,
        formatPhone(phone),
        {
            name: patientName,
            time: appointmentTime
        }
    );
}

/**
 * Template 4 – Appointment Confirmation
 * "Dear ##name##, your appointment has been confirmed.
 *  Appointment details: ##time##.
 *  Please arrive 10 minutes early. For changes, contact +91 7300843777 or +91 9837033107."
 *
 * @param {string} phone
 * @param {{ patientName: string, appointmentTime: string }} details
 */
async function sendAppointmentConfirmationSMS(phone, { patientName, appointmentTime }) {
    return sendFlow(
        TEMPLATE_IDS.APPOINTMENT_CONFIRMATION,
        formatPhone(phone),
        {
            name: patientName,
            time: appointmentTime
        }
    );
}

/**
 * Template 5 – Appointment Reschedule
 * "Dear ##name##, your appointment has been rescheduled.
 *  Previous appointment: ##time1##. New appointment: ##time2##.
 *  Please arrive 10 minutes early. For changes, contact +91 7300843777 or +91 9837033107."
 *
 * @param {string} phone
 * @param {{ patientName: string, previousTime: string, newTime: string }} details
 */
async function sendAppointmentRescheduleSMS(phone, { patientName, previousTime, newTime }) {
    return sendFlow(
        TEMPLATE_IDS.APPOINTMENT_RESCHEDULE,
        formatPhone(phone),
        {
            name:  patientName,
            time1: previousTime,
            time2: newTime
        }
    );
}

/**
 * Template 6 – Post-Appointment Thank You
 * "Dear ##name##, thank you for visiting our center today.
 *  Your health and well-being are our top priority.
 *  If you have any questions, please contact us at +91 7300843777 or +91 9837033107.
 *  Take care and stay healthy."
 *
 * @param {string} phone
 * @param {{ patientName: string }} details
 */
async function sendThankYouSMS(phone, { patientName }) {
    return sendFlow(
        TEMPLATE_IDS.POST_APPOINTMENT_THANKS,
        formatPhone(phone),
        {
            name: patientName
        }
    );
}

/**
 * Template 7 – OTP Verification
 * "Your OTP for mobile number verification during appointment booking is ##otp##.
 *  This code is valid for 10 minutes. Do not share this code with anyone."
 *
 * @param {string} phone
 * @param {string} otp
 */
async function sendOTPViaSMS(phone, otp) {
    return sendFlow(
        TEMPLATE_IDS.OTP_VERIFICATION,
        formatPhone(phone),
        {
            otp: String(otp)
        }
    );
}

export {
    sendAppointmentDelaySMS,
    sendAppointmentCancellationSMS,
    sendAppointmentReminderSMS,
    sendAppointmentConfirmationSMS,
    sendAppointmentRescheduleSMS,
    sendThankYouSMS,
    sendOTPViaSMS,
};
