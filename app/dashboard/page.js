'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, FileText, User as UserIcon } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { api } from '@/lib/api';

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [upcomingAppointment, setUpcomingAppointment] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuthAndRedirect();
    }, []);

    const checkAuthAndRedirect = async () => {
        const token = api.getToken();
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            // Decode token to get user role
            const payload = JSON.parse(atob(token.split('.')[1]));

            // Redirect based on role
            if (payload.role === 'admin' || payload.role === 'reception') {
                router.push('/dashboard/staff');
            } else {
                // Patient dashboard - fetch their data
                await fetchUpcomingAppointment();
            }
        } catch (error) {
            console.error('Error checking auth:', error);
            router.push('/login');
        }
    };

    const fetchUpcomingAppointment = async () => {
        try {
            const response = await api.getAppointments();
            const now = new Date();
            const upcoming = response.appointments
                ?.filter(apt => new Date(apt.appointmentDate) >= now && apt.status === 'upcoming')
                .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))[0];

            setUpcomingAppointment(upcoming);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-[#173456]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Header />

            <main className="max-w-4xl mx-auto p-4 md:p-6 pb-28">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#173456]">Welcome Back</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Manage your consultations and health records</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-xs font-semibold text-[#0e8a7d]">
                        <span className="w-2 h-2 rounded-full bg-[#0e8a7d]"></span>
                        Patient Portal
                    </span>
                </div>

                <div className="space-y-5">
                    {/* Upcoming Appointment Card */}
                    <div className="bg-[#173456] rounded-2xl p-6 text-white shadow-[0_4px_20px_rgba(23,52,86,0.12)] border border-slate-700/30 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0e8a7d]/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-semibold uppercase tracking-wider text-[#169888] bg-white/10 px-2.5 py-1 rounded-md">
                                    Upcoming Consultation
                                </span>
                                {upcomingAppointment && (
                                    <span className="text-xs text-slate-300 font-medium">
                                        Confirmed
                                    </span>
                                )}
                            </div>
                            
                            {upcomingAppointment ? (
                                <div className="space-y-2">
                                    <p className="text-2xl font-bold tracking-tight text-white">{formatDate(upcomingAppointment.appointmentDate)}</p>
                                    <div className="flex items-center gap-2 text-sm text-slate-200">
                                        <Calendar size={16} className="text-[#169888]" />
                                        <span>{upcomingAppointment.timeSlot}</span>
                                    </div>
                                    <p className="text-xs text-slate-300 capitalize pt-1">
                                        {upcomingAppointment.consultationType?.replace(/-/g, ' ')}
                                    </p>
                                </div>
                            ) : (
                                <div className="py-2">
                                    <p className="text-base text-slate-200 font-medium">No upcoming appointments scheduled</p>
                                    <p className="text-xs text-slate-400 mt-1">Book your visit anytime using the button below</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => router.push('/dashboard/appointments')}
                            className="bg-white border border-slate-200 p-5 rounded-xl font-semibold hover:border-[#173456]/40 hover:shadow-sm transition flex flex-col items-center gap-3 text-left group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-[#f0f4f9] text-[#173456] flex items-center justify-center group-hover:bg-[#173456] group-hover:text-white transition">
                                <Calendar size={24} />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-slate-900">Book Visit</p>
                                <p className="text-xs text-slate-500 font-normal">Schedule appointment</p>
                            </div>
                        </button>
                        <button
                            onClick={() => router.push('/dashboard/billing')}
                            className="bg-white border border-slate-200 p-5 rounded-xl font-semibold hover:border-[#0e8a7d]/40 hover:shadow-sm transition flex flex-col items-center gap-3 text-left group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#0e8a7d] flex items-center justify-center group-hover:bg-[#0e8a7d] group-hover:text-white transition">
                                <FileText size={24} />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-slate-900">View Invoices</p>
                                <p className="text-xs text-slate-500 font-normal">Past consultation bills</p>
                            </div>
                        </button>
                    </div>

                    {/* Health Tip */}
                    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-1.5 h-4 bg-[#0e8a7d] rounded-full"></span>
                            <h3 className="font-bold text-sm text-[#173456]">Clinical Health Tip</h3>
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed">
                            Consistent hydration supports hormonal balance, reproductive wellness, and cellular recovery. Remember to drink adequate water throughout the day.
                        </p>
                    </div>
                </div>
            </main>

            <BottomNav activeScreen="home" />
        </div>
    );
}