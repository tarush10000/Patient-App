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
        checkAuth();
        fetchUpcomingAppointment();
    }, []);

    const checkAuth = () => {
        const token = api.getToken();
        if (!token) {
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

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-4xl mx-auto p-4 pb-24">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Welcome Back!</h2>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Upcoming Appointment Card */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white shadow-lg">
                            <h3 className="font-bold text-lg mb-3">Upcoming Appointment</h3>
                            {upcomingAppointment ? (
                                <div>
                                    <p className="text-2xl font-bold">{formatDate(upcomingAppointment.appointmentDate)}</p>
                                    <p className="text-sm opacity-90 mt-1">{upcomingAppointment.timeSlot}</p>
                                    <p className="text-sm opacity-90 mt-1 capitalize">
                                        {upcomingAppointment.consultationType?.replace(/-/g, ' ')}
                                    </p>
                                </div>
                            ) : (
                                <p>No upcoming appointments</p>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => router.push('/dashboard/appointments')}
                                className="bg-blue-100 text-blue-800 p-6 rounded-xl font-semibold hover:bg-blue-200 transition flex flex-col items-center gap-2"
                            >
                                <Calendar size={32} />
                                Book Appointment
                            </button>
                            <button
                                onClick={() => router.push('/dashboard/billing')}
                                className="bg-green-100 text-green-800 p-6 rounded-xl font-semibold hover:bg-green-200 transition flex flex-col items-center gap-2"
                            >
                                <FileText size={32} />
                                View Bills
                            </button>
                        </div>

                        {/* Health Tip */}
                        <div className="bg-white rounded-xl p-6 shadow-md">
                            <h3 className="font-bold text-lg mb-2">Health Tip of the Day</h3>
                            <p className="text-gray-600">
                                Remember to stay hydrated! Drinking enough water is crucial for overall health and well-being.
                            </p>
                        </div>
                    </div>
                )}
            </main>

            <BottomNav activeScreen="home" />
        </div>
    );
}
