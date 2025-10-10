'use client';

import { useState, useEffect } from 'react';
import { Users, Calendar, DollarSign, Clock, Ban } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { api } from '@/lib/api';

export default function AdminPage() {
    const [users, setUsers] = useState([]);
    const [blockedSlots, setBlockedSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBlockSlotModal, setShowBlockSlotModal] = useState(false);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            const [usersRes, slotsRes] = await Promise.all([
                api.getUsers(),
                api.getBlockedSlots()
            ]);
            setUsers(usersRes.users || []);
            setBlockedSlots(slotsRes.blockedSlots || []);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBlockSlot = async (slotData) => {
        try {
            await api.blockSlot(slotData);
            fetchAdminData();
            setShowBlockSlotModal(false);
        } catch (error) {
            alert('Failed to block slot: ' + error.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-4xl mx-auto p-4 pb-24">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Panel</h2>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Statistics Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl p-4 shadow-md">
                                <Users className="text-blue-600 mb-2" size={24} />
                                <p className="text-2xl font-bold">{users.length}</p>
                                <p className="text-sm text-gray-600">Total Users</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-md">
                                <Calendar className="text-green-600 mb-2" size={24} />
                                <p className="text-2xl font-bold">18</p>
                                <p className="text-sm text-gray-600">This Week</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-md">
                                <DollarSign className="text-purple-600 mb-2" size={24} />
                                <p className="text-2xl font-bold">₹45,000</p>
                                <p className="text-sm text-gray-600">Revenue</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-md">
                                <Ban className="text-red-600 mb-2" size={24} />
                                <p className="text-2xl font-bold">{blockedSlots.length}</p>
                                <p className="text-sm text-gray-600">Blocked Slots</p>
                            </div>
                        </div>

                        {/* Fast2SMS Status */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                📱 Fast2SMS Status
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-700">API Status:</span>
                                    <span className="text-green-600 font-semibold">✓ Active</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-700">SMS Balance:</span>
                                    <span className="font-semibold">5,420 credits</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Delivery Rate:</span>
                                    <span className="font-semibold">99.8%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Avg. Delivery Time:</span>
                                    <span className="font-semibold">3 seconds</span>
                                </div>
                            </div>
                        </div>

                        {/* Block Slot Section */}
                        <div className="bg-white rounded-xl p-6 shadow-md">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg">Blocked Time Slots</h3>
                                <button
                                    onClick={() => setShowBlockSlotModal(true)}
                                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition text-sm"
                                >
                                    + Block Slot
                                </button>
                            </div>
                            {blockedSlots.length === 0 ? (
                                <p className="text-gray-600 text-center py-4">No blocked slots</p>
                            ) : (
                                <div className="space-y-2">
                                    {blockedSlots.slice(0, 5).map((slot) => (
                                        <div key={slot._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-semibold text-sm">
                                                    {new Date(slot.date).toLocaleDateString()} - {slot.timeSlot}
                                                </p>
                                                <p className="text-xs text-gray-600">{slot.reason}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Users List */}
                        <div className="bg-white rounded-xl p-6 shadow-md">
                            <h3 className="font-bold text-lg mb-4">Recent Users</h3>
                            <div className="space-y-3">
                                {users.slice(0, 5).map((user) => (
                                    <div key={user._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-semibold">{user.fullName}</p>
                                            <p className="text-sm text-gray-600">{user.email || user.phone}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-red-100 text-red-700' :
                                                user.role === 'reception' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <BottomNav activeScreen="admin" />

            {showBlockSlotModal && (
                <BlockSlotModal
                    onClose={() => setShowBlockSlotModal(false)}
                    onSubmit={handleBlockSlot}
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
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">Block Time Slot</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
                        <select
                            value={formData.timeSlot}
                            onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
                        >
                            <option value="">Select time slot</option>
                            {timeSlots.map((slot) => (
                                <option key={slot} value={slot}>{slot}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                        <input
                            type="text"
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            placeholder="Holiday/Personal/Emergency"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-gray-900 bg-white"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                        >
                            Block Slot
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}