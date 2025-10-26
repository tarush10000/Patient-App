'use client';

import { api } from '@/lib/api';
import { X } from 'lucide-react';
import { useState } from 'react';

export default function EditAppointmentModal({ appointment, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        fullName: appointment.fullName,
        phone: appointment.phone,
        additionalMessage: appointment.additionalMessage || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isMoreThanFourHoursAway()) {
            setError('Appointments can only be edited if they are more than 4 hours away. Please contact the center.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.updateAppointment(appointment._id, formData);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to update appointment');
        } finally {
            setLoading(false);
        }
    };

    if (!isMoreThanFourHoursAway()) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl p-6 max-w-md w-full">
                    <h3 className="text-xl font-bold mb-4 text-red-600">Cannot Edit Appointment</h3>
                    <p className="text-gray-700 mb-6">
                        Appointments can only be edited if they are more than 4 hours away. 
                        Please contact the center to make changes.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Edit Appointment</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Additional Message</label>
                        <textarea
                            value={formData.additionalMessage}
                            onChange={(e) => setFormData({ ...formData, additionalMessage: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            rows="3"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Update'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}