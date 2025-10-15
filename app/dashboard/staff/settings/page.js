'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, LogOut, User, Shield } from 'lucide-react';
import Header from '@/components/Header';
import StaffBottomNav from '@/components/StaffBottomNav';
import { api } from '@/lib/api';

export default function StaffSettingsPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(null);
    const [blockedSlots, setBlockedSlots] = useState([]);
    const [blockedDays, setBlockedDays] = useState([]);
    const [showBlockSlotModal, setShowBlockSlotModal] = useState(false);
    const [showBlockDayModal, setShowBlockDayModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
        fetchBlockedData();
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

    const fetchBlockedData = async () => {
        try {
            const [slotsRes, daysRes] = await Promise.all([
                api.getBlockedSlots(),
                api.getBlockedDays()
            ]);
            setBlockedSlots(slotsRes.blockedSlots || []);
            setBlockedDays(daysRes.blockedDays || []);
        } catch (error) {
            console.error('Error fetching blocked data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBlockSlot = async (slotData) => {
        try {
            await api.blockSlot(slotData);
            fetchBlockedData();
            setShowBlockSlotModal(false);
        } catch (error) {
            alert('Failed to block slot: ' + error.message);
        }
    };

    const handleBlockDay = async (dayData) => {
        try {
            await api.blockDay(dayData);
            fetchBlockedData();
            setShowBlockDayModal(false);
        } catch (error) {
            alert('Failed to block day: ' + error.message);
        }
    };

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            api.logout();
            router.push('/login');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
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
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>

                <div className="space-y-6">
                    {/* Profile Info */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                            <User size={24} />
                            Profile Information
                        </h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <span className={`px-4 py-2 rounded-full font-semibold ${currentUser?.role === 'admin'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-purple-100 text-purple-700'
                                    }`}>
                                    {currentUser?.role}
                                </span>
                            </div>
                            <p className="text-sm text-gray-700">
                                Logged in as {currentUser?.role === 'admin' ? 'Administrator' : 'Receptionist'}
                            </p>
                        </div>
                    </div>

                    {/* Block Entire Day - Admin Only */}
                    {currentUser?.role === 'admin' && (
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                                    <Ban size={24} className="text-orange-600" />
                                    Blocked Days
                                </h3>
                                <button
                                    onClick={() => setShowBlockDayModal(true)}
                                    className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition"
                                >
                                    + Block Entire Day
                                </button>
                            </div>

                            {blockedDays.length === 0 ? (
                                <p className="text-gray-600 text-center py-8">No blocked days</p>
                            ) : (
                                <div className="space-y-3">
                                    {blockedDays.map((day) => (
                                        <div
                                            key={day._id}
                                            className="p-4 bg-orange-50 border border-orange-200 rounded-lg"
                                        >
                                            <p className="font-semibold text-gray-800">
                                                {formatDate(day.date)}
                                            </p>
                                            <p className="text-sm text-gray-700 mt-1">
                                                Reason: {day.reason}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Block Time Slots - Admin Only */}
                    {currentUser?.role === 'admin' && (
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                                    <Ban size={24} className="text-red-600" />
                                    Blocked Time Slots
                                </h3>
                                <button
                                    onClick={() => setShowBlockSlotModal(true)}
                                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
                                >
                                    + Block Slot
                                </button>
                            </div>

                            {blockedSlots.length === 0 ? (
                                <p className="text-gray-600 text-center py-8">No blocked slots</p>
                            ) : (
                                <div className="space-y-3">
                                    {blockedSlots.map((slot) => (
                                        <div
                                            key={slot._id}
                                            className="p-4 bg-red-50 border border-red-200 rounded-lg"
                                        >
                                            <p className="font-semibold text-gray-800">{formatDate(slot.date)}</p>
                                            <p className="text-sm text-gray-700">{slot.timeSlot}</p>
                                            <p className="text-sm text-gray-600 mt-1 italic">
                                                Reason: {slot.reason}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Permissions */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                            <Shield size={24} />
                            Your Permissions
                        </h3>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-gray-800">View All Appointments</span>
                                <span className="text-green-600 font-semibold">✓</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-gray-800">Update Appointment Status</span>
                                <span className="text-green-600 font-semibold">✓</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-gray-800">View All Users</span>
                                <span className="text-green-600 font-semibold">✓</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-gray-800">Delete Appointments</span>
                                <span className={currentUser?.role === 'admin' ? 'text-green-600' : 'text-red-600'}>
                                    {currentUser?.role === 'admin' ? '✓' : '✗'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-gray-800">Block Time Slots & Days</span>
                                <span className={currentUser?.role === 'admin' ? 'text-green-600' : 'text-red-600'}>
                                    {currentUser?.role === 'admin' ? '✓' : '✗'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-50 text-red-600 py-4 rounded-xl font-semibold hover:bg-red-100 transition flex items-center justify-center gap-2"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </main>

            <StaffBottomNav activeScreen="settings" userRole={currentUser?.role} />

            {showBlockSlotModal && (
                <BlockSlotModal
                    onClose={() => setShowBlockSlotModal(false)}
                    onSubmit={handleBlockSlot}
                />
            )}

            {showBlockDayModal && (
                <BlockDayModal
                    onClose={() => setShowBlockDayModal(false)}
                    onSubmit={handleBlockDay}
                />
            )}
        </div>
    );
}

function BlockSlotModal({ onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        date: '',
        timeSlot: '',
        reason: ''
    });

    const timeSlots = [
        '10:30 AM - 11:30 AM',
        '11:30 AM - 12:30 PM',
        '12:30 PM - 1:30 PM',
        '1:30 PM - 2:00 PM',
        '4:30 PM - 5:30 PM',
        '5:30 PM - 6:00 PM'
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.date || !formData.timeSlot || !formData.reason) {
            alert('Please fill all fields');
            return;
        }
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Block Time Slot</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Date</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Time Slot</label>
                        <select
                            value={formData.timeSlot}
                            onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                        >
                            <option value="">Select a time slot</option>
                            {timeSlots.map(slot => (
                                <option key={slot} value={slot}>{slot}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Reason</label>
                        <textarea
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                            rows="3"
                            placeholder="Why is this slot being blocked?"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                        >
                            Block Slot
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function BlockDayModal({ onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        date: '',
        reason: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.date || !formData.reason) {
            alert('Please fill all fields');
            return;
        }
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Block Entire Day</h3>
                <p className="text-sm text-gray-700 mb-4">
                    This will block all time slots for the selected date.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Date</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Reason</label>
                        <textarea
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                            rows="3"
                            placeholder="Why is this day being blocked? (e.g., Holiday, Doctor unavailable)"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition"
                        >
                            Block Day
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}