/**
 * Send OTP via Fast2SMS
 * @param {string} phone - Phone number (10 digits without country code)
 * @param {string} otp - OTP value (numeric, up to 10 digits)
 * @param {boolean} flash - Send as flash message (optional)
 * @returns {Promise<object>} Response from Fast2SMS API
 */
export async function sendOTP(phone, otp, flash = false) {
    const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;

    if (!FAST2SMS_API_KEY) {
        console.error('Fast2SMS API key is not configured');
        throw new Error('SMS service not configured');
    }

    // Remove +91 prefix if present
    const cleanPhone = phone;

    // Validate phone number (should be 10 digits)
    if (!/^\d{10}$/.test(cleanPhone)) {
        throw new Error('Invalid phone number format. Must be 10 digits.');
    }

    // Validate OTP (should be numeric)
    if (!/^\d+$/.test(otp)) {
        throw new Error('OTP must be numeric');
    }

    const url = 'https://www.fast2sms.com/dev/bulkV2';

    const payload = {
        variables_values: otp,
        route: 'otp',
        numbers: cleanPhone,
        flash: flash ? '1' : '0'
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'authorization': FAST2SMS_API_KEY,
                'Content-Type': 'application/json',
                'cache-control': 'no-cache'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Fast2SMS Error:', data);
            throw new Error(data.message || 'Failed to send OTP');
        }

        // Fast2SMS response format:
        // { return: true, request_id: "...", message: ["..."] }
        if (!data.return) {
            throw new Error('Failed to send OTP via SMS');
        }

        console.log('OTP sent successfully:', {
            phone: cleanPhone,
            requestId: data.request_id,
            message: data.message
        });

        return {
            success: true,
            requestId: data.request_id,
            message: 'OTP sent successfully'
        };

    } catch (error) {
        console.error('Error sending OTP:', error);
        throw error;
    }
}

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP
 */
export function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP to multiple phone numbers
 * @param {string[]} phones - Array of phone numbers
 * @param {string} otp - OTP value
 * @returns {Promise<object>} Response from Fast2SMS API
 */
export async function sendBulkOTP(phones, otp) {
    const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;

    if (!FAST2SMS_API_KEY) {
        throw new Error('SMS service not configured');
    }

    // Clean and validate all phone numbers
    const cleanPhones = phones
        .map(phone => phone.replace(/^\+91/, '').replace(/\s/g, ''))
        .filter(phone => /^\d{10}$/.test(phone));

    if (cleanPhones.length === 0) {
        throw new Error('No valid phone numbers provided');
    }

    const url = 'https://www.fast2sms.com/dev/bulkV2';

    const payload = {
        variables_values: otp,
        route: 'otp',
        numbers: cleanPhones.join(',')
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'authorization': FAST2SMS_API_KEY,
                'Content-Type': 'application/json',
                'cache-control': 'no-cache'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok || !data.return) {
            throw new Error(data.message || 'Failed to send OTP');
        }

        return {
            success: true,
            requestId: data.request_id,
            sentTo: cleanPhones.length,
            message: 'OTP sent successfully to all numbers'
        };

    } catch (error) {
        console.error('Error sending bulk OTP:', error);
        throw error;
    }
}