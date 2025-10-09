'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Phone, Lock, Eye, EyeOff, User, Clock } from 'lucide-react';
import { api } from '@/lib/api';

export default function AuthPage({ initialMode = 'login' }) {
    const router = useRouter();
    const [authMode, setAuthMode] = useState(initialMode);
    const [loginMethod, setLoginMethod] = useState('phone');
    const [showPassword, setShowPassword] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        otp: ''
    });

    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setErrors({ ...errors, [name]: '' });
    };

    const validatePhone = (phone) => {
        const cleaned = phone.replace(/\s/g, '');
        return /^\d{10}$/.test(cleaned);
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSendOTP = async () => {
        setErrors({});
        setSuccessMessage('');

        if (!formData.phone || !validatePhone(formData.phone)) {
            setErrors({ phone: 'Please enter a valid 10-digit mobile number' });
            return;
        }

        if (authMode === 'signup' && !formData.fullName.trim()) {
            setErrors({ fullName: 'Full name is required' });
            return;
        }

        setLoading(true);

        try {
            const response = await api.sendOTP(formData.phone);
            setOtpSent(true);
            setResendTimer(30);
            setSuccessMessage('OTP sent successfully to +91' + formData.phone);

            if (process.env.NODE_ENV === 'development' && response.otp) {
                console.log('Development OTP:', response.otp);
            }
        } catch (error) {
            setErrors({ general: error.message || 'Failed to send OTP. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendTimer > 0) return;

        setLoading(true);
        setSuccessMessage('');

        try {
            await api.sendOTP(formData.phone);
            setResendTimer(30);
            setSuccessMessage('OTP resent successfully!');
        } catch (error) {
            setErrors({ general: error.message || 'Failed to resend OTP. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setSuccessMessage('');
        setLoading(true);

        try {
            if (loginMethod === 'email') {
                if (!formData.email || !validateEmail(formData.email)) {
                    setErrors({ email: 'Please enter a valid email address' });
                    setLoading(false);
                    return;
                }
                if (!formData.password || formData.password.length < 6) {
                    setErrors({ password: 'Password must be at least 6 characters' });
                    setLoading(false);
                    return;
                }

                if (authMode === 'login') {
                    await api.login({ email: formData.email, password: formData.password });
                } else {
                    await api.signup({
                        fullName: formData.fullName,
                        email: formData.email,
                        password: formData.password
                    });
                }
            } else {
                if (!formData.otp || formData.otp.length !== 6) {
                    setErrors({ otp: 'Please enter a valid 6-digit OTP' });
                    setLoading(false);
                    return;
                }

                await api.verifyOTP(formData.phone, formData.otp, formData.fullName);
            }

            setSuccessMessage(authMode === 'login' ? 'Login successful!' : 'Account created successfully!');

            setTimeout(() => {
                router.push('/dashboard');
            }, 1000);
        } catch (error) {
            setErrors({ general: error.message || 'Authentication failed. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
                    <h1 className="text-2xl font-bold">Dr. Anjali Gupta</h1>
                    <p className="text-sm opacity-90">Gynaecologist & Obstetrician</p>
                    <p className="text-xs opacity-75 mt-1">Patient Portal</p>
                </div>

                <div className="flex border-b">
                    <button
                        onClick={() => {
                            setAuthMode('login');
                            setErrors({});
                            setSuccessMessage('');
                        }}
                        className={`flex-1 py-3 font-semibold transition ${authMode === 'login'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500'
                            }`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => {
                            setAuthMode('signup');
                            setErrors({});
                            setSuccessMessage('');
                        }}
                        className={`flex-1 py-3 font-semibold transition ${authMode === 'signup'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500'
                            }`}
                    >
                        Sign Up
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {errors.general && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {errors.general}
                        </div>
                    )}

                    {successMessage && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                            {successMessage}
                        </div>
                    )}

                    {authMode === 'signup' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name *
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    placeholder="Enter your full name"
                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.fullName ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                />
                            </div>
                            {errors.fullName && (
                                <p className="text-red-600 text-xs mt-1">{errors.fullName}</p>
                            )}
                        </div>
                    )}

                    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => {
                                setLoginMethod('phone');
                                setOtpSent(false);
                                setErrors({});
                            }}
                            className={`flex-1 py-2 rounded-md font-medium transition ${loginMethod === 'phone'
                                    ? 'bg-white text-blue-600 shadow'
                                    : 'text-gray-600'
                                }`}
                        >
                            <Phone size={16} className="inline mr-2" />
                            Phone OTP
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setLoginMethod('email');
                                setOtpSent(false);
                                setErrors({});
                            }}
                            className={`flex-1 py-2 rounded-md font-medium transition ${loginMethod === 'email'
                                    ? 'bg-white text-blue-600 shadow'
                                    : 'text-gray-600'
                                }`}
                        >
                            <Mail size={16} className="inline mr-2" />
                            Email
                        </button>
                    </div>

                    {loginMethod === 'email' ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address *
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="your.email@example.com"
                                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-red-600 text-xs mt-1">{errors.email}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password *
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Enter your password"
                                        className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.password ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-gray-400"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-red-600 text-xs mt-1">{errors.password}</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number *
                                </label>
                                <div className="flex gap-2">
                                    <span className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg font-medium">
                                        +91
                                    </span>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="10-digit mobile number"
                                        maxLength="10"
                                        className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.phone ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        disabled={otpSent}
                                    />
                                </div>
                                {errors.phone && (
                                    <p className="text-red-600 text-xs mt-1">{errors.phone}</p>
                                )}
                            </div>

                            {!otpSent ? (
                                <button
                                    type="button"
                                    onClick={handleSendOTP}
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Sending...' : 'Send OTP'}
                                </button>
                            ) : (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Enter OTP *
                                        </label>
                                        {resendTimer > 0 ? (
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock size={14} />
                                                Resend in {resendTimer}s
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleResendOTP}
                                                disabled={loading}
                                                className="text-xs text-blue-600 font-medium hover:underline"
                                            >
                                                Resend OTP
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        name="otp"
                                        value={formData.otp}
                                        onChange={handleInputChange}
                                        placeholder="Enter 6-digit OTP"
                                        maxLength="6"
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest ${errors.otp ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                    />
                                    {errors.otp && (
                                        <p className="text-red-600 text-xs mt-1">{errors.otp}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-2">
                                        OTP sent to +91{formData.phone}
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {(loginMethod === 'email' || otpSent) && (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Processing...
                                </span>
                            ) : (
                                authMode === 'login' ? 'Login' : 'Sign Up'
                            )}
                        </button>
                    )}

                    {authMode === 'login' && loginMethod === 'email' && (
                        <div className="text-center">
                            <button
                                type="button"
                                className="text-sm text-blue-600 hover:underline"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    )}

                    <div className="text-center text-xs text-gray-500 pt-4">
                        <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
