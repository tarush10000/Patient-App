'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import BillCard from '@/components/BillCard';
import { api } from '@/lib/api';

export default function BillingPage() {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBills();
    }, []);

    const fetchBills = async () => {
        try {
            const response = await api.getBills();
            setBills(response.bills || []);
        } catch (error) {
            console.error('Error fetching bills:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayBill = async (billId) => {
        try {
            await api.updateBill(billId, { status: 'paid', paidDate: new Date() });
            fetchBills();
        } catch (error) {
            console.error('Error updating bill:', error);
        }
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
                        <p className="text-gray-600">No billing records found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bills.map(bill => (
                            <BillCard
                                key={bill._id}
                                bill={bill}
                                onPay={handlePayBill}
                            />
                        ))}
                    </div>
                )}
            </main>

            <BottomNav activeScreen="billing" />
        </div>
    );
}
