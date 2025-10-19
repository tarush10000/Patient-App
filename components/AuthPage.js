'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, User, Lock, AlertCircle, X } from 'lucide-react';
import Script from 'next/script';

export default function AuthPage({ initialMode = 'login' }) {
    const router = useRouter();
    const [authMode, setAuthMode] = useState(initialMode);
    const [loginMethod, setLoginMethod] = useState('otp'); // 'otp' or 'password'
    const [loading, setLoading] = useState(false);
    const [showGuestWarning, setShowGuestWarning] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [reqId, setReqId] = useState(null);
    const widgetInitialized = useRef(false);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        password: '',
        otp: '',
        rememberMe: false
    });

    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        // Check for existing auth token on mount
        const token = localStorage.getItem('authToken');
        const rememberToken = getCookie('authToken');

        if (token || rememberToken) {
            router.push('/dashboard');
        }
    }, []);

    useEffect(() => {
        // Initialize MSG91 widget configuration
        if (typeof window !== 'undefined' && !widgetInitialized.current) {
            window.otpConfig = {
                widgetId: "356a736b3462383434333432",
                tokenAuth: "175826TctI0F5YSPBB672e50a1P1", // This should be dynamically generated
                exposeMethods: true,
                success: (data) => {
                    console.log('OTP Widget Success Response:', data);
                    if (data && data.accessToken) {
                        handleOTPSuccess(data.accessToken);
                    } else {
                        console.error('No access token in success response');
                        setErrors({ general: 'OTP verification succeeded but no token received. Please try again.' });
                    }
                },
                failure: (error) => {
                    console.error('OTP Widget Failure Response:', error);
                    const errorMessage = error?.message || error?.error || 'OTP verification failed. Please try again.';
                    setErrors({ general: errorMessage });
                    setLoading(false);
                },
            };

            // Log the configuration for debugging
            console.log('MSG91 Widget Config:', window.otpConfig);
        }
    }, []);

    const getCookie = (name) => {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    };

    const handleOTPSuccess = async (accessToken) => {
        console.log('Processing OTP success with token:', accessToken);
        setLoading(true);
        setErrors({});

        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessToken,
                    phone: formData.phone,
                    fullName: authMode === 'signup' ? formData.fullName : undefined,
                    rememberMe: formData.rememberMe
                })
            });

            const data = await response.json();
            console.log('Server verification response:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            // Store token
            localStorage.setItem('authToken', data.token);

            // Show success message
            setSuccessMessage(data.message || 'Authentication successful!');

            // Redirect to dashboard
            setTimeout(() => {
                router.push('/dashboard');
            }, 1000);

        } catch (error) {
            console.error('OTP verification error:', error);
            setErrors({ general: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const response = await fetch('/api/auth/login-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: formData.phone,
                    password: formData.password,
                    rememberMe: formData.rememberMe
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            localStorage.setItem('authToken', data.token);
            setSuccessMessage('Login successful!');

            setTimeout(() => {
                router.push('/dashboard');
            }, 1000);

        } catch (error) {
            setErrors({ general: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSendOTP = async () => {
        setErrors({});
        setSuccessMessage('');

        // Validation
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
            // Format phone number (remove any spaces or special characters)
            const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
            const formattedPhone = cleanPhone.replace(/^91/, ''); // Remove country code if present

            console.log('Sending OTP to:', formattedPhone);

            // Check if MSG91 methods are available
            if (window.sendOtp) {
                window.sendOtp(
                    `91${formattedPhone}`,
                    (data) => {
                        console.log('OTP sent successfully:', data);
                        setOtpSent(true);
                        setSuccessMessage('OTP sent successfully! Please check your phone.');
                        setLoading(false);
                        if (data?.request_id) {
                            setReqId(data.request_id);
                        }
                    },
                    (error) => {
                        console.error('Failed to send OTP:', error);
                        const errorMsg = error?.message || error?.error || 'Failed to send OTP. Please try again.';
                        setErrors({ general: errorMsg });
                        setLoading(false);
                    }
                );
            } else {
                console.error('MSG91 sendOtp method not available');
                setErrors({ general: 'OTP service is initializing. Please wait and try again.' });
                setLoading(false);

                // Try to reinitialize
                if (window.initSendOTP && window.otpConfig) {
                    console.log('Attempting to reinitialize MSG91 widget...');
                    window.initSendOTP(window.otpConfig);
                    widgetInitialized.current = true;
                }
            }
        } catch (error) {
            console.error('Error in handleSendOTP:', error);
            setErrors({ general: 'An error occurred. Please try again.' });
            setLoading(false);
        }
    };

    const handleVerifyOTP = () => {
        setErrors({});

        if (!formData.otp || formData.otp.length !== 6) {
            setErrors({ otp: 'Please enter a valid 6-digit OTP' });
            return;
        }

        setLoading(true);

        try {
            const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
            const formattedPhone = cleanPhone.replace(/^91/, '');

            console.log('Verifying OTP:', formData.otp, 'for phone:', formattedPhone);

            if (window.verifyOtp) {
                window.verifyOtp(
                    formData.otp,
                    (data) => {
                        console.log('OTP verification success:', data);
                        if (data?.accessToken) {
                            handleOTPSuccess(data.accessToken);
                        } else {
                            setErrors({ general: 'Verification succeeded but no token received.' });
                            setLoading(false);
                        }
                    },
                    (error) => {
                        console.error('OTP verification failed:', error);
                        const errorMsg = error?.message || error?.error || 'Invalid OTP. Please try again.';
                        setErrors({ general: errorMsg });
                        setLoading(false);
                    },
                    reqId // Pass request ID if available
                );
            } else {
                console.error('MSG91 verifyOtp method not available');
                setErrors({ general: 'OTP service is not ready. Please refresh and try again.' });
                setLoading(false);
            }
        } catch (error) {
            console.error('Error in handleVerifyOTP:', error);
            setErrors({ general: 'An error occurred during verification.' });
            setLoading(false);
        }
    };

    const handleResendOTP = () => {
        if (window.retryOtp) {
            window.retryOtp(
                null, // Use default channel
                (data) => {
                    console.log('OTP resent:', data);
                    setSuccessMessage('OTP resent successfully!');
                    if (data?.request_id) {
                        setReqId(data.request_id);
                    }
                },
                (error) => {
                    console.error('Failed to resend OTP:', error);
                    setErrors({ general: 'Failed to resend OTP. Please try again.' });
                },
                reqId
            );
        } else {
            setErrors({ general: 'Unable to resend OTP. Please refresh the page.' });
        }
    };

    const handleGuestAppointment = () => {
        setShowGuestWarning(true);
    };

    const confirmGuestAppointment = () => {
        router.push('/appointment/guest');
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const resetForm = () => {
        setOtpSent(false);
        setFormData(prev => ({ ...prev, otp: '' }));
        setErrors({});
        setSuccessMessage('');
    };

    return (
        <>
            <Script
                src="https://verify.msg91.com/otp-provider.js"
                onLoad={() => {
                    console.log('MSG91 script loaded');
                    if (window.initSendOTP && window.otpConfig) {
                        console.log('Initializing MSG91 widget...');
                        window.initSendOTP(window.otpConfig);
                        widgetInitialized.current = true;
                        console.log('MSG91 widget initialized');

                        // Log available methods
                        console.log('Available MSG91 methods:', {
                            sendOtp: !!window.sendOtp,
                            verifyOtp: !!window.verifyOtp,
                            retryOtp: !!window.retryOtp,
                            getWidgetData: !!window.getWidgetData
                        });
                    } else {
                        console.error('MSG91 initialization requirements not met');
                    }
                }}
                onError={(e) => {
                    console.error('Failed to load MSG91 script:', e);
                    setErrors({ general: 'Failed to load OTP service. Please refresh the page.' });
                }}
            />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
                        <h1 className="text-2xl font-bold">Dr. Appointment System</h1>
                        <p className="text-sm mt-1 opacity-90">
                            {authMode === 'login' ? 'Welcome back!' : 'Create your account'}
                        </p>
                    </div>

                    <div className="p-6">
                        {/* Auth Mode Toggle */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => {
                                    setAuthMode('login');
                                    resetForm();
                                }}
                                className={`flex-1 py-2 rounded-lg font-semibold transition ${authMode === 'login'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                Login
                            </button>
                            <button
                                onClick={() => {
                                    setAuthMode('signup');
                                    resetForm();
                                }}
                                className={`flex-1 py-2 rounded-lg font-semibold transition ${authMode === 'signup'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                Sign Up
                            </button>
                        </div>

                        {/* Login Method Toggle (only for login mode) */}
                        {authMode === 'login' && (
                            <div className="flex gap-2 mb-6">
                                <button
                                    onClick={() => {
                                        setLoginMethod('otp');
                                        resetForm();
                                    }}
                                    className={`flex-1 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${loginMethod === 'otp'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <Phone size={16} />
                                    OTP Login
                                </button>
                                <button
                                    onClick={() => {
                                        setLoginMethod('password');
                                        resetForm();
                                    }}
                                    className={`flex-1 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${loginMethod === 'password'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <Lock size={16} />
                                    Password
                                </button>
                            </div>
                        )}

                        {/* Error Messages */}
                        {errors.general && (
                            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm">
                                {errors.general}
                            </div>
                        )}

                        {/* Success Messages */}
                        {successMessage && (
                            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4 text-sm">
                                {successMessage}
                            </div>
                        )}

                        {/* OTP Flow */}
                        {(loginMethod === 'otp' || authMode === 'signup') && !otpSent && (
                            <div>
                                {/* Full Name (Signup only) */}
                                {authMode === 'signup' && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Full Name *
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
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

                                {/* Phone Number */}
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Phone Number *
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="10-digit phone number"
                                            maxLength="10"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
                                </div>

                                {/* Remember Me (Login only) */}
                                {authMode === 'login' && (
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
                                )}

                                <button
                                    type="button"
                                    onClick={handleSendOTP}
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Sending...' : 'Send OTP'}
                                </button>
                            </div>
                        )}

                        {/* OTP Verification */}
                        {(loginMethod === 'otp' || authMode === 'signup') && otpSent && (
                            <div>
                                <p className="text-sm text-gray-600 mb-4">
                                    We've sent an OTP to your phone number ending in {formData.phone.slice(-4)}
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center text-lg font-semibold"
                                    />
                                    {errors.otp && <p className="text-red-600 text-xs mt-1">{errors.otp}</p>}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleVerifyOTP}
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                                >
                                    {loading ? 'Verifying...' : 'Verify OTP'}
                                </button>

                                <div className="flex justify-between text-sm">
                                    <button
                                        type="button"
                                        onClick={handleResendOTP}
                                        className="text-blue-600 hover:underline"
                                        disabled={loading}
                                    >
                                        Resend OTP
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="text-gray-600 hover:underline"
                                    >
                                        Change Number
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Password Login Form */}
                        {authMode === 'login' && loginMethod === 'password' && (
                            <form onSubmit={handlePasswordLogin}>
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Phone Number *
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="10-digit phone number"
                                            maxLength="10"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Password *
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="Enter your password"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
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
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {loading ? 'Logging in...' : 'Login'}
                                </button>
                            </form>
                        )}

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">OR</span>
                            </div>
                        </div>

                        {/* Skip Login Button */}
                        <button
                            onClick={handleGuestAppointment}
                            className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                        >
                            Continue as Guest (Book Appointment Only)
                        </button>
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
        </>
    );
}