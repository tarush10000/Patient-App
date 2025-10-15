'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Trash2, CheckCircle, XCircle, Calendar as CalendarIcon } from 'lucide-react';
import Header from '@/components/Header';
import StaffBottomNav from '@/components/StaffBottomNav';
import { api } from '@/lib/api';

export default function StaffAppointmentsPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [consultationTypeFilter, setConsultationTypeFilter] = useState('all');
    const [selectedDate, setSelectedDate] = useState('');

    useEffect(() => {
        checkAuth();
        fetchAllAppointments();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [appointments, searchTerm, statusFilter, dateFilter, consultationTypeFilter, selectedDate]);

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

    const fetchAllAppointments = async () => {
        try {
            const response = await api.getAppointments();
            const sorted = (response.appointments || []).sort((a, b) =>
                new Date(b.appointmentDate) - new Date(a.appointmentDate)
            );
            setAppointments(sorted);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...appointments];

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(apt =>
                apt.fullName?.toLowerCase().includes(term) ||
                apt.phone?.includes(term)
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(apt => apt.status === statusFilter);
        }

        // Date filter
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        if (dateFilter === 'today') {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            filtered = filtered.filter(apt => {
                const aptDate = new Date(apt.appointmentDate);
                return aptDate >= now && aptDate < tomorrow;
            });
        } else if (dateFilter === 'upcoming') {
            filtered = filtered.filter(apt =>
                new Date(apt.appointmentDate) >= now
            );
        } else if (dateFilter === 'past') {
            filtered = filtered.filter(apt =>
                new Date(apt.appointmentDate) < now
            );
        } else if (dateFilter === 'custom' && selectedDate) {
            const selected = new Date(selectedDate);
            selected.setHours(0, 0, 0, 0);
            const nextDay = new Date(selected);
            nextDay.setDate(nextDay.getDate() + 1);

            filtered = filtered.filter(apt => {
                const aptDate = new Date(apt.appointmentDate);
                return aptDate >= selected && aptDate < nextDay;
            });
        }

        // Consultation type filter
        if (consultationTypeFilter !== 'all') {
            filtered = filtered.filter(apt =>
                apt.consultationType === consultationTypeFilter
            );
        }

        setFilteredAppointments(filtered);
    };

    const handleStatusUpdate = async (appointmentId, newStatus) => {
        try {
            await api.updateAppointment(appointmentId, { status: newStatus });
            fetchAllAppointments();
        } catch (error) {
            alert('Failed to update appointment: ' + error.message);
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
            fetchAllAppointments();
        } catch (error) {
            alert('Failed to delete appointment: ' + error.message);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setDateFilter('all');
        setConsultationTypeFilter('all');
        setSelectedDate('');
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
                    <h2 className="text-2xl font-bold text-gray-800">All Appointments</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                            {filteredAppointments.length} of {appointments.length}
                        </span>
                        <button
                            onClick={resetFilters}
                            className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white rounded-xl shadow-md p-4 mb-6 space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Filter Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Statuses</option>
                                <option value="upcoming">Upcoming</option>
                                <option value="seen">Seen</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        {/* Date Filter */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Dates</option>
                                <option value="today">Today</option>
                                <option value="upcoming">Upcoming</option>
                                <option value="past">Past</option>
                                <option value="custom">Custom Date</option>
                            </select>
                        </div>

                        {/* Consultation Type Filter */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                            <select
                                value={consultationTypeFilter}
                                onChange={(e) => setConsultationTypeFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Types</option>
                                <option value="in-person">In-Person</option>
                                <option value="online">Online</option>
                                <option value="emergency">Emergency</option>
                            </select>
                        </div>
                    </div>

                    {/* Custom Date Picker */}
                    {dateFilter === 'custom' && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Date</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    )}
                </div>

                {/* Appointments List */}
                <div className="space-y-4">
                    {filteredAppointments.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-md p-12 text-center">
                            <CalendarIcon className="mx-auto text-gray-300 mb-4" size={48} />
                            <p className="text-gray-500 text-lg">No appointments found</p>
                            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
                        </div>
                    ) : (
                        filteredAppointments.map((apt) => (
                            <div
                                key={apt._id}
                                className={`bg-white rounded-xl shadow-md p-5 border-l-4 ${apt.status === 'seen'
                                        ? 'border-green-500'
                                        : apt.status === 'cancelled'
                                            ? 'border-gray-400'
                                            : 'border-blue-500'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="font-bold text-xl">{apt.fullName}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${apt.status === 'seen'
                                                    ? 'bg-green-100 text-green-700'
                                                    : apt.status === 'cancelled'
                                                        ? 'bg-gray-100 text-gray-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {apt.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                            <p>📞 {apt.phone}</p>
                                            <p>📅 {formatDate(apt.appointmentDate)}</p>
                                            <p>🕒 {apt.timeSlot}</p>
                                            <p className="capitalize">📋 {apt.consultationType?.replace(/-/g, ' ')}</p>
                                        </div>

                                        {apt.additionalMessage && (
                                            <p className="text-sm text-gray-500 mt-3 italic bg-gray-50 p-2 rounded">
                                                💬 "{apt.additionalMessage}"
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2 ml-4">
                                        {apt.status === 'upcoming' && (
                                            <>
                                                <button
                                                    onClick={() => handleStatusUpdate(apt._id, 'seen')}
                                                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                                                    title="Mark as Seen"
                                                >
                                                    <CheckCircle size={18} />
                                                    <span className="text-sm">Seen</span>
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(apt._id, 'cancelled')}
                                                    className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
                                                    title="Cancel"
                                                >
                                                    <XCircle size={18} />
                                                    <span className="text-sm">Cancel</span>
                                                </button>
                                            </>
                                        )}

                                        {currentUser?.role === 'admin' && (
                                            <button
                                                onClick={() => handleDeleteAppointment(apt._id)}
                                                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                                                title="Delete (Admin Only)"
                                            >
                                                <Trash2 size={18} />
                                                <span className="text-sm">Delete</span>
                                            </button>
                                        )}

                                        {currentUser?.role === 'reception' && apt.status !== 'upcoming' && (
                                            <div className="text-xs text-gray-400 text-center mt-2">
                                                {apt.status === 'seen' ? 'Completed' : 'Cancelled'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            <StaffBottomNav activeScreen="all-appointments" userRole={currentUser?.role} />
        </div>
    );
}