'use client';

import { getSlotGap } from '@/lib/slotConfig';
import { Calendar, ChevronLeft, FileText, Phone, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function GuestAppointmentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        appointmentDate: '',
        timeSlot: '',
        consultationType: '',
        additionalMessage: ''
    });
    const [availableSlots, setAvailableSlots] = useState([]);
    const [errors, setErrors] = useState({});
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
        setErrors({});

        try {
            const response = await fetch(`/api/appointments/available-slots?date=${date}`);
            const data = await response.json();

            if (data.available) {
                setAvailableSlots(data.slots);
                setDayBlockedMessage('');
            } else {
                setAvailableSlots([]);
                setDayBlockedMessage(data.reason || 'This date is unavailable');
            }
        } catch (err) {
            setErrors({ general: 'Failed to fetch available slots' });
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

        setErrors(prev => ({ ...prev, [name]: '', general: '' }));
    };

    const calculateApproxTime = (slotTime, bookingsCount) => {
        const [time, period] = slotTime.split(' - ')[0].split(' ');
        const [hours, minutes] = time.split(':').map(Number);

        // Use dynamic slot gap based on slot capacity and duration
        const slotGap = getSlotGap(slotTime);
        let totalMinutes = hours * 60 + minutes + (bookingsCount * slotGap);
        if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
        if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;

        const newHours = Math.floor(totalMinutes / 60) % 24;
        const newMinutes = totalMinutes % 60;
        const newPeriod = newHours >= 12 ? 'PM' : 'AM';
        const displayHours = newHours > 12 ? newHours - 12 : (newHours === 0 ? 12 : newHours);

        return `${displayHours}:${newMinutes.toString().padStart(2, '0')} ${newPeriod}`;
    };

    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const getMaxDate = () => {
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 3);
        return maxDate.toISOString().split('T')[0];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        // Validation
        if (!formData.fullName || !formData.phone || !formData.appointmentDate ||
            !formData.timeSlot || !formData.consultationType) {
            setErrors({
                general: 'Please fill in all required fields'
            });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/appointments/guest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to book appointment');
            }

            router.push('/');

        } catch (error) {
            setErrors({ general: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="mb-4 flex items-center text-gray-600 hover:text-gray-800 transition"
                >
                    <ChevronLeft size={20} />
                    <span className="ml-1">Back</span>
                </button>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                        <h1 className="text-2xl font-bold">Guest Appointment Booking</h1>
                        <p className="text-sm mt-1 opacity-90">Book an appointment without creating an account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 text-gray-700">
                        {errors.general && (
                            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
                                {errors.general}
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-4 mb-4 text-gray-700">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Full Name *
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Phone Number *
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter phone number"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Appointment Date */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Appointment Date *
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="date"
                                    name="appointmentDate"
                                    value={formData.appointmentDate}
                                    onChange={handleInputChange}
                                    min={getMinDate()}
                                    max={getMaxDate()}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Note: Clinic is closed on Sundays
                            </p>
                        </div>

                        {/* Time Slot */}
                        {formData.appointmentDate && (
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Type of Consultation *
                            </label>
                            <select
                                name="consultationType"
                                value={formData.consultationType}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select consultation type</option>
                                {consultationTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Additional Message */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Additional Message/Symptoms (Optional)
                            </label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                                <textarea
                                    name="additionalMessage"
                                    value={formData.additionalMessage}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    rows="4"
                                    placeholder="Describe your symptoms or reason for visit"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Booking...' : 'Book Appointment'}
                        </button>

                        <p className="text-sm text-gray-600 mt-4 text-center">
                            Note: As a guest, you won't be able to modify this appointment later.
                            Consider <a href="/" className="text-blue-600 hover:underline">creating an account</a> for full access.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}