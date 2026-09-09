'use client';

import { Calendar, Check, Clock, Edit2, FileText, Trash2, X } from 'lucide-react';
import { useState } from 'react';

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
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:shadow-sm hover:border-slate-300 transition">
                <div className="flex justify-between items-start mb-3.5">
                    <div>
                        <h3 className="font-bold text-base text-[#173456]">{appointment.fullName}</h3>
                        {(userRole === 'admin' || userRole === 'reception') && (
                            <p className="text-xs text-slate-500 mt-0.5">{appointment.phone}</p>
                        )}
                    </div>
                    <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            appointment.status === 'upcoming'
                                ? 'bg-slate-100 text-[#173456] border border-slate-200'
                                : appointment.status === 'completed' || appointment.status === 'seen'
                                ? 'bg-emerald-50 text-[#0e8a7d] border border-emerald-200/60'
                                : 'bg-rose-50 text-[#d3455b] border border-rose-200/60'
                        }`}
                    >
                        {appointment.status === 'seen' ? 'Seen' : appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-center">
                        <Calendar size={15} className="mr-2 text-[#0e8a7d]" />
                        <span className="font-medium text-slate-700">{formatDate(appointment.appointmentDate)}</span>
                    </div>
                    <div className="flex items-center">
                        <Clock size={15} className="mr-2 text-[#0e8a7d]" />
                        <span className="font-medium text-slate-700">{appointment.timeSlot}</span>
                    </div>
                    <div className="flex items-center">
                        <FileText size={15} className="mr-2 text-[#0e8a7d]" />
                        <span className="capitalize text-slate-600">
                            {appointment.consultationType?.replace(/-/g, ' ')}
                        </span>
                    </div>
                    {appointment.additionalMessage && (
                        <p className="text-slate-500 mt-2 pl-5 italic border-l-2 border-slate-200">
                            {appointment.additionalMessage}
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                {(appointment.status === 'upcoming' || appointment.status === 'seen') && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                        {/* Patient Actions */}
                        {userRole === 'patient' && appointment.status === 'upcoming' && (
                            <>
                                <button
                                    onClick={handleEditClick}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-[#173456] rounded-lg hover:bg-slate-200 transition text-xs font-semibold"
                                >
                                    <Edit2 size={14} />
                                    Edit Details
                                </button>
                                <button
                                    onClick={() => onCancel(appointment._id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-[#d3455b] rounded-lg hover:bg-rose-100 transition text-xs font-semibold"
                                >
                                    <Trash2 size={14} />
                                    Cancel Visit
                                </button>
                            </>
                        )}

                        {/* Admin/Reception Actions */}
                        {(userRole === 'admin' || userRole === 'reception') && (
                            <>
                                {appointment.status === 'upcoming' && (
                                    <button
                                        onClick={() => onComplete(appointment._id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-[#0e8a7d] rounded-lg hover:bg-emerald-100 transition text-xs font-semibold"
                                    >
                                        <Check size={14} />
                                        Mark as Seen
                                    </button>
                                )}
                                <button
                                    onClick={() => onCancel(appointment._id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-[#d3455b] rounded-lg hover:bg-rose-100 transition text-xs font-semibold"
                                >
                                    <Trash2 size={14} />
                                    Cancel
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
                            Please contact the center to make changes.
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