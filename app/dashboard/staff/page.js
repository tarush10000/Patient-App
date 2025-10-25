'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, Clock, Trash2, CheckCircle, X, XCircle, DollarSign, ClockIcon, Edit, Plus } from 'lucide-react';
import Header from '@/components/Header';
import StaffBottomNav from '@/components/StaffBottomNav';
import BookAppointmentForm from '@/components/BookAppointmentForm';
import { api } from '@/lib/api';

export default function StaffDashboardPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(null);
    const [todayAppointments, setTodayAppointments] = useState([]);
    const [stats, setStats] = useState({
        todayTotal: 0,
        todayCompleted: 0,
        todayPending: 0,
        totalPatients: 0
    });
    const [loading, setLoading] = useState(true);
    const [showBillModal, setShowBillModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);

    useEffect(() => {
        checkAuth();
        fetchDashboardData();
    }, []);

    const checkAuth = () => {
        const token = api.getToken();
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.role !== 'admin' && payload.role !== 'reception') {
                router.push('/dashboard');
                return;
            }
            setCurrentUser(payload);
        } catch (error) {
            console.error('Error checking auth:', error);
            router.push('/login');
        }
    };

    const fetchDashboardData = async () => {
        try {
            const [appointmentsRes, usersRes] = await Promise.all([
                api.getAppointments(),
                api.getUsers()
            ]);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const todayApts = appointmentsRes.appointments?.filter(apt => {
                const aptDate = new Date(apt.appointmentDate);
                return aptDate >= today && aptDate < tomorrow;
            }) || [];

            setTodayAppointments(todayApts.sort((a, b) => {
                const timeA = a.timeSlot.split(' - ')[0];
                const timeB = b.timeSlot.split(' - ')[0];
                return timeA.localeCompare(timeB);
            }));

            const totalPatients = usersRes.users?.filter(u => u.role === 'patient').length || 0;

            setStats({
                todayTotal: todayApts.length,
                todayCompleted: todayApts.filter(apt => apt.status === 'seen').length,
                todayPending: todayApts.filter(apt => apt.status === 'upcoming').length,
                totalPatients
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (appointmentId, newStatus) => {
        try {
            await api.updateAppointment(appointmentId, { status: newStatus });
            if (newStatus === 'seen') {
                alert('✅ Patient marked as seen. Thank you message sent via WhatsApp.');
            }
            fetchDashboardData();
        } catch (error) {
            alert('Failed to update appointment status: ' + error.message);
        }
    };

    const handleDeleteAppointment = async (appointmentId) => {
        if (!currentUser || currentUser.role !== 'admin') {
            alert('Only admins can delete appointments');
            return;
        }

        if (!confirm('Are you sure you want to delete this appointment?')) {
            return;
        }

        try {
            await api.deleteAppointment(appointmentId);
            fetchDashboardData();
        } catch (error) {
            alert('Failed to delete appointment: ' + error.message);
        }
    };

    const handleDelayAppointment = async (appointmentId, minutes) => {
        if (!confirm(`Delay this appointment by ${minutes} minutes? The patient will be notified via WhatsApp.`)) {
            return;
        }

        try {
            await api.delayAppointment(appointmentId, minutes);
            fetchDashboardData();
            alert(`✅ Appointment delayed by ${minutes} minutes. Patient has been notified.`);
        } catch (error) {
            alert('Failed to delay appointment: ' + error.message);
        }
    };

    const handleAddBill = (appointment) => {
        setSelectedAppointment(appointment);
        setShowBillModal(true);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'upcoming':
                return 'bg-blue-100 text-blue-700';
            case 'seen':
                return 'bg-green-100 text-green-700';
            case 'cancelled':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
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

            <main className="max-w-6xl mx-auto p-4 pb-24">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {currentUser?.role === 'admin' ? 'Admin' : 'Reception'} Dashboard
                        </h2>
                        <p className="text-gray-600 mt-1">Today's Schedule</p>
                    </div>
                    <button
                        onClick={() => setShowBookingModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Add Appointment
                    </button>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar size={20} />
                            <p className="text-sm font-medium opacity-90">Total Today</p>
                        </div>
                        <p className="text-3xl font-bold">{stats.todayTotal}</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle size={20} />
                            <p className="text-sm font-medium opacity-90">Completed</p>
                        </div>
                        <p className="text-3xl font-bold">{stats.todayCompleted}</p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock size={20} />
                            <p className="text-sm font-medium opacity-90">Pending</p>
                        </div>
                        <p className="text-3xl font-bold">{stats.todayPending}</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Users size={20} />
                            <p className="text-sm font-medium opacity-90">Patients</p>
                        </div>
                        <p className="text-3xl font-bold">{stats.totalPatients}</p>
                    </div>
                </div>

                {/* Today's Appointments */}
                <h3 className="text-xl font-bold text-gray-800 mb-4">Today's Appointments</h3>

                {todayAppointments.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg">No appointments scheduled for today</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {todayAppointments.map((apt) => (
                            <div key={apt._id} className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition">
                                <div className="flex flex-col lg:flex-row justify-between gap-4">
                                    {/* Appointment Info */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="font-bold text-lg text-gray-800">{apt.fullName}</h4>
                                                <p className="text-sm text-gray-600">📞 {apt.phone}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(apt.status)}`}>
                                                {apt.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Clock size={16} className="text-blue-600" />
                                                <span className="font-semibold">{apt.timeSlot}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Calendar size={16} className="text-green-600" />
                                                <span>{apt.consultationType}</span>
                                            </div>
                                        </div>

                                        {apt.additionalMessage && (
                                            <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                                💬 {apt.additionalMessage}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2">
                                        {apt.status === 'upcoming' && (
                                            <>
                                                {/* Main Actions */}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleStatusUpdate(apt._id, 'seen')}
                                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                                                    >
                                                        <CheckCircle size={16} />
                                                        Mark Seen
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(apt._id, 'cancelled')}
                                                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium"
                                                    >
                                                        <XCircle size={16} />
                                                        Cancel
                                                    </button>
                                                </div>

                                                {/* Delay Options */}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleDelayAppointment(apt._id, 15)}
                                                        className="flex-1 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition text-xs font-medium border border-yellow-200"
                                                        title="Delay by 15 minutes"
                                                    >
                                                        <ClockIcon size={14} className="inline mr-1" />
                                                        +15 min
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelayAppointment(apt._id, 30)}
                                                        className="flex-1 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition text-xs font-medium border border-orange-200"
                                                        title="Delay by 30 minutes"
                                                    >
                                                        <ClockIcon size={14} className="inline mr-1" />
                                                        +30 min
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelayAppointment(apt._id, 60)}
                                                        className="flex-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-xs font-medium border border-red-200"
                                                        title="Delay by 1 hour"
                                                    >
                                                        <ClockIcon size={14} className="inline mr-1" />
                                                        +1 hr
                                                    </button>
                                                </div>

                                                {/* Add Bill Button */}
                                                <button
                                                    onClick={() => handleAddBill(apt)}
                                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-medium border border-blue-200"
                                                >
                                                    <DollarSign size={16} />
                                                    Add Bill
                                                </button>
                                            </>
                                        )}

                                        {/* Admin Delete */}
                                        {currentUser?.role === 'admin' && (
                                            <button
                                                onClick={() => handleDeleteAppointment(apt._id)}
                                                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                                                title="Delete (Admin Only)"
                                            >
                                                <Trash2 size={16} />
                                                Delete
                                            </button>
                                        )}

                                        {/* Status Message for Non-Upcoming */}
                                        {currentUser?.role === 'reception' && apt.status !== 'upcoming' && (
                                            <div className="text-xs text-gray-400 text-center mt-2 p-2 bg-gray-50 rounded">
                                                {apt.status === 'seen' ? 'Completed ✓' : 'Cancelled ✗'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Bill Modal */}
            {showBillModal && (
                <BillModal
                    appointment={selectedAppointment}
                    onClose={() => {
                        setShowBillModal(false);
                        setSelectedAppointment(null);
                    }}
                    onSuccess={() => {
                        setShowBillModal(false);
                        setSelectedAppointment(null);
                        fetchDashboardData();
                    }}
                />
            )}

            {showBookingModal && (
                <BookAppointmentForm
                    onSuccess={() => {
                        setShowBookingModal(false);
                        fetchDashboardData(); // or fetchAllAppointments() for appointments page
                        alert('✅ Appointment created successfully!');
                    }}
                    onCancel={() => setShowBookingModal(false)}
                />
            )}

            <StaffBottomNav activeScreen="home" userRole={currentUser?.role} />
        </div>
    );
}

// Bill Modal Component
function BillModal({ appointment, onClose, onSuccess }) {
    const [billItems, setBillItems] = useState([]);
    const [existingBills, setExistingBills] = useState([]);
    const [newItem, setNewItem] = useState({
        service: '',
        amount: '',
        paymentMethod: 'Cash'
    });
    const [editingIndex, setEditingIndex] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingBills, setLoadingBills] = useState(true);
    const [isPaid, setIsPaid] = useState(true); // Default to paid

    const quickServices = [
        { name: 'Consultation', amount: 1000, paymentMethod: 'UPI' },
        { name: 'Consultation', amount: 1000, paymentMethod: 'Cash' },
        { name: 'Tests', amount: 1000, paymentMethod: 'Cash' },
        { name: 'Tests', amount: 1000, paymentMethod: 'UPI' }
    ];

    const paymentMethods = ['Cash', 'UPI', 'Card', 'Online'];

    // Load existing bills for this appointment
    useEffect(() => {
        fetchExistingBills();
    }, []);

    const fetchExistingBills = async () => {
        try {
            const response = await api.getBills();
            const appointmentBills = response.bills?.filter(
                bill => bill.appointmentId?._id === appointment._id || bill.appointmentId === appointment._id
            ) || [];
            setExistingBills(appointmentBills);
        } catch (error) {
            console.error('Error fetching bills:', error);
        } finally {
            setLoadingBills(false);
        }
    };

    const addItem = () => {
        if (!newItem.service || !newItem.amount) {
            alert('Please fill service and amount');
            return;
        }

        if (editingIndex !== null) {
            const updated = [...billItems];
            updated[editingIndex] = { ...newItem };
            setBillItems(updated);
            setEditingIndex(null);
        } else {
            setBillItems([...billItems, { ...newItem }]);
        }

        setNewItem({ service: '', amount: '', paymentMethod: 'Cash' });
    };

    const addQuickService = (service) => {
        setBillItems([...billItems, {
            service: service.name,
            amount: service.amount,
            paymentMethod: service.paymentMethod
        }]);
    };

    const editItem = (index) => {
        setNewItem(billItems[index]);
        setEditingIndex(index);
    };

    const removeItem = (index) => {
        setBillItems(billItems.filter((_, i) => i !== index));
        if (editingIndex === index) {
            setEditingIndex(null);
            setNewItem({ service: '', amount: '', paymentMethod: 'Cash' });
        }
    };

    const getTotalAmount = () => {
        return billItems.reduce((sum, item) => sum + Number(item.amount), 0);
    };

    const handleSubmit = async () => {
        if (billItems.length === 0) {
            alert('Please add at least one item');
            return;
        }

        setLoading(true);
        try {
            const billString = billItems
                .map(item => `${item.service}, ${item.amount}, ${item.paymentMethod}`)
                .join(', ');

            const patientId = appointment.patientId?._id
                || appointment.patientId
                || appointment.userId?._id
                || appointment.userId;

            if (!patientId) {
                throw new Error('Patient ID not found in appointment data');
            }

            await api.createBill({
                patientId: patientId,
                appointmentId: appointment._id,
                items: billString,
                totalAmount: getTotalAmount(),
                status: isPaid ? 'paid' : 'unpaid',
                paidDate: isPaid ? new Date() : undefined
            });

            alert('✅ Bill created successfully!');
            onSuccess();
        } catch (error) {
            console.error('Bill creation error:', error);
            alert('Failed to create bill: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Add Bill - {appointment.fullName}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                {/* Existing Bills Section */}
                {loadingBills ? (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Loading existing bills...</p>
                    </div>
                ) : existingBills.length > 0 && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">📋 Existing Bills for this Appointment:</h4>
                        {existingBills.map((bill, idx) => (
                            <div key={bill._id} className="mb-2 p-3 bg-white rounded border border-blue-100">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-800">Bill #{idx + 1}</p>
                                        <p className="text-xs text-gray-600 mt-1">
                                            {bill.items}
                                        </p>
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="font-semibold text-gray-900">₹{bill.totalAmount}</p>
                                        <span className={`text-xs px-2 py-1 rounded-full ${bill.status === 'paid'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                            }`}>
                                            {bill.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <p className="text-xs text-blue-700 mt-2">💡 Adding items below will create a new bill for this appointment.</p>
                    </div>
                )}

                {/* Quick Add Services */}
                <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Quick Add:</p>
                    <div className="grid grid-cols-2 gap-2">
                        {quickServices.map((service, idx) => (
                            <button
                                key={idx}
                                onClick={() => addQuickService(service)}
                                className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm border border-blue-200 text-left"
                            >
                                <div className="font-medium">{service.name}</div>
                                <div className="text-xs">₹{service.amount} • {service.paymentMethod}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Manual Add Item */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                        {editingIndex !== null ? 'Edit Item:' : 'Add Custom Item:'}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <input
                            type="text"
                            placeholder="Service"
                            value={newItem.service}
                            onChange={(e) => setNewItem({ ...newItem, service: e.target.value })}
                            className="px-3 py-2 border rounded-lg text-gray-600"
                        />
                        <input
                            type="number"
                            placeholder="Amount"
                            value={newItem.amount}
                            onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                            className="px-3 py-2 border rounded-lg text-gray-600"
                        />
                        <select
                            value={newItem.paymentMethod}
                            onChange={(e) => setNewItem({ ...newItem, paymentMethod: e.target.value })}
                            className="px-3 py-2 border rounded-lg text-gray-600"
                        >
                            {paymentMethods.map(method => (
                                <option key={method} value={method}>{method}</option>
                            ))}
                        </select>
                        <button
                            onClick={addItem}
                            className={`px-4 py-2 ${editingIndex !== null ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg`}
                        >
                            {editingIndex !== null ? 'Update' : 'Add'}
                        </button>
                    </div>
                    {editingIndex !== null && (
                        <button
                            onClick={() => {
                                setEditingIndex(null);
                                setNewItem({ service: '', amount: '', paymentMethod: 'Cash' });
                            }}
                            className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>

                {/* Bill Items Table */}
                <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">New Bill Items:</p>
                    {billItems.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-8">No items added yet</p>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-gray-700">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-sm font-semibold">Service</th>
                                        <th className="px-4 py-2 text-right text-sm font-semibold">Amount</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold">Method</th>
                                        <th className="px-4 py-2 text-center text-sm font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {billItems.map((item, idx) => (
                                        <tr key={idx} className="border-t">
                                            <td className="px-4 py-2 text-sm">{item.service}</td>
                                            <td className="px-4 py-2 text-sm text-right">₹{item.amount}</td>
                                            <td className="px-4 py-2 text-sm">{item.paymentMethod}</td>
                                            <td className="px-4 py-2 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => editItem(idx)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => removeItem(idx)}
                                                        className="text-red-600 hover:text-red-800"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="border-t bg-blue-50 font-bold">
                                        <td className="px-4 py-3 text-sm">TOTAL</td>
                                        <td className="px-4 py-3 text-sm text-right">₹{getTotalAmount()}</td>
                                        <td className="px-4 py-3 text-sm"></td>
                                        <td className="px-4 py-3 text-sm"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Payment Status Toggle */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isPaid}
                            onChange={(e) => setIsPaid(e.target.checked)}
                            className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-700">
                            Mark as Paid
                            {isPaid && <span className="ml-2 text-green-600">✓</span>}
                        </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-2 ml-8">
                        {isPaid ? 'Bill will be marked as paid immediately' : 'Bill will be saved as unpaid'}
                    </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
                        disabled={loading || billItems.length === 0}
                    >
                        {loading ? 'Creating...' : `Create Bill (${isPaid ? 'Paid' : 'Unpaid'})`}
                    </button>
                </div>
            </div>
        </div>
    );
}