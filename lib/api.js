const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

class APIClient {
    constructor() {
        this.token = null;
    }

    setToken(token) {
        this.token = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('authToken', token);
        }
    }

    getToken() {
        if (typeof window !== 'undefined' && !this.token) {
            this.token = localStorage.getItem('authToken');
        }
        return this.token;
    }

    clearToken() {
        this.token = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('authToken');
        }
    }

    async request(endpoint, options = {}) {
        const token = this.getToken();

        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers,
            },
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth endpoints
    async signup(userData) {
        const data = await this.request('/api/auth/signup', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        this.setToken(data.token);
        return data;
    }

    async login(credentials) {
        const data = await this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
        this.setToken(data.token);
        return data;
    }

    async sendOTP(phone) {
        return await this.request('/api/auth/send-otp', {
            method: 'POST',
            body: JSON.stringify({ phone }),
        });
    }

    async verifyOTP(phone, otp, fullName) {
        const data = await this.request('/api/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify({ phone, otp, fullName }),
        });
        this.setToken(data.token);
        return data;
    }

    // Appointments endpoints
    async getAppointments() {
        return await this.request('/api/appointments');
    }

    async createAppointment(appointmentData) {
        return await this.request('/api/appointments', {
            method: 'POST',
            body: JSON.stringify(appointmentData),
        });
    }

    async updateAppointment(id, updates) {
        return await this.request(`/api/appointments/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }

    async cancelAppointment(id) {
        return await this.request(`/api/appointments/${id}`, {
            method: 'DELETE',
        });
    }

    async getAvailableSlots(date) {
        return await this.request(`/api/appointments/available-slots?date=${date}`);
    }

    // Bills endpoints
    async getBills() {
        return await this.request('/api/bills');
    }

    async updateBill(id, updates) {
        return await this.request(`/api/bills/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }

    async createBill(billData) {
        return await this.request('/api/bills', {
            method: 'POST',
            body: JSON.stringify(billData),
        });
    }

    // Admin endpoints
    async getUsers() {
        return await this.request('/api/admin/users');
    }

    async getBlockedSlots() {
        return await this.request('/api/admin/blocked-slots');
    }

    async blockSlot(slotData) {
        return await this.request('/api/admin/blocked-slots', {
            method: 'POST',
            body: JSON.stringify(slotData),
        });
    }

    async getBlockedDays() {
        return await this.request('/api/admin/blocked-days');
    }

    async blockDay(dayData) {
        return await this.request('/api/admin/blocked-days', {
            method: 'POST',
            body: JSON.stringify(dayData),
        });
    }
}

export const api = new APIClient();