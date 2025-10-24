'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, User, AlertCircle } from 'lucide-react';

export default function AuthPage({ initialMode = 'login' }) {
    const router = useRouter();
    const [authMode, setAuthMode] = useState(initialMode);
    const [loading, setLoading] = useState(false);
    const [showGuestWarning, setShowGuestWarning] = useState(false);
    const [otpSent, setOtpSent] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        otp: '',
        rememberMe: false
    });

    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const checkExistingAuth = async () => {
            const token = localStorage.getItem('authToken');
            const rememberToken = getCookie('authToken');

            if (token || rememberToken) {
                try {
                    const response = await fetch('/api/user/profile', {
                        headers: {
                            'Authorization': `Bearer ${token || rememberToken}`
                        }
                    });

                    if (response.ok) {
                        router.push('/dashboard');
                    } else {
                        localStorage.removeItem('authToken');
                        deleteCookie('authToken');
                    }
                } catch (error) {
                    localStorage.removeItem('authToken');
                    deleteCookie('authToken');
                }
            }
        };

        checkExistingAuth();
    }, [router]);

    const getCookie = (name) => {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    };

    const deleteCookie = (name) => {
        if (typeof document !== 'undefined') {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setErrors(prev => ({ ...prev, [name]: '', general: '' }));
    };

    const resetForm = () => {
        setFormData({
            fullName: '',
            phone: '',
            otp: '',
            rememberMe: false
        });
        setErrors({});
        setSuccessMessage('');
        setOtpSent(false);
    };

    const handleGuestAppointment = () => {
        setShowGuestWarning(true);
    };

    const confirmGuestAppointment = () => {
        router.push('/guest-appointment');
    };

    const handleSendOTP = async () => {
        setErrors({});
        setSuccessMessage('');

        if (!formData.phone || formData.phone.length < 10) {
            setErrors({ phone: 'Please enter a valid 10-digit phone number' });
            return;
        }

        if (authMode === 'signup' && !formData.fullName) {
            setErrors({ fullName: 'Please enter your name' });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: formData.phone })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send OTP');
            }

            setOtpSent(true);
            setSuccessMessage('OTP sent successfully to your WhatsApp!');
        } catch (error) {
            setErrors({ general: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        setErrors({});

        if (!formData.otp || formData.otp.length !== 6) {
            setErrors({ otp: 'Please enter a valid 6-digit OTP' });
            return;
        }

        if (authMode === 'signup' && !formData.fullName) {
            setErrors({ fullName: 'Please enter your name' });
            return;
        }

        setLoading(true);

        try {
            const requestBody = {
                phone: formData.phone,
                otp: formData.otp,
                rememberMe: formData.rememberMe
            };

            // Add fullName only for signup
            if (authMode === 'signup') {
                requestBody.fullName = formData.fullName;
            }

            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            localStorage.setItem('authToken', data.token);
            setSuccessMessage(data.message || 'Authentication successful!');

            setTimeout(() => {
                router.push('/dashboard');
            }, 1000);

        } catch (error) {
            setErrors({ general: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setLoading(true);
        setErrors({});

        try {
            const response = await fetch('/api/auth/resend-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: formData.phone })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to resend OTP');
            }

            setSuccessMessage('OTP resent successfully to your WhatsApp!');
        } catch (error) {
            setErrors({ general: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
                    <h1 className="text-2xl font-bold">Dr. Appointment System</h1>
                    <p className="text-sm mt-1 opacity-90">
                        {authMode === 'login' ? 'Welcome back!' : 'Create your account'}
                    </p>
                </div>

                <div className="p-6">
                    <div className="flex mb-6 border-b">
                        <button
                            onClick={() => {
                                setAuthMode('login');
                                resetForm();
                            }}
                            className={`flex-1 py-2 font-semibold transition ${
                                authMode === 'login'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500'
                            }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => {
                                setAuthMode('signup');
                                resetForm();
                            }}
                            className={`flex-1 py-2 font-semibold transition ${
                                authMode === 'signup'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500'
                            }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {errors.general && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm">
                            {errors.general}
                        </div>
                    )}

                    {successMessage && (
                        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4 text-sm">
                            {successMessage}
                        </div>
                    )}

                    {!otpSent ? (
                        <div>
                            {authMode === 'signup' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Full Name *
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            placeholder="Enter your full name"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    {errors.fullName && <p className="text-red-600 text-xs mt-1">{errors.fullName}</p>}
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Phone Number *
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="Enter 10-digit mobile number"
                                        maxLength="10"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
                            </div>

                            <button
                                onClick={handleSendOTP}
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Sending...' : 'Send OTP'}
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm text-gray-600 mb-4">
                                We've sent an OTP to your WhatsApp number ending in {formData.phone.slice(-4)}
                            </p>

                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Enter OTP *
                                </label>
                                <input
                                    type="text"
                                    name="otp"
                                    value={formData.otp}
                                    onChange={handleInputChange}
                                    placeholder="Enter 6-digit OTP"
                                    maxLength="6"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center text-lg font-semibold tracking-widest"
                                />
                                {errors.otp && <p className="text-red-600 text-xs mt-1">{errors.otp}</p>}
                            </div>

                            <div className="mb-4 flex items-center">
                                <input
                                    type="checkbox"
                                    id="rememberMe"
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleInputChange}
                                    className="mr-2"
                                />
                                <label htmlFor="rememberMe" className="text-sm text-gray-700">
                                    Remember me for 30 days
                                </label>
                            </div>

                            <button
                                onClick={handleVerifyOTP}
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                            >
                                {loading ? 'Verifying...' : 'Verify OTP'}
                            </button>

                            <button
                                onClick={handleResendOTP}
                                disabled={loading}
                                className="w-full text-blue-600 text-sm font-semibold hover:underline"
                            >
                                Resend OTP
                            </button>
                        </div>
                    )}

                    {/* Guest Option - Only show on login */}
                    {authMode === 'login' && !otpSent && (
                        <>
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">OR</span>
                                </div>
                            </div>

                            <button
                                onClick={handleGuestAppointment}
                                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                            >
                                Continue as Guest (Book Appointment Only)
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Guest Warning Modal */}
            {showGuestWarning && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center mb-4">
                            <AlertCircle className="text-yellow-500 mr-3" size={24} />
                            <h3 className="text-lg font-semibold">Guest Booking Limitations</h3>
                        </div>
                        <p className="text-gray-600 mb-4">
                            As a guest, you'll be able to book appointments, but you won't have access to:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 mb-6 space-y-1">
                            <li>View appointment history</li>
                            <li>Edit or cancel appointments</li>
                            <li>Save your information for future bookings</li>
                            <li>Access billing information</li>
                        </ul>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowGuestWarning(false)}
                                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                            >
                                Back to Login
                            </button>
                            <button
                                onClick={confirmGuestAppointment}
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                            >
                                Continue as Guest
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
