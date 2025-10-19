'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, User, Phone, FileText, ChevronLeft } from 'lucide-react';

export default function GuestAppointmentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        appointmentDate: '',
        timeSlot: '',
        consultationType: 'general',
        symptoms: ''
    });
    const [errors, setErrors] = useState({});

    const timeSlots = [
        '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
        '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
        '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        // Validation
        if (!formData.fullName || !formData.phone || !formData.appointmentDate || !formData.timeSlot) {
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

            // Show success message with booking ID
            alert(`Appointment booked successfully!\nYour Booking ID: ${data.appointment.bookingId}\nPlease save this ID for future reference.`);
            
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

                    <form onSubmit={handleSubmit} className="p-6">
                        {errors.general && (
                            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
                                {errors.general}
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
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

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                            {/* Appointment Date */}
                            <div>
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
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Time Slot */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Time Slot *
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <select
                                        name="timeSlot"
                                        value={formData.timeSlot}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select a time</option>
                                        {timeSlots.map(slot => (
                                            <option key={slot} value={slot}>{slot}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Consultation Type */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Consultation Type *
                            </label>
                            <select
                                name="consultationType"
                                value={formData.consultationType}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="general">General Checkup</option>
                                <option value="follow-up">Follow-up</option>
                                <option value="specialist">Specialist Consultation</option>
                                <option value="emergency">Emergency</option>
                            </select>
                        </div>

                        {/* Symptoms */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Symptoms/Reason for Visit
                            </label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                                <textarea
                                    name="symptoms"
                                    value={formData.symptoms}
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
                            Consider <a href="/signup" className="text-blue-600 hover:underline">creating an account</a> for full access.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}