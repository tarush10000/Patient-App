'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Phone, Mail, Bell } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { api } from '@/lib/api';

export default function ProfilePage() {
    const router = useRouter();
    const [notificationStatus, setNotificationStatus] = useState('default');

    useEffect(() => {
        if ('Notification' in window) {
            setNotificationStatus(Notification.permission);
        }
    }, []);

    const handleNotificationRequest = async () => {
        if (!('Notification' in window)) {
            alert('This browser does not support notifications');
            return;
        }

        const permission = await Notification.requestPermission();
        setNotificationStatus(permission);
    };

    const handleLogout = () => {
        api.clearToken();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-4xl mx-auto p-4 pb-24">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile & Settings</h2>

                <div className="space-y-4">
                    {/* User Info Card */}
                    <div className="bg-white rounded-xl p-6 shadow-md">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <User size={20} className="text-blue-600" />
                            Account Information
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <User size={18} className="text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Full Name</p>
                                    <p className="font-medium">John Doe</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone size={18} className="text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Phone</p>
                                    <p className="font-medium">+91 98765 43210</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail size={18} className="text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="font-medium">john@example.com</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notifications Card */}
                    <div className="bg-white rounded-xl p-6 shadow-md">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Bell size={20} className="text-blue-600" />
                            Notifications
                        </h3>
                        <p className="text-gray-600 mb-4 text-sm">
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