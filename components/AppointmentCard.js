'use client';

import { Calendar, Clock, FileText, Trash2 } from 'lucide-react';

export default function AppointmentCard({ appointment, onCancel, onComplete, userRole = 'patient' }) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition">
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
                        {appointment.consultationType?.replace(/-/g, ' ')}
                    </span>
                </div>
                {appointment.additionalMessage && (
                    <p className="text-gray-600 mt-2 pl-6">
                        {appointment.additionalMessage}
                    </p>
                )}
            </div>

            {appointment.status === 'upcoming' && (
                <div className="mt-4 flex gap-2">
                    <button
                        onClick={() => onCancel(appointment._id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium"
                    >
                        <Trash2 size={16} />
                        Cancel
                    </button>

                    {(userRole === 'admin' || userRole === 'reception') && onComplete && (
                        <button
                            onClick={() => onComplete(appointment._id)}
                            className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition text-sm font-medium"
                        >
                            Mark Completed
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
