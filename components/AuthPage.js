'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Mail, Lock, User as UserIcon } from 'lucide-react';
import { api } from '@/lib/api';

export default function AuthPage() {
    const router = useRouter();
    const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
    const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' or 'email'
    const [step, setStep] = useState('input'); // 'input' or 'otp'
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        otp: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [resendTimer, setResendTimer] = useState(0);

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validatePhone = (phone) => {
        return /^[0-9]{10}$/.test(phone);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors({});
        setSuccessMessage('');
    };

    const handleSendOTP = async () => {
        if (!formData.phone || !validatePhone(formData.phone)) {
            setErrors({ phone: 'Please enter a valid 10-digit phone number' });
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            await api.sendOTP(formData.phone);
            setStep('otp');
            setResendTimer(30);
            setSuccessMessage('OTP sent successfully to your phone!');
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

    const handleVerifyOTP = async (e) => {
        e.preventDefault();

        if (!formData.otp || formData.otp.length !== 6) {
            setErrors({ otp: 'Please enter a valid 6-digit OTP' });
            return;
        }

        if (authMode === 'signup' && !formData.fullName.trim()) {
            setErrors({ fullName: 'Please enter your full name' });
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            await api.verifyOTP(formData.phone, formData.otp, formData.fullName);
            setSuccessMessage(authMode === 'login' ? 'Login successful!' : 'Account created successfully!');

            setTimeout(() => {
                router.push('/dashboard');
            }, 1000);
        } catch (error) {
            setErrors({ general: error.message || 'OTP verification failed. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleEmailPasswordAuth = async (e) => {
        e.preventDefault();
        setErrors({});
        setSuccessMessage('');
        setLoading(true);

        try {
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
                if (!formData.fullName.trim()) {
                    setErrors({ fullName: 'Please enter your full name' });
                    setLoading(false);
                    return;
                }
                await api.signup({
                    fullName: formData.fullName,
                    email: formData.email,
                    password: formData.password
                });
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

    const switchAuthMode = () => {
        setAuthMode(authMode === 'login' ? 'signup' : 'login');
        setStep('input');
        setFormData({
            fullName: '',
            email: '',
            phone: '',
            password: '',
            otp: ''
        });
        setErrors({});
        setSuccessMessage('');
    };

    const switchLoginMethod = (method) => {
        setLoginMethod(method);
        setStep('input');
        setFormData({
            fullName: formData.fullName,
            email: '',
            phone: '',
            password: '',
            otp: ''
        });
        setErrors({});
        setSuccessMessage('');
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
                    {/* Auth Mode Toggle */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => authMode === 'signup' && switchAuthMode()}
                            className={`flex-1 py-2 rounded-lg font-semibold transition ${authMode === 'login'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => authMode === 'login' && switchAuthMode()}
                            className={`flex-1 py-2 rounded-lg font-semibold transition ${authMode === 'signup'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Login Method Toggle */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => switchLoginMethod('phone')}
                            className={`flex-1 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${loginMethod === 'phone'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <Phone size={16} />
                            Phone (OTP)
                        </button>
                        <button
                            onClick={() => switchLoginMethod('email')}
                            className={`flex-1 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${loginMethod === 'email'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <Mail size={16} />
                            Email
                        </button>
                    </div>

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

                    {/* Phone OTP Flow */}
                    {loginMethod === 'phone' && (
                        <>
                            {step === 'input' ? (
                                <div className="space-y-4">
                                    {authMode === 'signup' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Full Name *
                                            </label>
                                            <div className="relative">
                                                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="text"
                                                    name="fullName"
                                                    value={formData.fullName}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter your full name"
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 bg-white"
                                                />
                                            </div>
                                            {errors.fullName && <p className="text-red-600 text-xs mt-1">{errors.fullName}</p>}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Mobile Number *
                                        </label>
                                        <div className="flex gap-2">
                                            <span className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 font-semibold">
                                                +91
                                            </span>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder="10-digit mobile number"
                                                pattern="[0-9]{10}"
                                                maxLength="10"
                                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 bg-white"
                                            />
                                        </div>
                                        {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
                                    </div>

                                    <button
                                        onClick={handleSendOTP}
                                        disabled={loading}
                                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Sending OTP...' : 'Send OTP'}
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleVerifyOTP} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Enter OTP *
                                        </label>
                                        <input
                                            type="text"
                                            name="otp"
                                            value={formData.otp}
                                            onChange={handleInputChange}
                                            placeholder="6-digit OTP"
                                            pattern="[0-9]{6}"
                                            maxLength="6"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-bold text-gray-800 bg-white"
                                        />
                                        {errors.otp && <p className="text-red-600 text-xs mt-1">{errors.otp}</p>}
                                        <p className="text-xs text-gray-600 mt-2">
                                            OTP sent to +91 {formData.phone}
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Verifying...' : 'Verify OTP'}
                                    </button>

                                    <div className="flex justify-between items-center">
                                        <button
                                            type="button"
                                            onClick={() => setStep('input')}
                                            className="text-sm text-blue-600 hover:underline"
                                        >
                                            Change Number
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleResendOTP}
                                            disabled={resendTimer > 0}
                                            className="text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                                        >
                                            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </>
                    )}

                    {/* Email/Password Flow */}
                    {loginMethod === 'email' && (
                        <form onSubmit={handleEmailPasswordAuth} className="space-y-4">
                            {authMode === 'signup' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Full Name *
                                    </label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            placeholder="Enter your full name"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 bg-white"
                                        />
                                    </div>
                                    {errors.fullName && <p className="text-red-600 text-xs mt-1">{errors.fullName}</p>}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email Address *
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="your.email@example.com"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 bg-white"
                                    />
                                </div>
                                {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                            </div>

                            <div>
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
                                        placeholder="Minimum 6 characters"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 bg-white"
                                    />
                                </div>
                                {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Please wait...' : (authMode === 'login' ? 'Login' : 'Sign Up')}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}