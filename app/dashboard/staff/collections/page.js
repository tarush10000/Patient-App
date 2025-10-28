'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, TrendingUp, Calendar, Filter, Download, CreditCard, Wallet, Smartphone, Globe } from 'lucide-react';
import Header from '@/components/Header';
import StaffBottomNav from '@/components/StaffBottomNav';
import CollectionChart from '@/components/CollectionChart';
import CollectionTable from '@/components/CollectionTable';
import CollectionStats from '@/components/CollectionStats';
import CreateBillModal from '@/components/CreateBillModal';
import BillDetailModal from '@/components/BillDetailModal';
import { api } from '@/lib/api';

export default function CollectionsPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(null);
    const [bills, setBills] = useState([]);
    const [filteredBills, setFilteredBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedBillForDetail, setSelectedBillForDetail] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBill, setEditingBill] = useState(null);

    // Filters
    const [dateFilter, setDateFilter] = useState('today'); // today, week, month, custom
    const [paymentModeFilter, setPaymentModeFilter] = useState('all'); // all, cash, UPI, card, online
    const [statusFilter, setStatusFilter] = useState('all'); // all, paid, unpaid
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Stats
    const [stats, setStats] = useState({
        totalCollection: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        cashCollection: 0,
        upiCollection: 0,
        cardCollection: 0,
        onlineCollection: 0,
        todayCollection: 0,
        weekCollection: 0,
        monthCollection: 0
    });

    const clinicInfo = {
        name: "Dr. Anjali Women Wellness Center",
        address: "123, Medical Street, City - 123456",
        phone: "+91 7300843777, +91 9837033107",
        email: "anjali.agarwal0@gmail.com",
        doctorName: "Anjali Gupta",
        doctorQualification: "MBBS, MD (Obstetrics & Gynecology)"
    };

    useEffect(() => {
        checkAuth();
        fetchBills();
    }, []);

    useEffect(() => {
        if (bills.length > 0 || !loading) {
            applyFilters();
        }
    }, [bills, dateFilter, paymentModeFilter, statusFilter, startDate, endDate]);

    useEffect(() => {
        if (!loading) {
            calculateStats();
        }
    }, [filteredBills]);

    const handleViewBillDetail = (bill) => {
        setSelectedBillForDetail(bill);
        setShowDetailModal(true);
    };

    // Handler for editing bill (when clicking edit button)
    const handleEditBill = (bill) => {
        console.log('Editing bill:', bill);
        setEditingBill(bill);
        setIsModalOpen(true);
    };

    const handleSaveBill = async (billData) => {
        try {
            setLoading(true);
            // setError(null);

            if (editingBill) {
                // ✅ Update existing bill
                const response = await api.updateBill(editingBill._id, billData);
                console.log(response.message);
            } else {
                // ✅ Create new bill
                const response = await api.createBill(billData);
                console.log(response.message);
            }

            // Refresh bills list
            await fetchBills();

            // Close modal
            handleCloseModal();
        } catch (err) {
            console.error('Error saving bill:', err);
            // setError(err.message);
            alert(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBill(null);  // Clear editing state
    };

    const checkAuth = () => {
        const token = api.getToken();
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.role !== 'admin') {
                router.push('/dashboard');
                return;
            }
            setCurrentUser(payload);
        } catch (error) {
            console.error('Error checking auth:', error);
            router.push('/login');
        }
    };

    const fetchBills = async () => {
        try {
            setLoading(true);
            const response = await api.getBills();
            const fetchedBills = response.bills || [];
            setBills(fetchedBills);
            // Set filtered bills initially to all bills
            setFilteredBills(fetchedBills);
        } catch (error) {
            console.error('Error fetching bills:', error);
            setBills([]);
            setFilteredBills([]);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        if (!bills || bills.length === 0) {
            setFilteredBills([]);
            return;
        }

        let filtered = [...bills];

        // Date filter
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (dateFilter === 'today') {
            filtered = filtered.filter(bill => {
                const billDate = new Date(bill.billDate);
                return billDate >= today;
            });
        } else if (dateFilter === 'week') {
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            filtered = filtered.filter(bill => {
                const billDate = new Date(bill.billDate);
                return billDate >= weekAgo;
            });
        } else if (dateFilter === 'month') {
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            filtered = filtered.filter(bill => {
                const billDate = new Date(bill.billDate);
                return billDate >= monthAgo;
            });
        } else if (dateFilter === 'custom' && startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter(bill => {
                const billDate = new Date(bill.billDate);
                return billDate >= start && billDate <= end;
            });
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(bill => bill.status === statusFilter);
        }

        setFilteredBills(filtered);
    };

    const parseBillItems = (itemsString) => {
        const itemsArray = itemsString.split(', ');
        const parsed = [];

        for (let i = 0; i < itemsArray.length; i += 3) {
            if (itemsArray[i] && itemsArray[i + 1] && itemsArray[i + 2]) {
                parsed.push({
                    service: itemsArray[i],
                    amount: parseFloat(itemsArray[i + 1]),
                    paymentMethod: itemsArray[i + 2]
                });
            }
        }

        return parsed;
    };

    const calculateStats = () => {
        if (!filteredBills || filteredBills.length === 0) {
            setStats({
                totalCollection: 0,
                paidAmount: 0,
                unpaidAmount: 0,
                cashCollection: 0,
                upiCollection: 0,
                cardCollection: 0,
                onlineCollection: 0,
                todayCollection: 0,
                weekCollection: 0,
                monthCollection: 0
            });
            return;
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        let totalCollection = 0;
        let paidAmount = 0;
        let unpaidAmount = 0;
        let cashCollection = 0;
        let upiCollection = 0;
        let cardCollection = 0;
        let onlineCollection = 0;
        let todayCollection = 0;
        let weekCollection = 0;
        let monthCollection = 0;

        filteredBills.forEach(bill => {
            const billDate = new Date(bill.billDate);
            const items = bill.getParsedItems ? bill.getParsedItems() : parseBillItems(bill.items);

            totalCollection += bill.totalAmount;

            if (bill.status === 'paid') {
                paidAmount += bill.totalAmount;

                // Calculate by payment mode
                items.forEach(item => {
                    const method = item.paymentMethod.toLowerCase();
                    if (method === 'cash') cashCollection += item.amount;
                    else if (method === 'upi') upiCollection += item.amount;
                    else if (method === 'card') cardCollection += item.amount;
                    else if (method === 'online') onlineCollection += item.amount;
                    // if(paymentModeFilter === 'all'){
                    // }else{
                    //     if (method === 'cash' && paymentModeFilter == 'cash') cashCollection += item.amount;
                    //     else if (method === 'upi' && paymentModeFilter == 'upi' ) upiCollection += item.amount;
                    //     else if (method === 'card' && paymentModeFilter == 'card') cardCollection += item.amount;
                    //     else if (method === 'online' && paymentModeFilter == 'online') onlineCollection += item.amount;
                    // }
                });
            } else {
                unpaidAmount += bill.totalAmount;
            }

            // Time-based collections
            if (billDate >= today) {
                todayCollection += bill.totalAmount;
            }
            if (billDate >= weekAgo) {
                weekCollection += bill.totalAmount;
            }
            if (billDate >= monthAgo) {
                monthCollection += bill.totalAmount;
            }
        });

        setStats({
            totalCollection,
            paidAmount,
            unpaidAmount,
            cashCollection,
            upiCollection,
            cardCollection,
            onlineCollection,
            todayCollection,
            weekCollection,
            monthCollection
        });
    };

    const exportToCSV = () => {
        const csvData = filteredBills.map(bill => {
            const items = bill.getParsedItems ? bill.getParsedItems() : parseBillItems(bill.items);
            return {
                Date: new Date(bill.billDate).toLocaleDateString(),
                Patient: bill.appointmentId?.fullName || 'N/A',
                Amount: bill.totalAmount,
                Status: bill.status,
                Items: items.map(item => `${item.service} (${item.paymentMethod})`).join('; ')
            };
        });

        const headers = Object.keys(csvData[0]).join(',');
        const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
        const csv = `${headers}\n${rows}`;

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `collections_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const resetFilters = () => {
        setDateFilter('today');
        setPaymentModeFilter('all');
        setStatusFilter('all');
        setStartDate('');
        setEndDate('');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-7xl mx-auto p-4 pb-24">
                {/* Page Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Collections Dashboard</h2>
                        <p className="text-sm text-gray-600 mt-1">Comprehensive view of all financial collections</p>
                    </div>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                        <Download size={18} />
                        Export CSV
                    </button>
                </div>

                {/* Summary Stats */}
                <CollectionStats stats={stats} />

                {/* Filters Section */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter size={20} className="text-gray-600" />
                        <h3 className="text-lg font-bold text-gray-800">Filters</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Date Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Time Period
                            </label>
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                            >
                                <option value="today">Today</option>
                                <option value="week">Last 7 Days</option>
                                <option value="month">Last 30 Days</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>

                        {/* Payment Mode Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payment Mode
                            </label>
                            <select
                                value={paymentModeFilter}
                                onChange={(e) => setPaymentModeFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                            >
                                <option value="all">All Modes</option>
                                <option value="cash">Cash</option>
                                <option value="upi">UPI</option>
                                <option value="card">Card</option>
                                <option value="online">Online</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payment Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                            >
                                <option value="all">All Status</option>
                                <option value="paid">Paid</option>
                                <option value="unpaid">Unpaid</option>
                            </select>
                        </div>

                        {/* Reset Button */}
                        <div className="flex items-end">
                            <button
                                onClick={resetFilters}
                                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>

                    {/* Custom Date Range */}
                    {dateFilter === 'custom' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Charts Section */}
                <CollectionChart bills={filteredBills} dateFilter={dateFilter} paymentModeFilter={paymentModeFilter} />

                {/* Detailed Table */}
                <CollectionTable
                    bills={filteredBills}
                    onViewBill={handleViewBillDetail}  // For clicking on bill card
                    onEditBill={handleEditBill}        // For clicking edit button
                />

                {showDetailModal && selectedBillForDetail && (
                    <BillDetailModal
                        bill={selectedBillForDetail}
                        clinicInfo={clinicInfo}
                        onClose={() => {
                            setShowDetailModal(false);
                            setSelectedBillForDetail(null);
                        }}
                    />
                )}

                <CreateBillModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveBill}
                    editingBill={editingBill}  // Pass the editing bill
                />
            </main>

            <StaffBottomNav activeScreen="collections" userRole={currentUser?.role} />
        </div>
    );
}