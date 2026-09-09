class MSG91Service {
    constructor() {
        this.authKey = process.env.MSG91_AUTH_KEY;
        this.widgetId = process.env.MSG91_WIDGET_ID;
        
        console.log('MSG91Service initialized');
        console.log('Auth Key exists:', !!this.authKey);
    }

    async verifyAccessToken(accessToken) {
        try {
            const url = 'https://control.msg91.com/api/v5/widget/verifyAccessToken';
            
            console.log('=== MSG91 verifyAccessToken ===');
            console.log('URL:', url);
            console.log('Access Token:', accessToken ? accessToken.substring(0, 20) + '...' : 'null');
            
            const payload = {
                authkey: this.authKey,
                'access-token': accessToken
            };
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            console.log('MSG91 verifyAccessToken response:', data);
            
            if (data.code === 702 && data.message === 'access-token already verified') {
                return {
                    success: true,
                    verified: true,
                    phone: undefined,
                    email: data.email,
                    data: data
                };
            }

            if (!response.ok || data.type === 'error' || data.status === 'error') {
                throw new Error(data.message || 'Token verification failed');
            }

            const phone = data.mobile || data.phone || data.number;

            return {
                success: true,
                verified: true,
                phone: phone,
                email: data.email,
                data: data
            };
        } catch (error) {
            console.error('MSG91 Token Verification Error:', error);
            throw error;
        }
    }
}

export default new MSG91Service();
