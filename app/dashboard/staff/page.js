'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, Clock, Ban, Trash2, CheckCircle, XCircle } from 'lucide-react';
import Header from '@/components/Header';
import StaffBottomNav from '@/components/StaffBottomNav';
import { api } from '@/lib/api';

export default function StaffDashboardPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(null);
    const [todayAppointments, setTodayAppointments] = useState([]);
    const [stats, setStats] = useState({
        todayTotal: 0,
        todayCompleted: 0,
        todayPending: 0,
        totalPatients: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
        fetchDashboardData();
    }, []);

    const checkAuth = () => {
        const token = api.getToken();
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.role !== 'admin' && payload.role !== 'reception') {
                router.push('/dashboard');
                return;
            }
            setCurrentUser(payload);
        } catch (error) {
            console.error('Error checking auth:', error);
            router.push('/login');
        }
    };

    const fetchDashboardData = async () => {
        try {
            const [appointmentsRes, usersRes] = await Promise.all([
                api.getAppointments(),
                api.getUsers()
            ]);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const todayApts = appointmentsRes.appointments?.filter(apt => {
                const aptDate = new Date(apt.appointmentDate);
                return aptDate >= today && aptDate < tomorrow;
            }) || [];

            setTodayAppointments(todayApts.sort((a, b) => {
                const timeA = a.timeSlot.split(' - ')[0];
                const timeB = b.timeSlot.split(' - ')[0];
                return timeA.localeCompare(timeB);
            }));

            const totalPatients = usersRes.users?.filter(u => u.role === 'patient').length || 0;

            setStats({
                todayTotal: todayApts.length,
                todayCompleted: todayApts.filter(apt => apt.status === 'seen').length,
                todayPending: todayApts.filter(apt => apt.status === 'upcoming').length,
                totalPatients
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (appointmentId, newStatus) => {
        try {
            await api.updateAppointment(appointmentId, { status: newStatus });
            fetchDashboardData();
        } catch (error) {
            alert('Failed to update appointment status: ' + error.message);
        }
    };

    const handleDeleteAppointment = async (appointmentId) => {
        if (!currentUser || currentUser.role !== 'admin') {
            alert('Only admins can delete appointments');
            return;
        }

        if (!confirm('Are you sure you want to delete this appointment?')) {
            return;
        }

        try {
            await api.deleteAppointment(appointmentId);
            fetchDashboardData();
        } catch (error) {
            alert('Failed to delete appointment: ' + error.message);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-6xl mx-auto p-4 pb-24">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {currentUser?.role === 'admin' ? 'Admin' : 'Reception'} Dashboard
                    </h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${currentUser?.role === 'admin'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                        {currentUser?.role}
                    </span>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-md">
                        <Calendar className="text-blue-600 mb-2" size={24} />
                        <p className="text-2xl font-bold">{stats.todayTotal}</p>
                        <p className="text-sm text-gray-600">Today's Appointments</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-md">
                        <CheckCircle className="text-green-600 mb-2" size={24} />
                        <p className="text-2xl font-bold">{stats.todayCompleted}</p>
                        <p className="text-sm text-gray-600">Completed</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-md">
                        <Clock className="text-orange-600 mb-2" size={24} />
                        <p className="text-2xl font-bold">{stats.todayPending}</p>
                        <p className="text-sm text-gray-600">Pending</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-md">
                        <Users className="text-purple-600 mb-2" size={24} />
                        <p className="text-2xl font-bold">{stats.totalPatients}</p>
                        <p className="text-sm text-gray-600">Total Patients</p>
                    </div>
                </div>

                {/* Today's Appointments */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-xl font-bold mb-4">Today's Appointments</h3>

                    {todayAppointments.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No appointments scheduled for today</p>
                    ) : (
                        <div className="space-y-3">
                            {todayAppointments.map((apt) => (
                                <div
                                    key={apt._id}
                                    className={`p-4 rounded-lg border-2 ${apt.status === 'seen'
                                            ? 'bg-green-50 border-green-200'
                                            : apt.status === 'cancelled'
                                                ? 'bg-gray-50 border-gray-200'
                                                : 'bg-blue-50 border-blue-200'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="font-bold text-lg">{apt.fullName}</h4>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${apt.status === 'seen'
                                                        ? 'bg-green-100 text-green-700'
                                                        : apt.status === 'cancelled'
                                                            ? 'bg-gray-100 text-gray-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {apt.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">📞 {apt.phone}</p>
                                            <p className="text-sm text-gray-600">🕒 {apt.timeSlot}</p>
                                            <p className="text-sm text-gray-600 capitalize">
                                                📋 {apt.consultationType?.replace(/-/g, ' ')}
                                            </p>
                                            {apt.additionalMessage && (
                                                <p className="text-sm text-gray-500 mt-1 italic">
                                                    "{apt.additionalMessage}"
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            {apt.status === 'upcoming' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(apt._id, 'seen')}
                                                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                                        title="Mark as Seen"
                                                    >
                                                        <CheckCircle size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(apt._id, 'cancelled')}
                                                        className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                                                        title="Cancel"
                                                    >
                                                        <XCircle size={20} />
                                                    </button>
                                                </>
                                            )}

                                            {currentUser?.role === 'admin' && (
                                                <button
                                                    onClick={() => handleDeleteAppointment(apt._id)}
                                                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                                    title="Delete (Admin Only)"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <StaffBottomNav activeScreen="home" userRole={currentUser?.role} />
        </div>
    );
}