'use client';

import { api } from '@/lib/api';
import { getSlotGap } from '@/lib/slotConfig';
import { Calendar, CheckCircle, Clock, FileText, Phone, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';

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
    const [bookingComplete, setBookingComplete] = useState(false);
    const [confirmedAppointment, setConfirmedAppointment] = useState(null);
    const [dayBlockedMessage, setDayBlockedMessage] = useState('');
    const [duplicateWarning, setDuplicateWarning] = useState(null);

    // Identify if current user is admin or reception to bypass time constraints
    const [isAdminOrReception, setIsAdminOrReception] = useState(false);
    useEffect(() => {
        const token = api.getToken();
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (['admin', 'reception'].includes(payload.role)) {
                    setIsAdminOrReception(true);
                }
            } catch (e) { }
        }
    }, []);

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
            setConfirmedAppointment(formData);
            setBookingComplete(true);

            // Refresh available slots after booking
            await fetchAvailableSlots(formData.appointmentDate);

        } catch (err) {
            if (err.data && err.data.errorCode === 'DUPLICATE_APPOINTMENT') {
                setDuplicateWarning({
                    show: true,
                    existingName: err.data.existingFullName,
                    existingPhone: err.data.existingPhone,
                    existingAppointmentDate: err.data.existingAppointmentDate,
                    existingTimeSlot: err.data.existingTimeSlot,
                    existingConsultationType: err.data.existingConsultationType,
                    existingStatus: err.data.existingStatus
                });
            } else {
                setError(err.message || 'Failed to book appointment');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForceSubmit = async () => {
        setDuplicateWarning(null);
        setLoading(true);
        setError('');

        try {
            await api.createAppointment({ ...formData, forceReplace: true });
            setConfirmedAppointment(formData);
            setBookingComplete(true);
            await fetchAvailableSlots(formData.appointmentDate);
        } catch (err) {
            setError(err.message || 'Failed to replace booking');
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

    const isSlotBlockedByTime = (slotTime) => {
        if (isAdminOrReception) return false;
        if (!formData.appointmentDate) return false;

        const now = new Date();
        const selectedDate = new Date(formData.appointmentDate);
        const today = new Date();

        // Reset hours to compare just the dates
        selectedDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        // Only check time for today
        if (selectedDate.getTime() !== today.getTime()) {
            return false;
        }

        const [timeStr, period] = slotTime.split(' - ')[0].split(' ');
        let [hours, minutes] = timeStr.split(':').map(Number);

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        const slotDate = new Date(formData.appointmentDate);
        slotDate.setHours(hours, minutes, 0, 0);

        // Calculate difference in hours
        const diffInHours = (slotDate - now) / (1000 * 60 * 60);

        // Block if slot is in the past or within 2 hours
        return diffInHours < 2;
    };

    const addToCalendar = () => {
        const start = new Date(`${confirmedAppointment.appointmentDate}T${to24HourTime(confirmedAppointment.timeSlot.split(' - ')[0])}:00`);
        const end = new Date(`${confirmedAppointment.appointmentDate}T${to24HourTime(confirmedAppointment.timeSlot.split(' - ')[1])}:00`);
        const formatCalendarDate = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        const calendar = [
            'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
            `DTSTART:${formatCalendarDate(start)}`, `DTEND:${formatCalendarDate(end)}`,
            `SUMMARY:Women Wellness Center appointment for ${confirmedAppointment.fullName}`,
            'END:VEVENT', 'END:VCALENDAR'
        ].join('\r\n');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([calendar], { type: 'text/calendar' }));
        link.download = 'appointment.ics';
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const to24HourTime = (value) => {
        const [time, period] = value.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-[0_4px_20px_-2px_rgba(15,23,42,0.07)] w-full max-w-2xl max-h-[90vh] my-8 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 bg-[#173456] p-6 text-white flex justify-between items-center rounded-t-xl">
                    <h2 className="text-2xl font-bold text-white" style={{ color: '#ffffff' }}>Book Appointment</h2>
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="text-white hover:bg-white/20 p-2 rounded-md transition"
                        >
                            <X size={24} />
                        </button>
                    )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 flex flex-col min-h-0">
                    {bookingComplete ? (
                        <div className="py-8 text-center">
                            <CheckCircle className="mx-auto mb-4 text-[#0e8a7d]" size={48} />
                            <h3 className="text-2xl font-bold text-[#173456] mb-2">Appointment confirmed</h3>
                            <p className="text-[#5a6e85] mb-6">Your appointment is booked. We will send updates by SMS and WhatsApp.</p>
                            <div className="text-left bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 space-y-2 mb-6">
                                <p><strong>Patient:</strong> {confirmedAppointment.fullName}</p>
                                <p><strong>Phone:</strong> +91 {confirmedAppointment.phone}</p>
                                <p><strong>Date:</strong> {confirmedAppointment.appointmentDate}</p>
                                <p><strong>Time:</strong> {confirmedAppointment.timeSlot}</p>
                                <p><strong>Consultation:</strong> {confirmedAppointment.consultationType}</p>
                                <p className="text-[#0e8a7d] font-medium">SMS notification: queued</p>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={addToCalendar} className="flex-1 px-4 py-3 border border-[#173456] text-[#173456] rounded-md font-semibold">Add to calendar</button>
                                <button type="button" onClick={onSuccess || onCancel} className="flex-1 px-4 py-3 bg-[#0e8a7d] text-white rounded-md font-semibold">Back to dashboard</button>
                            </div>
                        </div>
                    ) : <>
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

                    <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-2">
                        {/* Full Name */}
                        <div>
                            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                <User size={18} className="mr-2 text-[#0e8a7d]" />
                                Full Name *
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                placeholder="Enter your full name"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                required
                            />
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                <Phone size={18} className="mr-2 text-[#0e8a7d]" />
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
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                    required
                                />
                            </div>
                        </div>

                        {/* Appointment Date */}
                        <div>
                            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                <Calendar size={18} className="mr-2 text-[#0e8a7d]" />
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
                                    <Clock size={18} className="mr-2 text-[#0e8a7d]" />
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
                                                onClick={() => slot.status === 'available' && !isSlotBlockedByTime(slot.time) && setFormData(prev => ({ ...prev, timeSlot: slot.time }))}
                                                disabled={slot.status !== 'available' || isSlotBlockedByTime(slot.time)}
                                                className={`p-4 rounded-lg border-2 text-sm font-medium transition ${formData.timeSlot === slot.time
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md'
                                                    : isSlotBlockedByTime(slot.time)
                                                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                                        : slot.status === 'available'
                                                            ? 'border-green-500 bg-white hover:border-blue-400 hover:shadow-sm text-gray-700'
                                                            : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-semibold">{slot.time.split(' - ')[0]}</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${isSlotBlockedByTime(slot.time)
                                                            ? 'bg-gray-200 text-gray-700'
                                                            : slot.status === 'available'
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
                                                {(slot.status === 'blocked' || isSlotBlockedByTime(slot.time)) && (
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        {isSlotBlockedByTime(slot.time) ? 'Too Soon' : 'Blocked'}
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
                                <FileText size={18} className="mr-2 text-[#0e8a7d]" />
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
                                <FileText size={18} className="mr-2 text-[#0e8a7d]" />
                                Additional Message (Optional)
                            </label>
                            <textarea
                                name="additionalMessage"
                                value={formData.additionalMessage}
                                onChange={handleInputChange}
                                placeholder="Any specific concerns or questions?"
                                rows="3"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
                            />
                        </div>
                    </div>

                    {/* Confirmation Summary */}
                    {formData.fullName && formData.phone && formData.appointmentDate && formData.timeSlot && formData.consultationType && (
                        <div className="mt-6 rounded-xl border border-[#bce8e3] bg-[#e6f6f4] p-4 text-sm text-[#173456]">
                            <p className="font-bold mb-2">Appointment summary</p>
                            <p>Patient: {formData.fullName}</p>
                            <p>Phone: +91 {formData.phone}</p>
                            <p>Date: {formData.appointmentDate}</p>
                            <p>Time: {formData.timeSlot}</p>
                            <p>Consultation: {consultationTypes.find(type => type.value === formData.consultationType)?.label}</p>
                        </div>
                    )}

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
                            className="flex-1 px-6 py-3 bg-[#0e8a7d] text-white rounded-md font-semibold hover:bg-[#0b7066] transition disabled:bg-[#cbd5e1] disabled:cursor-not-allowed"
                        >
                            {loading ? 'Booking...' : 'Book Appointment'}
                        </button>
                    </div>
                    </>}
                </form>
            </div>

            {duplicateWarning && duplicateWarning.show && (
                <div className="fixed inset-0 flex items-center justify-center p-4 z-[70] bg-black bg-opacity-70">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-center text-gray-800 animate-in zoom-in-95 duration-200 border-2 border-red-100">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-red-600">Duplicate Booking Detected</h3>
                        <p className="mb-4 text-gray-600 font-medium">
                            This phone number already has an appointment booked for <span className="text-gray-900 font-bold whitespace-nowrap">{formData.appointmentDate}</span>.
                        </p>
                        <div className="text-left bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3 mb-4 text-sm space-y-1">
                            <p><strong>Existing patient:</strong> {duplicateWarning.existingName}</p>
                            <p><strong>Date:</strong> {duplicateWarning.existingAppointmentDate ? new Date(duplicateWarning.existingAppointmentDate).toLocaleDateString('en-IN') : formData.appointmentDate}</p>
                            <p><strong>Time:</strong> {duplicateWarning.existingTimeSlot || 'Unavailable'}</p>
                            <p><strong>Status:</strong> {duplicateWarning.existingStatus || 'Active'}</p>
                        </div>
                        <p className="mb-4 text-gray-800 text-sm font-semibold bg-red-50 p-3 outline outline-1 outline-red-200 rounded-lg">
                            If you proceed, the old appointment will be deleted!
                        </p>
                        {duplicateWarning.existingName !== formData.fullName && (
                            <p className="mb-6 p-3 text-sm bg-orange-50 text-orange-800 font-semibold rounded-lg border border-orange-200">
                                <span className="block mb-1 text-red-500 font-black tracking-wide">CAUTION: NAME MISMATCH</span>
                                The existing appointment is under the name <strong>{duplicateWarning.existingName}</strong>.
                                Use a different phone number if making appointment for multiple people or contact the reception!
                            </p>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDuplicateWarning(null)}
                                className="flex-1 py-3 text-sm bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 border border-gray-300 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleForceSubmit}
                                className="flex-1 py-3 text-sm bg-red-600 text-white font-bold rounded-lg shadow-md hover:bg-red-700 shadow-red-500/30 transition"
                            >
                                Yes, Replace Old
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}