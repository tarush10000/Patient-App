class MSG91Service {
    constructor() {
        this.authKey = process.env.MSG91_AUTH_KEY;
        this.widgetId = process.env.MSG91_WIDGET_ID;
        this.templateId = process.env.MSG91_TEMPLATE_ID;
        
        console.log('MSG91Service initialized');
        console.log('Auth Key exists:', !!this.authKey);
        console.log('Widget ID exists:', !!this.widgetId);
        console.log('Template ID exists:', !!this.templateId);
    }

    async sendOTP(mobile) {
        try {
            const url = `https://control.msg91.com/api/v5/otp`;
            console.log('MSG91 SendOTP URL:', url);
            console.log('MSG91 SendOTP Payload:', {
                template_id: this.templateId,
                mobile: mobile,
                mobile_country_code: '91'
            });
            console.log('MSG91 Auth Key exists:', !!this.authKey);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authkey': this.authKey
                },
                body: JSON.stringify({
                    template_id: this.templateId,
                    mobile: mobile,
                    mobile_country_code: '91'
                })
            });

            const data = await response.json();
            console.log('MSG91 SendOTP Response:', data);
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to send OTP');
            }

            return { success: true, reqId: data.request_id };
        } catch (error) {
            console.error('MSG91 SendOTP Error:', error);
            throw error;
        }
    }

    async verifyAccessToken(accessToken) {
        try {
            const url = 'https://control.msg91.com/api/v5/widget/verifyAccessToken';
            
            console.log('=== MSG91 verifyAccessToken ===');
            console.log('URL:', url);
            console.log('Access Token:', accessToken ? accessToken.substring(0, 20) + '...' : 'null');
            console.log('Auth Key exists:', !!this.authKey);
            
            const payload = {
                authkey: this.authKey,
                'access-token': accessToken
            };
            
            console.log('Payload:', JSON.stringify(payload, null, 2));
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', JSON.stringify(data, null, 2));
            
            if (!response.ok || data.type === 'error') {
                throw new Error(data.message || 'Token verification failed');
            }

            // Extract phone number - MSG91 might return it in different formats
            // Note: MSG91 widget verification may not return phone number
            const phone = data.mobile || data.phone || data.number;
            console.log('Extracted phone:', phone);

            return {
                success: true,
                verified: true,
                phone: phone, // May be undefined
                email: data.email
            };
        } catch (error) {
            console.error('MSG91 Token Verification Error:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}

export default new MSG91Service();