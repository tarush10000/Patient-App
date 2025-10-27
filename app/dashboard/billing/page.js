'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import BillCard from '@/components/BillCard';
import BillDetailModal from '@/components/BillDetailModal';
import { api } from '@/lib/api';

export default function BillingPage() {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBill, setSelectedBill] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Clinic information - you can move this to environment variables or database
    const clinicInfo = {
        name: "Dr. Anjali's Women Wellness Center",
        address: "Plot No. 22, Harsh Commercial Park, Garh Road, Meerut",
        phone: "7300843777, 9837033107",
        email: "www.dranjaligupta.in",
        doctorName: "Dr. Anjali Gupta",
        doctorQualification: "MBBS, DNB (Gold Medalist), Obstetrician Gynecologist, Laparoscopic Surgeon & Cosmetic Gynaecologist"
    };

    useEffect(() => {
        fetchBills();
    }, []);

    const fetchBills = async () => {
        try {
            const response = await api.getBills();
            const filtered = (response.bills || []).filter(b => b.appointmentId?.status === 'seen');
            setBills(filtered);
        } catch (error) {
            console.error('Error fetching bills:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBillClick = (bill) => {
        setSelectedBill(bill);
        setShowDetailModal(true);
    };

    const handleCloseModal = () => {
        setShowDetailModal(false);
        setSelectedBill(null);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-4xl mx-auto p-4 pb-24">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Billing History</h2>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : bills.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📄</div>
                        <p className="text-gray-600 text-lg">No billing records found</p>
                        <p className="text-gray-500 text-sm mt-2">Your bills will appear here after your appointments</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bills.map(bill => (
                            <BillCard
                                key={bill._id}
                                bill={bill}
                                onClick={() => handleBillClick(bill)}
                            />
                        ))}
                    </div>
                )}
            </main>

            <BottomNav activeScreen="billing" />

            {/* Bill Detail Modal */}
            {showDetailModal && selectedBill && (
                <BillDetailModal
                    bill={selectedBill}
                    clinicInfo={clinicInfo}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
}