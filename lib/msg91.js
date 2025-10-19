class MSG91Service {
    constructor() {
        this.authKey = process.env.MSG91_AUTH_KEY;
        this.widgetId = process.env.MSG91_WIDGET_ID;
        this.templateId = process.env.MSG91_TEMPLATE_ID;
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
            console.log('MSG91 Auth Key:', this.authKey);
            
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
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    authkey: this.authKey,
                    'access-token': accessToken
                })
            });

            const data = await response.json();
            
            if (!response.ok || data.type === 'error') {
                throw new Error(data.message || 'Token verification failed');
            }

            return {
                success: true,
                phone: data.mobile,
                email: data.email,
                verified: true
            };
        } catch (error) {
            console.error('MSG91 Token Verification Error:', error);
            throw error;
        }
    }
}

export default new MSG91Service();