'use client';

import { AlertCircle, Phone, User } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function AuthPage({ initialMode = 'login' }) {
    const router = useRouter();
    const [authMode, setAuthMode] = useState(initialMode);
    const [loading, setLoading] = useState(false);
    const [showGuestWarning, setShowGuestWarning] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [sdkReady, setSdkReady] = useState(false);
    const verificationInFlight = useRef(false);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        otp: '',
        rememberMe: false
    });

    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');

    const formDataRef = useRef(formData);
    const authModeRef = useRef(authMode);

    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    useEffect(() => {
        authModeRef.current = authMode;
    }, [authMode]);

    // Check existing auth session
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
                } catch {
                    localStorage.removeItem('authToken');
                    deleteCookie('authToken');
                }
            }
        };

        checkExistingAuth();
    }, [router]);

    // Handle verification completion (server-side verifyAccessToken)
    const handleVerificationSuccess = async (data) => {
        if (verificationInFlight.current) return;
        verificationInFlight.current = true;
        console.log('[MSG91 OTP] Success response:', data);
        const accessToken = typeof data === 'string'
            ? data
            : (data?.['access-token'] || data?.accessToken || data?.message || data?.token);

        try {
            const currentForm = formDataRef.current;
            const currentMode = authModeRef.current;
            const cleanPhone = currentForm.phone.replace(/\D/g, '').slice(-10);

            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: cleanPhone,
                    accessToken: accessToken,
                    fullName: currentMode === 'signup' ? currentForm.fullName.trim() : undefined,
                    rememberMe: currentForm.rememberMe
                })
            });

            const resData = await res.json();
            if (!res.ok) {
                setErrors({ general: resData.error || 'Verification failed on server' });
                setLoading(false);
                verificationInFlight.current = false;
                return;
            }

            localStorage.setItem('authToken', resData.token);
            setSuccessMessage(resData.message || 'Authentication successful!');
            setTimeout(() => {
                router.push('/dashboard');
            }, 1000);
        } catch (err) {
            console.error('[MSG91 OTP] Verification error:', err);
            setErrors({ general: err.message || 'Error processing login' });
            setLoading(false);
            verificationInFlight.current = false;
        }
    };

    // Load and initialize MSG91 Widget as specified
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || "356a736b3462383434333432";
        const tokenAuth = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH || "473564TLvKEjfX68f4ec68P1";

        window.configuration = {
            widgetId: widgetId,
            tokenAuth: tokenAuth,
            exposeMethods: true,
            success: (data) => {
                console.log('success response', data);
                handleVerificationSuccess(data);
            },
            failure: (error) => {
                console.log('failure reason', error);
                const errMsg = typeof error === 'string' ? error : (error?.message || error?.description || 'OTP operation failed');
                setErrors({ general: errMsg });
                setLoading(false);
            }
        };

        const initScript = () => {
            if (typeof window.initSendOTP === 'function') {
                try {
                    window.initSendOTP(window.configuration);
                    setSdkReady(true);
                } catch (e) {
                    console.error('initSendOTP error:', e);
                }
            }
        };

        if (typeof window.initSendOTP === 'function') {
            initScript();
        } else {
            (function loadOtpScript(urls) {
                let i = 0;
                function attempt() {
                    const existing = document.querySelector(`script[src="${urls[i]}"]`);
                    if (existing) {
                        initScript();
                        return;
                    }
                    const s = document.createElement('script');
                    s.src = urls[i];
                    s.async = true;
                    s.onload = () => {
                        initScript();
                    };
                    s.onerror = () => {
                        i++;
                        if (i < urls.length) {
                            attempt();
                        }
                    };
                    document.head.appendChild(s);
                }
                attempt();
            })([
                'https://verify.msg91.com/otp-provider.js',
                'https://verify.phone91.com/otp-provider.js'
            ]);
        }
    }, []);

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

    const handleGuestAppointment = () => setShowGuestWarning(true);
    const confirmGuestAppointment = () => router.push('/appointments/guest');

    // Send OTP using window.sendOtp
    const handleSendOTP = async () => {
        setErrors({});
        setSuccessMessage('');

        const cleanPhone = formData.phone.replace(/\D/g, '');
        if (!cleanPhone || cleanPhone.length < 10) {
            setErrors({ phone: 'Please enter a valid 10-digit phone number' });
            return;
        }

        if (authMode === 'signup' && !formData.fullName.trim()) {
            setErrors({ fullName: 'Please enter your name' });
            return;
        }

        setLoading(true);

        const identifier = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

        const attemptSend = (retries = 30) => {
            if (typeof window !== 'undefined' && typeof window.sendOtp === 'function') {
                window.sendOtp(
                    identifier,
                    (data) => {
                        console.log('sendOtp success:', data);
                        setOtpSent(true);
                        setSuccessMessage('OTP sent successfully!');
                        setLoading(false);
                    },
                    (error) => {
                        console.error('sendOtp error:', error);
                        const errMsg = typeof error === 'string' ? error : (error?.message || error?.description || 'Failed to send OTP');
                        setErrors({ general: errMsg });
                        setLoading(false);
                    }
                );
            } else if (retries > 0) {
                setTimeout(() => attemptSend(retries - 1), 150);
            } else {
                setLoading(false);
                setErrors({ general: 'OTP service is initializing. Please try again in a few seconds.' });
            }
        };

        attemptSend();
    };

    // Verify OTP using window.verifyOtp
    const handleVerifyOTP = async () => {
        setErrors({});

        if (!formData.otp || formData.otp.length < 4) {
            setErrors({ otp: 'Please enter a valid OTP' });
            return;
        }

        if (authMode === 'signup' && !formData.fullName.trim()) {
            setErrors({ fullName: 'Please enter your name' });
            return;
        }

        setLoading(true);

        if (typeof window !== 'undefined' && typeof window.verifyOtp === 'function') {
            window.verifyOtp(
                formData.otp,
                (data) => {
                    console.log('verifyOtp success callback:', data);
                    // MSG91 also invokes configuration.success; that callback owns server verification.
                },
                (error) => {
                    console.error('verifyOtp error:', error);
                    const errMsg = typeof error === 'string' ? error : (error?.message || error?.description || 'Invalid OTP');
                    setErrors({ general: errMsg });
                    setLoading(false);
                }
            );
        } else {
            setLoading(false);
            setErrors({ general: 'OTP verification method not ready. Please refresh and try again.' });
        }
    };

    // Resend OTP using window.retryOtp
    const handleResendOTP = async () => {
        setLoading(true);
        setErrors({});

        if (typeof window !== 'undefined' && typeof window.retryOtp === 'function') {
            window.retryOtp(
                '11', // Retry via SMS
                (data) => {
                    setSuccessMessage('OTP resent successfully!');
                    setLoading(false);
                },
                (error) => {
                    const errMsg = typeof error === 'string' ? error : (error?.message || error?.description || 'Failed to resend OTP');
                    setErrors({ general: errMsg });
                    setLoading(false);
                }
            );
        } else {
            handleSendOTP();
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(23,52,86,0.08)] border border-slate-200/80 w-full max-w-md overflow-hidden">
                <div className="bg-[#173456] p-7 text-white text-center border-b border-slate-800">
                    <div className="flex justify-center mb-3.5">
                        <div className="p-1 rounded-full bg-white ring-4 ring-[#0e8a7d]/20 shadow-md">
                            <Image
                                src="/logo.png"
                                alt="Dr. Anjali Women Wellness Center Logo"
                                width={88}
                                height={88}
                                className="rounded-full object-cover"
                                priority
                            />
                        </div>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-white">Dr. Anjali Gupta</h1>
                    <p className="text-xs text-[#169888] font-medium tracking-wide uppercase mt-0.5">
                        Women Wellness Center
                    </p>
                    <p className="text-xs text-slate-300 mt-2 font-normal">
                        {authMode === 'login' ? 'Sign in to access your consultations' : 'Create your patient account'}
                    </p>
                </div>

                <div className="p-6">
                    <div className="flex mb-6 bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => { setAuthMode('login'); resetForm(); }}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${authMode === 'login'
                                ? 'bg-white text-[#173456] shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                                }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => { setAuthMode('signup'); resetForm(); }}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${authMode === 'signup'
                                ? 'bg-white text-[#173456] shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {errors.general && (
                        <div className="bg-rose-50 border border-rose-200 text-[#d3455b] px-4 py-3 rounded-lg mb-4 text-sm font-medium">
                            {errors.general}
                        </div>
                    )}

                    {successMessage && (
                        <div className="bg-emerald-50 border border-emerald-200 text-[#0e8a7d] px-4 py-3 rounded-lg mb-4 text-sm font-medium">
                            {successMessage}
                        </div>
                    )}

                    {!otpSent ? (
                        <div>
                            {authMode === 'signup' && (
                                <div className="mb-4">
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Full Name *
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            placeholder="Enter your full name"
                                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173456] focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm bg-slate-50/50"
                                        />
                                    </div>
                                    {errors.fullName && <p className="text-[#d3455b] text-xs mt-1">{errors.fullName}</p>}
                                </div>
                            )}

                            <div className="mb-5">
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Mobile Number *
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="10-digit mobile number"
                                        maxLength="10"
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173456] focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm bg-slate-50/50"
                                    />
                                </div>
                                {errors.phone && <p className="text-[#d3455b] text-xs mt-1">{errors.phone}</p>}
                            </div>

                            <button
                                onClick={handleSendOTP}
                                disabled={loading}
                                className="w-full bg-[#173456] text-white py-2.5 rounded-lg font-semibold hover:bg-[#10263f] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
                            >
                                {loading ? 'Sending Verification Code...' : 'Send OTP'}
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                                OTP sent to <span className="font-semibold text-slate-900">+91 {formData.phone}</span>.{' '}
                                <button
                                    onClick={() => setOtpSent(false)}
                                    className="text-[#0e8a7d] hover:underline font-semibold ml-1"
                                >
                                    Change number
                                </button>
                            </p>

                            <div className="mb-4">
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Enter 4-Digit OTP *
                                </label>
                                <input
                                    type="text"
                                    name="otp"
                                    value={formData.otp}
                                    onChange={handleInputChange}
                                    placeholder="• • • •"
                                    maxLength="4"
                                    inputMode="numeric"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173456] focus:border-transparent text-center text-lg font-semibold tracking-widest text-slate-800 bg-slate-50/50"
                                />
                                {errors.otp && <p className="text-[#d3455b] text-xs mt-1">{errors.otp}</p>}
                            </div>

                            <div className="mb-4 flex items-center">
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    id="rememberMeCheckbox"
                                    checked={formData.rememberMe}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 text-[#173456] rounded border-slate-300 focus:ring-[#173456]"
                                />
                                <label htmlFor="rememberMeCheckbox" className="ml-2 text-xs text-slate-600 cursor-pointer">
                                    Remember me on this device
                                </label>
                            </div>

                            <button
                                onClick={handleVerifyOTP}
                                disabled={loading}
                                className="w-full bg-[#173456] text-white py-2.5 rounded-lg font-semibold hover:bg-[#10263f] transition disabled:opacity-50 disabled:cursor-not-allowed mb-2.5 shadow-sm text-sm"
                            >
                                {loading ? 'Verifying Code...' : 'Verify & Continue'}
                            </button>

                            <button
                                onClick={handleResendOTP}
                                disabled={loading}
                                className="w-full text-[#0e8a7d] py-1.5 text-xs font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Resend OTP
                            </button>
                        </div>
                    )}

                    <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                        <button
                            onClick={handleGuestAppointment}
                            className="text-xs font-medium text-slate-500 hover:text-[#173456] transition"
                        >
                            Quick Booking as Guest (Without Login) &rarr;
                        </button>
                    </div>
                </div>
            </div>

            {showGuestWarning && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-4 text-[#d3455b]">
                            <AlertCircle size={22} />
                            <h3 className="font-bold text-base text-slate-900">Guest Appointment Notice</h3>
                        </div>
                        <p className="text-slate-600 text-sm mb-5 leading-relaxed">
                            As a guest, you won&apos;t be able to view your prior appointment records or download invoices in your patient portal. We recommend creating an account for seamless follow-ups.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowGuestWarning(false)}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium transition"
                            >
                                Back
                            </button>
                            <button
                                onClick={confirmGuestAppointment}
                                className="flex-1 px-4 py-2 bg-[#173456] text-white rounded-lg hover:bg-[#10263f] text-sm font-semibold transition shadow-sm"
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
