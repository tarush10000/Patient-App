'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, Clock, Trash2, CheckCircle, X, XCircle, DollarSign, ClockIcon, Edit, Plus, AlertTriangle } from 'lucide-react';
import Header from '@/components/Header';
import StaffBottomNav from '@/components/StaffBottomNav';
import BookAppointmentForm from '@/components/BookAppointmentForm';
import EmergencyAppointmentModal from '@/components/EmergencyAppointmentModal';
import { api } from '@/lib/api';

export default function StaffDashboardPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(null);
    const [todayAppointments, setTodayAppointments] = useState([]);
    const [groupedAppointments, setGroupedAppointments] = useState({});
    const [emergencyAppointments, setEmergencyAppointments] = useState([]);
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
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);

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

            // Separate regular and emergency appointments
            const regularApts = todayApts.filter(apt => !apt.isEmergency);
            const emergencyApts = todayApts.filter(apt => apt.isEmergency);

            // Helper function to convert time slot to minutes for sorting
            const getSlotMinutes = (timeSlot) => {
                const [time, period] = timeSlot.split(' - ')[0].split(' ');
                const [hours, minutes] = time.split(':').map(Number);

                let totalMinutes = hours * 60 + minutes;
                if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
                if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;

                return totalMinutes;
            };

            // Sort regular appointments by time slot
            const sorted = regularApts.sort((a, b) => {
                return getSlotMinutes(a.timeSlot) - getSlotMinutes(b.timeSlot);
            });

            setTodayAppointments(sorted);
            setEmergencyAppointments(emergencyApts);

            // Group regular appointments by time slot (excluding emergency)
            const grouped = sorted.reduce((acc, apt) => {
                const slot = apt.timeSlot;
                if (!acc[slot]) {
                    acc[slot] = [];
                }
                acc[slot].push(apt);
                return acc;
            }, {});

            Object.keys(grouped).forEach(slot => {
                grouped[slot].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            });

            setGroupedAppointments(grouped);

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

        if (!confirm('Are you sure you want to delete this appointment?')) return;

        try {
            await api.deleteAppointment(appointmentId);
            fetchDashboardData();
        } catch (error) {
            alert('Failed to delete appointment: ' + error.message);
        }
    };

    const handleDelayAppointment = async (appointmentId, minutes) => {
        if (!confirm(`Delay by ${minutes} minutes? Patient will be notified via WhatsApp.`)) return;

        try {
            await api.delayAppointment(appointmentId, minutes);
            fetchDashboardData();
            alert(`✅ Appointment delayed by ${minutes} minutes. Patient notified.`);
        } catch (error) {
            alert('Failed to delay appointment: ' + error.message);
        }
    };

    const handleAddBill = (appointment) => {
        setSelectedAppointment(appointment);
        setShowBillModal(true);
    };

    const calculateApproxTime = (slotTime, index, appointment) => {
        const [time, period] = slotTime.split(' - ')[0].split(' ');
        const [hours, minutes] = time.split(':').map(Number);

        let totalMinutes = hours * 60 + minutes + (index * 15);
        if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
        if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;

        // Add accumulated delay
        totalMinutes += (appointment.delayMinutes || 0);

        const newHours = Math.floor(totalMinutes / 60) % 24;
        const newMinutes = totalMinutes % 60;
        const newPeriod = newHours >= 12 ? 'PM' : 'AM';
        const displayHours = newHours > 12 ? newHours - 12 : (newHours === 0 ? 12 : newHours);

        return `${displayHours}:${newMinutes.toString().padStart(2, '0')} ${newPeriod}`;
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
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">
                            {currentUser?.role === 'admin' ? 'Admin' : 'Reception'} Dashboard
                        </h2>
                        <p className="text-gray-600 mt-1">Today's Schedule</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowEmergencyModal(true)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition flex items-center gap-2"
                        >
                            <AlertTriangle size={20} />
                            <span className="hidden sm:inline">Emergency</span>
                        </button>
                        <button
                            onClick={() => setShowBookingModal(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            <Plus size={20} />
                            <span className="hidden sm:inline">Add Appointment</span>
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
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
                </div>

                {/* Today's Appointments - Grouped by Time Slot */}
                <h3 className="text-xl font-bold text-gray-800 mb-4">Today's Appointments by Time Slot</h3>

                {todayAppointments.length === 0 && emergencyAppointments.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg">No appointments scheduled for today</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Regular Appointments by Time Slot */}
                        {Object.entries(groupedAppointments).map(([timeSlot, appointments]) => (
                            <div key={timeSlot} className="bg-white rounded-xl shadow-md overflow-hidden">
                                {/* Time Slot Header */}
                                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <Clock size={20} />
                                            <h4 className="font-bold text-lg">{timeSlot}</h4>
                                        </div>
                                        <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-semibold text-blue-300">
                                            {appointments.length} {appointments.length === 1 ? 'patient' : 'patients'}
                                        </span>
                                    </div>
                                </div>

                                {/* Appointments in this slot */}
                                <div className="divide-y divide-gray-200">
                                    {appointments.map((apt, index) => (
                                        <div key={apt._id} className="p-5 hover:bg-gray-50 transition">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-bold text-sm">
                                                            {index + 1}
                                                        </span>
                                                        <div>
                                                            <h5 className="font-bold text-gray-800 text-lg">{apt.fullName}</h5>
                                                            <p className="text-sm text-gray-600">{apt.phone}</p>
                                                        </div>
                                                    </div>

                                                    <div className="ml-11 space-y-1">
                                                        <p className="text-sm text-gray-600">
                                                            <span className="font-semibold">Type:</span> {apt.consultationType?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                        </p>
                                                        <p className="text-sm text-blue-600 font-medium">
                                                            Approx: {calculateApproxTime(apt.timeSlot, index, apt)}
                                                        </p>
                                                        {apt.additionalMessage && (
                                                            <p className="text-sm text-gray-600 mt-2">
                                                                <span className="font-semibold">Note:</span> {apt.additionalMessage}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${apt.status === 'upcoming' ? 'bg-orange-100 text-orange-700' :
                                                                apt.status === 'seen' ? 'bg-green-100 text-green-700' :
                                                                    'bg-red-100 text-red-700'
                                                                }`}>
                                                                {apt.status === 'upcoming' ? '⏳ Upcoming' :
                                                                    apt.status === 'seen' ? '✅ Seen' :
                                                                        '❌ Cancelled'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex flex-col gap-2 min-w-fit">
                                                    {apt.status === 'upcoming' && currentUser?.role === 'admin' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusUpdate(apt._id, 'seen')}
                                                                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                                                            >
                                                                <CheckCircle size={16} />
                                                                Mark Seen
                                                            </button>
                                                        </>
                                                    )}

                                                    {apt.status === 'upcoming' && (
                                                        <>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleDelayAppointment(apt._id, 15)}
                                                                    className="flex items-center justify-center gap-1 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition text-xs font-medium border border-yellow-200"
                                                                    title="Delay by 15 minutes"
                                                                >
                                                                    <ClockIcon size={14} />
                                                                    +15
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelayAppointment(apt._id, 30)}
                                                                    className="flex items-center justify-center gap-1 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition text-xs font-medium border border-yellow-200"
                                                                    title="Delay by 30 minutes"
                                                                >
                                                                    <ClockIcon size={14} />
                                                                    +30
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelayAppointment(apt._id, 60)}
                                                                    className="flex items-center justify-center gap-1 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition text-xs font-medium border border-yellow-200"
                                                                    title="Delay by 1 hour"
                                                                >
                                                                    <ClockIcon size={14} />
                                                                    +1hr
                                                                </button>
                                                            </div>
                                                            <button
                                                                onClick={() => handleAddBill(apt)}
                                                                className="flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition text-xs font-medium border border-green-200"
                                                                title="Add Bill"
                                                            >
                                                                <DollarSign size={14} />
                                                                Bill
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(apt._id, 'cancelled')}
                                                                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium border border-red-200"
                                                            >
                                                                <XCircle size={16} />
                                                                Cancel
                                                            </button>
                                                        </>
                                                    )}

                                                    {apt.status === 'seen' && (
                                                        <>
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
                            </div>
                        ))}

                        {/* Emergency Appointments Section */}
                        {emergencyAppointments.length > 0 && (
                            <div className="bg-red-50 border-2 border-red-200 rounded-xl shadow-md overflow-hidden">
                                <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-5 py-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <AlertTriangle size={20} />
                                            <h4 className="font-bold text-lg">Emergency Appointments</h4>
                                        </div>
                                        <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-semibold text-blue-300">
                                            {emergencyAppointments.length} {emergencyAppointments.length === 1 ? 'patient' : 'patients'}
                                        </span>
                                    </div>
                                </div>

                                <div className="divide-y divide-red-200 bg-white">
                                    {emergencyAppointments.map((apt) => (
                                        <div key={apt._id} className="p-5 hover:bg-red-50 transition">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="flex items-center justify-center w-8 h-8 bg-red-100 text-red-700 rounded-full font-bold text-sm">
                                                            <AlertTriangle size={16} />
                                                        </span>
                                                        <div>
                                                            <h5 className="font-bold text-gray-800 text-lg">{apt.fullName}</h5>
                                                            <p className="text-sm text-gray-600">{apt.phone}</p>
                                                        </div>
                                                    </div>

                                                    <div className="ml-11 space-y-1">
                                                        <p className="text-sm text-gray-600">
                                                            <span className="font-semibold">Type:</span> {apt.consultationType?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                        </p>
                                                        <p className="text-sm text-red-600 font-medium">
                                                            🚨 Emergency - {apt.timeSlot}
                                                        </p>
                                                        {apt.additionalMessage && (
                                                            <p className="text-sm text-gray-600 mt-2">
                                                                <span className="font-semibold">Note:</span> {apt.additionalMessage}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${apt.status === 'upcoming' ? 'bg-orange-100 text-orange-700' :
                                                                apt.status === 'seen' ? 'bg-green-100 text-green-700' :
                                                                    'bg-red-100 text-red-700'
                                                                }`}>
                                                                {apt.status === 'upcoming' ? '⏳ Upcoming' :
                                                                    apt.status === 'seen' ? '✅ Seen' :
                                                                        '❌ Cancelled'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex flex-col gap-2 min-w-fit">
                                                    {apt.status === 'upcoming' && currentUser?.role === 'admin' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusUpdate(apt._id, 'seen')}
                                                                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                                                            >
                                                                <CheckCircle size={16} />
                                                                Mark Seen
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(apt._id, 'cancelled')}
                                                                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium border border-red-200"
                                                            >
                                                                <XCircle size={16} />
                                                                Cancel
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleAddBill(apt)}
                                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-medium border border-blue-200"
                                                    >
                                                        <DollarSign size={16} />
                                                        Add Bill
                                                    </button>

                                                    {currentUser?.role === 'admin' && (
                                                        <button
                                                            onClick={() => handleDeleteAppointment(apt._id)}
                                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                                                        >
                                                            <Trash2 size={16} />
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
                        fetchDashboardData();
                        alert('✅ Appointment created successfully!');
                    }}
                    onCancel={() => setShowBookingModal(false)}
                />
            )}

            {showEmergencyModal && (
                <EmergencyAppointmentModal
                    onSuccess={() => {
                        setShowEmergencyModal(false);
                        fetchDashboardData();
                        alert('✅ Emergency appointment created successfully!');
                    }}
                    onClose={() => setShowEmergencyModal(false)}
                />
            )}

            <StaffBottomNav activeScreen="home" userRole={currentUser?.role} />
        </div>
    );
}

// Bill Modal Component (keeping the existing one from the original file)
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
    const [isPaid, setIsPaid] = useState(true);

    const quickServices = [
        { name: 'ECG', amount: 300, paymentMethod: 'Cash' },
        { name: 'Consultation', amount: 1000, paymentMethod: 'Cash' },
        { name: 'PAC', amount: 1000, paymentMethod: 'Cash' },
        { name: 'Blood Test', amount: 500, paymentMethod: 'Cash' }
    ];

    const paymentMethods = ['Cash', 'UPI', 'Card', 'Online'];

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
            const billString = billItems.map(item => `${item.service}, ${item.amount}, ${item.paymentMethod}`).join(', ');

            // For guest appointments, create a temporary patient record with just phone and name
            let patientId = appointment.patientId?._id || appointment.patientId || appointment.userId?._id || appointment.userId;

            // If no patientId exists (guest appointment), create guest patient data
            const billData = {
                appointmentId: appointment._id,
                items: billString,
                totalAmount: getTotalAmount(),
                status: isPaid ? 'paid' : 'unpaid',
                paidDate: isPaid ? new Date() : undefined
            };

            // Only add patientId if it exists
            if (patientId) {
                billData.patientId = patientId;
            } else {
                // For guest appointments, store patient info in the bill
                billData.guestPatient = {
                    fullName: appointment.fullName,
                    phone: appointment.phone
                };
            }

            await api.createBill(billData);

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
                        {existingBills.map((bill, idx) => {
                            const items = bill.items?.split(',').map(item => item.trim()) || [];
                            return (
                                <div key={bill._id} className="mb-2 p-3 bg-white rounded border border-blue-100">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-800">Bill #{idx + 1}</p>
                                            <p className="text-xs text-gray-600 mt-1">{items.join(', ')}</p>
                                        </div>
                                        <div className="text-right ml-4">
                                            <p className="font-semibold text-gray-900">₹{bill.totalAmount}</p>
                                            <span className={`text-xs px-2 py-1 rounded-full ${bill.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {bill.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Quick Service Buttons */}
                <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Quick Add:</p>
                    <div className="grid grid-cols-2 gap-2">
                        {quickServices.map((service, idx) => (
                            <button
                                key={idx}
                                onClick={() => addQuickService(service)}
                                className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-medium border border-blue-200"
                            >
                                {service.name} - ₹{service.amount} ({service.paymentMethod})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Add Item Form */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <input
                            type="text"
                            placeholder="Service name"
                            value={newItem.service}
                            onChange={(e) => setNewItem({ ...newItem, service: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                        />
                        <input
                            type="number"
                            placeholder="Amount"
                            value={newItem.amount}
                            onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                        />
                        <select
                            value={newItem.paymentMethod}
                            onChange={(e) => setNewItem({ ...newItem, paymentMethod: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                        >
                            {paymentMethods.map(method => (
                                <option key={method} value={method}>{method}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={addItem}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                        {editingIndex !== null ? 'Update Item' : 'Add Item'}
                    </button>
                </div>

                {/* Bill Items List */}
                {billItems.length > 0 && (
                    <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Bill Items:</p>
                        <div className="space-y-2">
                            {billItems.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800">{item.service}</p>
                                        <p className="text-sm text-gray-600">{item.paymentMethod}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-gray-900">₹{item.amount}</span>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => editItem(index)}
                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => removeItem(index)}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Payment Status Toggle */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isPaid}
                            onChange={(e) => setIsPaid(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Mark as Paid</span>
                    </label>
                </div>

                {/* Total and Submit */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div>
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-2xl font-bold text-gray-900">₹{getTotalAmount()}</p>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || billItems.length === 0}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating...' : 'Create Bill'}
                    </button>
                </div>
            </div>
        </div>
    );
}