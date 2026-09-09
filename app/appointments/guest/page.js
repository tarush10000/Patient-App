'use client';

import { getSlotGap } from '@/lib/slotConfig';
import { Calendar, CheckCircle, ChevronLeft, FileText, Phone, User } from 'lucide-react';
import Link from 'next/link';
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

    const [success, setSuccess] = useState('');
    const [duplicateWarning, setDuplicateWarning] = useState(null);
    const [bookingComplete, setBookingComplete] = useState(false);
    const [confirmedAppointment, setConfirmedAppointment] = useState(null);

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
        setSuccess('');

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
                const error = new Error(data.error || 'Failed to book appointment');
                error.data = data;
                throw error;
            }

            setConfirmedAppointment(formData);
            setBookingComplete(true);

        } catch (error) {
            if (error.data && error.data.errorCode === 'DUPLICATE_APPOINTMENT') {
                setDuplicateWarning({
                    show: true,
                    existingName: error.data.existingFullName,
                    existingPhone: error.data.existingPhone,
                    existingAppointmentDate: error.data.existingAppointmentDate,
                    existingTimeSlot: error.data.existingTimeSlot,
                    existingConsultationType: error.data.existingConsultationType,
                    existingStatus: error.data.existingStatus
                });
            } else {
                setErrors({ general: error.message });
            }
            setLoading(false);
        }
    };

    const handleForceSubmit = async () => {
        setDuplicateWarning(null);
        setLoading(true);
        setErrors({});

        try {
            const payload = { ...formData, forceReplace: true };
            const response = await fetch('/api/appointments/guest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to replace booking');
            }

            setConfirmedAppointment(formData);
            setBookingComplete(true);

        } catch (error) {
            setErrors({ general: error.message });
            setLoading(false);
        }
    };

    const to24HourTime = (value) => {
        const [time, period] = value.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
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

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="mb-4 flex items-center text-[#5a6e85] hover:text-[#0e8a7d] transition"
                >
                    <ChevronLeft size={20} />
                    <span className="ml-1">Back</span>
                </button>

                <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-[0_4px_20px_-2px_rgba(15,23,42,0.07)] overflow-hidden">
                    <div className="bg-[#173456] p-6 text-white">
                        <h1 className="text-2xl font-bold text-white">Guest Appointment Booking</h1>
                        <p className="text-sm mt-1 opacity-90">Book an appointment without creating an account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 text-gray-700">
                        {bookingComplete ? (
                            <div className="py-8 text-center">
                                <CheckCircle className="mx-auto mb-4 text-[#0e8a7d]" size={48} />
                                <h2 className="text-2xl font-bold text-[#173456] mb-2">Appointment confirmed</h2>
                                <p className="text-[#5a6e85] mb-6">Your appointment is booked. We will send updates by SMS and WhatsApp.</p>
                                <div className="text-left bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 space-y-2 mb-6">
                                    <p><strong>Patient:</strong> {confirmedAppointment.fullName}</p>
                                    <p><strong>Phone:</strong> +91 {confirmedAppointment.phone}</p>
                                    <p><strong>Date:</strong> {confirmedAppointment.appointmentDate}</p>
                                    <p><strong>Time:</strong> {confirmedAppointment.timeSlot}</p>
                                    <p><strong>Consultation:</strong> {consultationTypes.find(type => type.value === confirmedAppointment.consultationType)?.label || confirmedAppointment.consultationType}</p>
                                    <p className="text-[#0e8a7d] font-medium">SMS notification: queued</p>
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={addToCalendar} className="flex-1 px-4 py-3 border border-[#173456] text-[#173456] rounded-md font-semibold">Add to calendar</button>
                                    <button type="button" onClick={() => router.push('/')} className="flex-1 px-4 py-3 bg-[#0e8a7d] text-white rounded-md font-semibold">Back to dashboard</button>
                                </div>
                            </div>
                        ) : <>
                        {errors.general && (
                            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
                                {errors.general}
                            </div>
                        )}
                        {success && (
                            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4 flex flex-col items-center justify-center">
                                <div className="text-center font-bold text-lg mb-1">{success}</div>
                                <div className="text-sm text-center">Your appointment details will be sent to your WhatsApp.</div>
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-4 mb-4 text-gray-700">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Full Name *
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0e8a7d]" size={18} />
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
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0e8a7d]" size={18} />
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
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0e8a7d]" size={18} />
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

                        {formData.fullName && formData.phone && formData.appointmentDate && formData.timeSlot && formData.consultationType && (
                            <div className="mb-6 rounded-xl border border-[#bce8e3] bg-[#e6f6f4] p-4 text-sm text-[#173456]">
                                <p className="font-bold mb-2">Appointment summary</p>
                                <p>Patient: {formData.fullName}</p>
                                <p>Phone: {formData.phone}</p>
                                <p>Date: {formData.appointmentDate}</p>
                                <p>Time: {formData.timeSlot}</p>
                                <p>Consultation: {consultationTypes.find(type => type.value === formData.consultationType)?.label}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#0e8a7d] text-white py-3 rounded-md font-semibold hover:bg-[#0b7066] transition disabled:opacity-50"
                        >
                            {loading ? 'Booking...' : 'Book Appointment'}
                        </button>

                        <p className="text-sm text-gray-600 mt-4 text-center">
                            Note: As a guest, you won&apos;t be able to modify this appointment later.
                            Consider <Link href="/" className="text-[#0e8a7d] hover:underline">creating an account</Link> for full access.
                        </p>
                        </>}
                    </form>
                </div>
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
                            If you proceed, your old appointment will be deleted!
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
