'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Phone, User, FileText, X } from 'lucide-react';
import { api } from '@/lib/api';

export default function BookAppointmentForm({ onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        appointmentDate: '',
        timeSlot: '',
        consultationType: '',
        additionalMessage: ''
    });

    const [availableSlots, setAvailableSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [dayBlockedMessage, setDayBlockedMessage] = useState('');

    const consultationTypes = [
        { value: 'routine-checkup', label: 'Routine Check-up' },
        { value: 'prenatal-care', label: 'Prenatal Care' },
        { value: 'postnatal-care', label: 'Postnatal Care' },
        { value: 'gynecological-exam', label: 'Gynecological Exam' },
        { value: 'consultation', label: 'General Consultation' },
        { value: 'follow-up', label: 'Follow-up Visit' }
    ];

    useEffect(() => {
        if (formData.appointmentDate) {
            fetchAvailableSlots(formData.appointmentDate);
        } else {
            setAvailableSlots([]);
            setDayBlockedMessage('');
        }
    }, [formData.appointmentDate]);

    const fetchAvailableSlots = async (date) => {
        setLoadingSlots(true);
        setDayBlockedMessage('');
        setError('');

        try {
            const response = await api.getAvailableSlots(date);
            if (response.available) {
                setAvailableSlots(response.slots);
                setDayBlockedMessage('');
            } else {
                setAvailableSlots([]);
                setDayBlockedMessage(response.reason || 'This date is unavailable');
            }
        } catch (err) {
            setError('Failed to fetch available slots');
            setAvailableSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Reset time slot when date changes
        if (name === 'appointmentDate') {
            setFormData(prev => ({ ...prev, [name]: value, timeSlot: '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validation
        if (!formData.fullName || !formData.phone || !formData.appointmentDate ||
            !formData.timeSlot || !formData.consultationType) {
            setError('Please fill all required fields');
            setLoading(false);
            return;
        }

        try {
            await api.createAppointment(formData);
            setSuccess('Appointment booked successfully!');

            // Refresh available slots after booking
            await fetchAvailableSlots(formData.appointmentDate);

            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 1500);
        } catch (err) {
            setError(err.message || 'Failed to book appointment');
        } finally {
            setLoading(false);
        }
    };

    // Get minimum date (today)
    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    // Get maximum date (3 months from now)
    const getMaxDate = () => {
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 3);
        return maxDate.toISOString().split('T')[0];
    };

    const calculateApproxTime = (slotTime, bookingsCount) => {
        const [time, period] = slotTime.split(' - ')[0].split(' ');
        const [hours, minutes] = time.split(':').map(Number);

        let totalMinutes = hours * 60 + minutes + (bookingsCount * 15);
        if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
        if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;

        const newHours = Math.floor(totalMinutes / 60) % 24;
        const newMinutes = totalMinutes % 60;
        const newPeriod = newHours >= 12 ? 'PM' : 'AM';
        const displayHours = newHours > 12 ? newHours - 12 : (newHours === 0 ? 12 : newHours);

        return `${displayHours}:${newMinutes.toString().padStart(2, '0')} ${newPeriod}`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center rounded-t-2xl">
                    <h2 className="text-2xl font-bold">Book Appointment</h2>
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
                        >
                            <X size={24} />
                        </button>
                    )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
                            {success}
                        </div>
                    )}

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {/* Full Name */}
                        <div>
                            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                <User size={18} className="mr-2 text-blue-600" />
                                Full Name *
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                placeholder="Enter your full name"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                <Phone size={18} className="mr-2 text-blue-600" />
                                Phone Number *
                            </label>
                            <div className="flex gap-2">
                                <span className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                                    +91
                                </span>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="Enter 10-digit mobile number"
                                    pattern="[0-9]{10}"
                                    maxLength="10"
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>

                        {/* Appointment Date */}
                        <div>
                            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                <Calendar size={18} className="mr-2 text-blue-600" />
                                Appointment Date *
                            </label>
                            <input
                                type="date"
                                name="appointmentDate"
                                value={formData.appointmentDate}
                                onChange={handleInputChange}
                                min={getMinDate()}
                                max={getMaxDate()}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Note: Clinic is closed on Sundays
                            </p>
                        </div>

                        {/* Time Slot */}
                        {formData.appointmentDate && (
                            <div>
                                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                    <Clock size={18} className="mr-2 text-blue-600" />
                                    Preferred Time Slot *
                                </label>

                                {loadingSlots ? (
                                    <div className="text-center py-8">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <p className="text-sm text-gray-600 mt-2">Loading available slots...</p>
                                    </div>
                                ) : dayBlockedMessage ? (
                                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
                                        <p className="text-red-800 font-semibold">❌ {dayBlockedMessage}</p>
                                        <p className="text-sm text-red-600 mt-2">Please select a different date</p>
                                    </div>
                                ) : availableSlots.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {availableSlots.map((slot) => (
                                            <button
                                                key={slot.time}
                                                type="button"
                                                onClick={() => slot.status === 'available' && setFormData(prev => ({ ...prev, timeSlot: slot.time }))}
                                                disabled={slot.status !== 'available'}
                                                className={`p-4 rounded-lg border-2 text-sm font-medium transition ${formData.timeSlot === slot.time
                                                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md'
                                                        : slot.status === 'available'
                                                            ? 'border-green-500 bg-white hover:border-blue-400 hover:shadow-sm text-gray-700'
                                                            : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-semibold">{slot.time.split(' - ')[0]}</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${slot.status === 'available'
                                                            ? 'bg-green-100 text-green-800'
                                                            : slot.status === 'blocked'
                                                                ? 'bg-gray-200 text-gray-700'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {slot.available}/{slot.capacity}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Until {slot.time.split(' - ')[1]}
                                                </div>
                                                {slot.status === 'available' && slot.booked > 0 && (
                                                    <p className="text-xs text-blue-600 mt-1 font-semibold">
                                                        ⏱️ ~{calculateApproxTime(slot.time, slot.booked)}
                                                    </p>
                                                )}
                                                {slot.status === 'blocked' && (
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        Blocked
                                                    </p>
                                                )}
                                                {slot.status === 'full' && (
                                                    <p className="text-xs text-red-600 mt-1 font-semibold">
                                                        Fully Booked
                                                    </p>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-8">No available slots for this date</p>
                                )}
                            </div>
                        )}

                        {/* Consultation Type */}
                        <div>
                            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                <FileText size={18} className="mr-2 text-blue-600" />
                                Type of Consultation *
                            </label>
                            <select
                                name="consultationType"
                                value={formData.consultationType}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                                required
                            >
                                <option value="">Select Service Type</option>
                                {consultationTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Additional Message */}
                        <div>
                            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                <FileText size={18} className="mr-2 text-blue-600" />
                                Additional Message (Optional)
                            </label>
                            <textarea
                                name="additionalMessage"
                                value={formData.additionalMessage}
                                onChange={handleInputChange}
                                placeholder="Any specific concerns or questions?"
                                rows="3"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="mt-6 flex gap-3">
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading || !formData.timeSlot}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Booking...' : 'Book Appointment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}