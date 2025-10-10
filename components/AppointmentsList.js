'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, FileText, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function AppointmentsList({ userRole = 'patient' }) {
    const [appointments, setAppointments] = useState([]);
    const [filter, setFilter] = useState('upcoming');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const response = await api.getAppointments();
            setAppointments(response.appointments || []);
        } catch (err) {
            setError('Failed to fetch appointments');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelAppointment = async (id) => {
        if (!confirm('Are you sure you want to cancel this appointment?')) return;

        try {
            await api.cancelAppointment(id);
            fetchAppointments();
        } catch (err) {
            alert('Failed to cancel appointment');
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.updateAppointment(id, { status });
            fetchAppointments();
        } catch (err) {
            alert('Failed to update appointment');
        }
    };

    const filteredAppointments = appointments.filter((apt) => {
        const aptDate = new Date(apt.appointmentDate);
        const now = new Date();

        if (filter === 'upcoming') {
            return aptDate >= now && apt.status === 'upcoming';
        } else if (filter === 'past') {
            return aptDate < now || apt.status === 'completed';
        } else {
            return apt.status === filter;
        }
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
                {['upcoming', 'past', 'cancelled'].map((filterOption) => (
                    <button
                        key={filterOption}
                        onClick={() => setFilter(filterOption)}
                        className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${filter === filterOption
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                    </button>
                ))}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
                    {error}
                </div>
            )}

            {/* Appointments List */}
            {filteredAppointments.length === 0 ? (
                <div className="text-center py-12">
                    <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No {filter} appointments found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredAppointments.map((appointment) => (
                        <div
                            key={appointment._id}
                            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-lg">{appointment.fullName}</h3>
                                    {userRole !== 'patient' && (
                                        <p className="text-sm text-gray-600">{appointment.phone}</p>
                                    )}
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${appointment.status === 'upcoming'
                                            ? 'bg-blue-100 text-blue-700'
                                            : appointment.status === 'completed'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                        }`}
                                >
                                    {appointment.status}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center text-gray-700">
                                    <Calendar size={16} className="mr-2 text-blue-600" />
                                    <span>{formatDate(appointment.appointmentDate)}</span>
                                </div>
                                <div className="flex items-center text-gray-700">
                                    <Clock size={16} className="mr-2 text-blue-600" />
                                    <span>{appointment.timeSlot}</span>
                                </div>
                                <div className="flex items-center text-gray-700">
                                    <FileText size={16} className="mr-2 text-blue-600" />
                                    <span className="capitalize">
                                        {appointment.consultationType.replace(/-/g, ' ')}
                                    </span>
                                </div>
                                {appointment.additionalMessage && (
                                    <p className="text-gray-600 mt-2 pl-6">
                                        {appointment.additionalMessage}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="mt-4 flex gap-2">
                                {appointment.status === 'upcoming' && (
                                    <button
                                        onClick={() => handleCancelAppointment(appointment._id)}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium"
                                    >
                                        <Trash2 size={16} />
                                        Cancel
                                    </button>
                                )}

                                {(userRole === 'admin' || userRole === 'reception') && (
                                    <>
                                        {appointment.status === 'upcoming' && (
                                            <button
                                                onClick={() => handleUpdateStatus(appointment._id, 'completed')}
                                                className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition text-sm font-medium"
                                            >
                                                Mark Completed
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}