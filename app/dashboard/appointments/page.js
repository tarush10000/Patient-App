'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import AppointmentsList from '@/components/AppointmentsList';
import BookAppointmentForm from '@/components/BookAppointmentForm';

export default function AppointmentsPage() {
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleBookingSuccess = () => {
        setShowBookingModal(false);
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-4xl mx-auto p-4 pb-24">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Appointments</h2>
                    <button
                        onClick={() => setShowBookingModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                        + Book New
                    </button>
                </div>

                <AppointmentsList key={refreshKey} />
            </main>

            <BottomNav activeScreen="appointments" />

            {showBookingModal && (
                <BookAppointmentForm
                    onSuccess={handleBookingSuccess}
                    onCancel={() => setShowBookingModal(false)}
                />
            )}
        </div>
    );
}