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
        }
    }, [formData.appointmentDate]);

    const fetchAvailableSlots = async (date) => {
        setLoadingSlots(true);
        try {
            const response = await api.getAvailableSlots(date);
            if (response.available) {
                setAvailableSlots(response.slots);
            } else {
                setError(`This date is unavailable: ${response.reason}`);
                setAvailableSlots([]);
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
        setFormData(prev => ({ ...prev, [name]: value }));
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

    // Get maximum date (3 months from now)
    const getMaxDate = () => {
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 3);
        return maxDate.toISOString().split('T')[0];
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
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
                <div className="p-6">
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

                    <div className="space-y-4">
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
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
                                <span className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg">
                                    +91
                                </span>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="Enter 10-digit mobile number"
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
                        </div>

                        {/* Time Slot */}
                        {formData.appointmentDate && (
                            <div>
                                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                    <Clock size={18} className="mr-2 text-blue-600" />
                                    Preferred Time Slot *
                                </label>

                                {loadingSlots ? (
                                    <div className="text-center py-4">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <p className="text-sm text-gray-600 mt-2">Loading available slots...</p>
                                    </div>
                                ) : availableSlots.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {availableSlots.map((slot) => (
                                            <button
                                                key={slot.time}
                                                type="button"
                                                onClick={() => slot.status === 'available' && setFormData(prev => ({ ...prev, timeSlot: slot.time }))}
                                                disabled={slot.status !== 'available'}
                                                className={`p-3 rounded-lg border-2 text-sm font-medium transition ${formData.timeSlot === slot.time
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                    : slot.status === 'available'
                                                        ? 'border-green-500 bg-white hover:border-blue-400 text-gray-700'
                                                        : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span>{slot.time.split(' - ')[0]}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${slot.status === 'available'
                                                        ? 'bg-green-100 text-green-800'
                                                        : slot.status === 'blocked'
                                                            ? 'bg-gray-200 text-gray-700'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {slot.available}/{slot.capacity} available
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {slot.time.split(' - ')[1]}
                                                </div>
                                                {slot.status === 'available' && slot.booked > 0 && (
                                                    <p className="text-xs text-blue-600 mt-1">
                                                        Approx: {calculateApproxTime(slot.time, slot.booked)}
                                                    </p>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 py-4">No available slots for this date</p>
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
                            <p className="text-xs text-gray-500 mt-1">
                                Select the type of consultation you need for better preparation.
                            </p>
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
                                placeholder="Any specific concerns or additional information you'd like to share..."
                                rows="3"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 bg-white"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Booking...</span>
                                </>
                            ) : (
                                <>
                                    <Calendar size={20} />
                                    <span>BOOK APPOINTMENT</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
