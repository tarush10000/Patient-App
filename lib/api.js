const API_BASE_URL = '/api';

class ApiService {
    // Token management
    getToken() {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('authToken');
        }
        return null;
    }

    setToken(token) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('authToken', token);
        }
    }

    removeToken() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('authToken');
        }
    }

    // Auth headers
    getAuthHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    // Auth APIs
    async sendOTP(phone) {
        const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
        return data;
    }

    async verifyOTP(phone, otp, fullName = '') {
        const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, otp, fullName })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to verify OTP');

        if (data.token) this.setToken(data.token);
        return data;
    }

    async signup(userData) {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Signup failed');

        if (data.token) this.setToken(data.token);
        return data;
    }

    async login(credentials) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Login failed');

        if (data.token) this.setToken(data.token);
        return data;
    }

    logout() {
        this.removeToken();
    }

    // User Profile APIs
    async getUserProfile() {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            headers: this.getAuthHeaders()
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch profile');
        return data;
    }

    async updateUserProfile(updates) {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            method: 'PATCH',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(updates)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update profile');
        return data;
    }

    // Appointment APIs
    async getAppointments() {
        const response = await fetch(`${API_BASE_URL}/appointments`, {
            headers: this.getAuthHeaders()
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch appointments');
        return data;
    }

    async createAppointment(appointmentData) {
        const response = await fetch(`${API_BASE_URL}/appointments`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(appointmentData)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to create appointment');
        return data;
    }

    async updateAppointment(id, updates) {
        const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
            method: 'PATCH',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(updates)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update appointment');
        return data;
    }

    async cancelAppointment(id) {
        const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
            method: 'PATCH',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ status: 'cancelled' })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to cancel appointment');
        return data;
    }

    async delayAppointment(id, delayMinutes) {
        const response = await fetch(`${API_BASE_URL}/appointments/${id}/delay`, {
            method: 'PATCH',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ delayMinutes })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to delay appointment');
        return data;
    }

    async deleteAppointment(id) {
        const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders()
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to delete appointment');
        return data;
    }

    async getAvailableSlots(date) {
        const response = await fetch(`${API_BASE_URL}/appointments/available-slots?date=${date}`, {
            headers: this.getAuthHeaders()
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch available slots');
        return data;
    }

    // Bill APIs
    async getBills() {
        const response = await fetch(`${API_BASE_URL}/bills`, {
            headers: this.getAuthHeaders()
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch bills');
        return data;
    }

    async createBill(billData) {
        console.log('Creating bill with data:', billData);  // Debug log
        const response = await fetch(`${API_BASE_URL}/bills`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(billData)  // Send data as-is
        });
        console.log('Response received:', response);  // Debug log

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to create bill');
        return data;
    }

    async updateBillStatus(id, status) {
        const response = await fetch(`${API_BASE_URL}/bills/${id}`, {
            method: 'PATCH',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ status })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update bill');
        return data;
    }

    // User Management APIs
    async getUsers() {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: this.getAuthHeaders()
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch users');
        return data;
    }

    // Blocked Slots APIs
    async getBlockedSlots() {
        const response = await fetch(`${API_BASE_URL}/admin/blocked-slots`, {
            headers: this.getAuthHeaders()
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch blocked slots');
        return data;
    }

    async blockSlot(slotData) {
        const response = await fetch(`${API_BASE_URL}/admin/blocked-slots`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(slotData)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to block slot');
        return data;
    }

    async unblockSlot(id) {
        const response = await fetch(`${API_BASE_URL}/admin/blocked-slots/${id}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders()
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to unblock slot');
        return data;
    }

    // Blocked Days APIs
    async getBlockedDays() {
        const response = await fetch(`${API_BASE_URL}/admin/blocked-days`, {
            headers: this.getAuthHeaders()
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch blocked days');
        return data;
    }

    async blockDay(dayData) {
        const response = await fetch(`${API_BASE_URL}/admin/blocked-days`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(dayData)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to block day');
        return data;
    }

    async unblockDay(id) {
        const response = await fetch(`${API_BASE_URL}/admin/blocked-days/${id}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders()
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to unblock day');
        return data;
    }
}

export const api = new ApiService();