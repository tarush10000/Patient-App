'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, User, Lock, AlertCircle, Key } from 'lucide-react';
import Script from 'next/script';

export default function AuthPage({ initialMode = 'login' }) {
    const router = useRouter();
    const [authMode, setAuthMode] = useState(initialMode);
    const [loginMethod, setLoginMethod] = useState('pin'); // Default to PIN login
    const [loading, setLoading] = useState(false);
    const [showGuestWarning, setShowGuestWarning] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [showPinSetup, setShowPinSetup] = useState(false);
    const [forgotPinMode, setForgotPinMode] = useState(false);
    const [accessToken, setAccessToken] = useState(null);
    const [reqId, setReqId] = useState(null);
    const widgetInitialized = useRef(false);
    const scriptLoaded = useRef(false);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        pin: '',
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
            pin: '',
            otp: '',
            rememberMe: false
        });
        setErrors({});
        setSuccessMessage('');
        setOtpSent(false);
        setShowPinSetup(false);
        setForgotPinMode(false);
        setAccessToken(null);
        setReqId(null);
    };

    const handleGuestAppointment = () => {
        setShowGuestWarning(true);
    };

    const confirmGuestAppointment = () => {
        router.push('/guest-appointment');
    };

    // PIN Login Handler
    const handlePinLogin = async () => {
        setErrors({});

        if (!formData.phone || formData.phone.length < 10) {
            setErrors({ phone: 'Please enter a valid 10-digit phone number' });
            return;
        }

        if (!formData.pin || formData.pin.length !== 6) {
            setErrors({ pin: 'PIN must be exactly 6 digits' });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/login-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: formData.phone,
                    pin: formData.pin,
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

    // OTP Success Handler for existing users (login via OTP)
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

            localStorage.setItem('authToken', data.token);
            setSuccessMessage(data.message || 'Authentication successful!');

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

    // Handle PIN Setup after OTP verification (for new signups)
    const handlePinSetup = async () => {
        if (formData.pin.length !== 6) {
            setErrors({ pin: 'PIN must be exactly 6 digits' });
            return;
        }

        if (!/^\d{6}$/.test(formData.pin)) {
            setErrors({ pin: 'PIN must contain only numbers' });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessToken,
                    fullName: formData.fullName,
                    pin: formData.pin,
                    rememberMe: formData.rememberMe
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Setup failed');
            }

            localStorage.setItem('authToken', data.token);
            setSuccessMessage('Account created successfully!');

            setTimeout(() => {
                router.push('/dashboard');
            }, 1000);

        } catch (error) {
            setErrors({ general: error.message });
        } finally {
            setLoading(false);
        }
    };

    // Handle Forgot PIN
    const handleForgotPinReset = async () => {
        if (formData.pin.length !== 6) {
            setErrors({ pin: 'PIN must be exactly 6 digits' });
            return;
        }

        if (!/^\d{6}$/.test(formData.pin)) {
            setErrors({ pin: 'PIN must contain only numbers' });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/forgot-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessToken,
                    newPin: formData.pin
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'PIN reset failed');
            }

            setSuccessMessage('PIN reset successfully! Please login with your new PIN.');

            setTimeout(() => {
                resetForm();
                setAuthMode('login');
                setLoginMethod('pin');
            }, 1500);

        } catch (error) {
            setErrors({ general: error.message });
        } finally {
            setLoading(false);
        }
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
            const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
            const formattedPhone = cleanPhone.replace(/^91/, '');

            console.log('Sending OTP to:', formattedPhone);

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

        if (!formData.otp || formData.otp.length !== 4) {
            setErrors({ otp: 'Please enter a valid 4-digit OTP' });
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
                        const token = data?.accessToken || data?.message;

                        if (token) {
                            if (authMode === 'signup') {
                                // New user - show PIN setup
                                setShowPinSetup(true);
                                setAccessToken(token);
                                setLoading(false);
                            } else if (forgotPinMode) {
                                // Forgot PIN flow - show PIN reset
                                setShowPinSetup(true);
                                setAccessToken(token);
                                setLoading(false);
                            } else {
                                // Existing user login via OTP
                                handleOTPSuccess(token);
                            }
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
                    reqId
                );
            } else {
                console.error('MSG91 verifyOtp method not available');
                setErrors({ general: 'OTP service is not ready. Please try again.' });
                setLoading(false);
            }
        } catch (error) {
            console.error('Error in handleVerifyOTP:', error);
            setErrors({ general: 'An error occurred. Please try again.' });
            setLoading(false);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined' && !scriptLoaded.current) {
            const script = document.createElement('script');
            script.src = 'https://control.msg91.com/app/assets/otp-provider/otp-provider.js';
            script.async = true;
            script.onload = () => {
                console.log('MSG91 script loaded');
                scriptLoaded.current = true;
            };
            document.body.appendChild(script);

            return () => {
                if (document.body.contains(script)) {
                    document.body.removeChild(script);
                }
            };
        }
    }, []);

    useEffect(() => {
        if (scriptLoaded.current && !widgetInitialized.current && typeof window !== 'undefined') {
            const config = {
                widgetId: process.env.MSG91_WIDGET_ID,
                tokenAuth: process.env.MSG91_AUTH_KEY,
                exposeMethods: true,
                success: (data) => {
                    console.log('Widget initialized successfully', data);
                },
                failure: (error) => {
                    console.error('Widget initialization failed', error);
                }
            };

            window.otpConfig = config;

            if (window.initSendOTP) {
                window.initSendOTP(config);
                widgetInitialized.current = true;
                console.log('MSG91 widget initialized');
            } else {
                console.log('Waiting for MSG91 to be available...');
                setTimeout(() => {
                    if (window.initSendOTP) {
                        window.initSendOTP(config);
                        widgetInitialized.current = true;
                        console.log('MSG91 widget initialized (delayed)');
                    }
                }, 1000);
            }
        }
    }, [scriptLoaded.current]);

    return (
        <>
            <Script
                id="msg91-config"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        window.otplessConfig = {
                            appId: "${process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || "346b6c6c6e6b667171303632"}",
                        };
                    `
                }}
            />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
                        <h1 className="text-2xl font-bold">Dr. Appointment System</h1>
                        <p className="text-sm mt-1 opacity-90">
                            {authMode === 'login'
                                ? (forgotPinMode ? 'Reset Your PIN' : 'Welcome back!')
                                : 'Create your account'}
                        </p>
                    </div>

                    <div className="p-6">
                        {!forgotPinMode && (
                            <div className="flex mb-6 border-b">
                                <button
                                    onClick={() => {
                                        setAuthMode('login');
                                        setLoginMethod('pin');
                                        resetForm();
                                    }}
                                    className={`flex-1 py-2 font-semibold transition ${authMode === 'login'
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-500'
                                        }`}
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => {
                                        setAuthMode('signup');
                                        setLoginMethod('otp');
                                        resetForm();
                                    }}
                                    className={`flex-1 py-2 font-semibold transition ${authMode === 'signup'
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-500'
                                        }`}
                                >
                                    Sign Up
                                </button>
                            </div>
                        )}

                        {authMode === 'login' && !forgotPinMode && (
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => {
                                        setLoginMethod('pin');
                                        resetForm();
                                    }}
                                    className={`flex-1 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${loginMethod === 'pin'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <Key size={16} />
                                    PIN Login
                                </button>
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
                            </div>
                        )}

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

                        {/* PIN Login Form */}
                        {authMode === 'login' && loginMethod === 'pin' && !otpSent && !showPinSetup && (
                            <div>
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

                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        6-Digit PIN *
                                    </label>
                                    <input
                                        type="password"
                                        name="pin"
                                        value={formData.pin}
                                        onChange={handleInputChange}
                                        placeholder="Enter your 6-digit PIN"
                                        maxLength="6"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center text-lg font-semibold tracking-widest"
                                    />
                                    {errors.pin && <p className="text-red-600 text-xs mt-1">{errors.pin}</p>}
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
                                    onClick={handlePinLogin}
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                                >
                                    {loading ? 'Logging in...' : 'Login'}
                                </button>

                                <button
                                    onClick={() => {
                                        setForgotPinMode(true);
                                        setLoginMethod('otp');
                                        resetForm();
                                    }}
                                    className="w-full text-blue-600 text-sm font-semibold hover:underline"
                                >
                                    Forgot PIN?
                                </button>
                            </div>
                        )}

                        {/* OTP Login/Signup Form - Send OTP */}
                        {((loginMethod === 'otp' && authMode === 'login') || authMode === 'signup' || forgotPinMode) && !otpSent && !showPinSetup && (
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

                                {forgotPinMode && (
                                    <button
                                        onClick={() => {
                                            setForgotPinMode(false);
                                            setAuthMode('login');
                                            setLoginMethod('pin');
                                            resetForm();
                                        }}
                                        className="w-full text-gray-600 text-sm font-semibold hover:underline mt-3"
                                    >
                                        Back to Login
                                    </button>
                                )}
                            </div>
                        )}

                        {/* OTP Verification */}
                        {((loginMethod === 'otp' && authMode === 'login') || authMode === 'signup' || forgotPinMode) && otpSent && !showPinSetup && (
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
                                        placeholder="Enter 4-digit OTP"
                                        maxLength="4"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center text-lg font-semibold tracking-widest"
                                    />
                                    {errors.otp && <p className="text-red-600 text-xs mt-1">{errors.otp}</p>}
                                </div>

                                <button
                                    onClick={handleVerifyOTP}
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                                >
                                    {loading ? 'Verifying...' : 'Verify OTP'}
                                </button>

                                <button
                                    onClick={handleSendOTP}
                                    disabled={loading}
                                    className="w-full text-blue-600 text-sm font-semibold hover:underline"
                                >
                                    Resend OTP
                                </button>
                            </div>
                        )}

                        {/* PIN Setup (After OTP Verification for Signup or Forgot PIN) */}
                        {showPinSetup && (
                            <div>
                                <p className="text-sm text-gray-600 mb-4">
                                    {forgotPinMode
                                        ? 'Enter a new 6-digit PIN for your account'
                                        : 'Set a 6-digit PIN for easy login'}
                                </p>

                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        {forgotPinMode ? 'New 6-Digit PIN *' : 'Create 6-Digit PIN *'}
                                    </label>
                                    <input
                                        type="password"
                                        name="pin"
                                        value={formData.pin}
                                        onChange={handleInputChange}
                                        placeholder="Enter 6-digit PIN"
                                        maxLength="6"
                                        pattern="\d{6}"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center text-lg font-semibold tracking-widest"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Use only numbers (0-9)</p>
                                    {errors.pin && <p className="text-red-600 text-xs mt-1">{errors.pin}</p>}
                                </div>

                                <button
                                    onClick={forgotPinMode ? handleForgotPinReset : handlePinSetup}
                                    disabled={loading || formData.pin.length !== 6}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (forgotPinMode ? 'Resetting...' : 'Setting up...') : (forgotPinMode ? 'Reset PIN' : 'Complete Setup')}
                                </button>
                            </div>
                        )}

                        {/* Guest Option - Only show on login, not during forgot PIN or signup */}
                        {!forgotPinMode && !showPinSetup && authMode === 'login' && (
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
        </>
    );
}