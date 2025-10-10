'use client';

import { useState } from 'react';
import { Calendar, Clock, FileText, Trash2, Edit2, Check, X } from 'lucide-react';

export default function AppointmentCard({ appointment, onCancel, onComplete, onEdit, userRole = 'patient' }) {
    const [showEditWarning, setShowEditWarning] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        fullName: appointment.fullName,
        phone: appointment.phone,
        additionalMessage: appointment.additionalMessage || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const isMoreThanFourHoursAway = () => {
        const now = new Date();
        const aptDate = new Date(appointment.appointmentDate);
        const [slotTime, period] = appointment.timeSlot.split(' - ')[0].split(' ');
        const [hours, minutes] = slotTime.split(':').map(Number);
        
        let aptHours = hours;
        if (period === 'PM' && hours !== 12) aptHours += 12;
        if (period === 'AM' && hours === 12) aptHours = 0;
        
        aptDate.setHours(aptHours, minutes, 0, 0);
        
        const diffMs = aptDate - now;
        const diffHours = diffMs / (1000 * 60 * 60);
        
        return diffHours > 4;
    };

    const handleEditClick = () => {
        if (isMoreThanFourHoursAway()) {
            setShowEditModal(true);
            setError('');
        } else {
            setShowEditWarning(true);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (onEdit) {
                await onEdit(appointment._id, editForm);
                setShowEditModal(false);
            }
        } catch (err) {
            setError(err.message || 'Failed to update appointment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800">{appointment.fullName}</h3>
                        {(userRole === 'admin' || userRole === 'reception') && (
                            <p className="text-sm text-gray-600">{appointment.phone}</p>
                        )}
                    </div>
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            appointment.status === 'upcoming'
                                ? 'bg-blue-100 text-blue-700'
                                : appointment.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : appointment.status === 'seen'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                        }`}
                    >
                        {appointment.status === 'seen' ? 'Seen' : appointment.status}
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

                {/* Action Buttons */}
                {(appointment.status === 'upcoming' || appointment.status === 'seen') && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {/* Patient Actions */}
                        {userRole === 'patient' && appointment.status === 'upcoming' && (
                            <>
                                <button
                                    onClick={handleEditClick}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
                                >
                                    <Edit2 size={16} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => onCancel(appointment._id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium"
                                >
                                    <Trash2 size={16} />
                                    Cancel
                                </button>
                            </>
                        )}

                        {/* Admin/Reception Actions */}
                        {(userRole === 'admin' || userRole === 'reception') && (
                            <>
                                {appointment.status === 'upcoming' && (
                                    <button
                                        onClick={() => onComplete(appointment._id)}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition text-sm font-medium"
                                    >
                                        <Check size={16} />
                                        Mark as Seen
                                    </button>
                                )}
                                <button
                                    onClick={() => onCancel(appointment._id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium"
                                >
                                    <Trash2 size={16} />
                                    Cancel Appointment
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Warning Modal */}
            {showEditWarning && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-red-600">Cannot Edit Appointment</h3>
                        <p className="text-gray-700 mb-6">
                            Appointments can only be edited if they are more than 4 hours away. 
                            Please contact the centre to make changes.
                        </p>
                        <button
                            onClick={() => setShowEditWarning(false)}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Appointment Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Edit Appointment</h3>
                            <button 
                                onClick={() => setShowEditModal(false)} 
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    value={editForm.fullName}
                                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    maxLength="10"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Additional Message
                                </label>
                                <textarea
                                    value={editForm.additionalMessage}
                                    onChange={(e) => setEditForm({ ...editForm, additionalMessage: e.target.value })}
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white resize-none"
                                    placeholder="Any specific concerns or additional information..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Updating...' : 'Update Appointment'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 font-medium transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}