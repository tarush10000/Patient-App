'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Phone, Mail, Bell, Edit2, Save, X } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { api } from '@/lib/api';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notificationStatus, setNotificationStatus] = useState('default');
    const [editForm, setEditForm] = useState({
        fullName: '',
        email: '',
        phone: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchUserProfile();
        if ('Notification' in window) {
            setNotificationStatus(Notification.permission);
        }
    }, []);

    const fetchUserProfile = async () => {
        try {
            const token = api.getToken();
            if (!token) {
                router.push('/login');
                return;
            }

            // Decode token to get user ID
            const payload = JSON.parse(atob(token.split('.')[1]));
            
            // Fetch user data from API
            const response = await api.getUserProfile(payload.userId);
            setUser(response.user);
            setEditForm({
                fullName: response.user.fullName || '',
                email: response.user.email || '',
                phone: response.user.phone || ''
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    const handleEditToggle = () => {
        if (isEditing) {
            // Reset form if canceling
            setEditForm({
                fullName: user.fullName || '',
                email: user.email || '',
                phone: user.phone || ''
            });
            setError('');
        }
        setIsEditing(!isEditing);
    };

    const handleSave = async () => {
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            // Validation
            if (!editForm.fullName.trim()) {
                setError('Full name is required');
                setSaving(false);
                return;
            }

            if (!editForm.email && !editForm.phone) {
                setError('At least one contact method (email or phone) is required');
                setSaving(false);
                return;
            }

            if (editForm.phone && editForm.phone.length !== 10) {
                setError('Phone number must be 10 digits');
                setSaving(false);
                return;
            }

            await api.updateUserProfile(editForm);
            setSuccess('Profile updated successfully!');
            setIsEditing(false);
            await fetchUserProfile(); // Refresh user data
        } catch (error) {
            setError(error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleNotificationRequest = async () => {
        if (!('Notification' in window)) {
            alert('This browser does not support notifications');
            return;
        }

        const permission = await Notification.requestPermission();
        setNotificationStatus(permission);
    };

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            api.logout();
            router.push('/login');
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

            <main className="max-w-4xl mx-auto p-4 pb-24">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile & Settings</h2>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
                        {success}
                    </div>
                )}

                <div className="space-y-4">
                    {/* User Info Card */}
                    <div className="bg-white rounded-xl p-6 shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800">
                                <User size={20} className="text-blue-600" />
                                Account Information
                            </h3>
                            {!isEditing ? (
                                <button
                                    onClick={handleEditToggle}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                                >
                                    <Edit2 size={16} />
                                    Edit
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                                    >
                                        <Save size={16} />
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={handleEditToggle}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
                                    >
                                        <X size={16} />
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {/* Full Name */}
                            <div className="flex items-start gap-3">
                                <User size={18} className="text-gray-500 mt-1" />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 mb-1">Full Name</p>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editForm.fullName}
                                            onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                                        />
                                    ) : (
                                        <p className="font-medium text-gray-800">{user?.fullName || 'Not set'}</p>
                                    )}
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="flex items-start gap-3">
                                <Phone size={18} className="text-gray-500 mt-1" />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                                    {isEditing ? (
                                        <div className="flex gap-2">
                                            <span className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-800">
                                                +91
                                            </span>
                                            <input
                                                type="tel"
                                                value={editForm.phone}
                                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                maxLength="10"
                                                pattern="[0-9]{10}"
                                                placeholder="10-digit mobile number"
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                                            />
                                        </div>
                                    ) : (
                                        <p className="font-medium text-gray-800">
                                            {user?.phone ? `+91 ${user.phone}` : 'Not set'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Email */}
                            <div className="flex items-start gap-3">
                                <Mail size={18} className="text-gray-500 mt-1" />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 mb-1">Email Address</p>
                                    {isEditing ? (
                                        <input
                                            type="email"
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            placeholder="your.email@example.com"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                                        />
                                    ) : (
                                        <p className="font-medium text-gray-800">{user?.email || 'Not set'}</p>
                                    )}
                                </div>
                            </div>

                            {/* Role Badge */}
                            <div className="flex items-start gap-3">
                                <div className="w-[18px]"></div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 mb-1">Account Type</p>
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                        user?.role === 'admin' 
                                            ? 'bg-red-100 text-red-700' 
                                            : user?.role === 'reception'
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {user?.role}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notifications Card */}
                    <div className="bg-white rounded-xl p-6 shadow-md">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                            <Bell size={20} className="text-blue-600" />
                            Notifications
                        </h3>
                        <p className="text-gray-700 mb-4 text-sm">
                            {notificationStatus === 'granted'
                                ? 'Notifications are enabled'
                                : 'Enable notifications to receive appointment reminders'}
                        </p>
                        {notificationStatus !== 'granted' && (
                            <button
                                onClick={handleNotificationRequest}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                            >
                                Enable Notifications
                            </button>
                        )}
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-50 text-red-600 py-3 rounded-lg font-semibold hover:bg-red-100 transition"
                    >
                        Logout
                    </button>
                </div>
            </main>

            <BottomNav activeScreen="profile" />
        </div>
    );
}