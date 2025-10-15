'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, Calendar, Users, Settings } from 'lucide-react';

export default function StaffBottomNav({ activeScreen = 'home', userRole }) {
    const router = useRouter();
    const pathname = usePathname();

    const navItems = [
        { id: 'home', icon: Home, label: 'Home', path: '/dashboard/staff' },
        { id: 'all-appointments', icon: Calendar, label: 'Appointments', path: '/dashboard/staff/appointments' },
        { id: 'users', icon: Users, label: 'Users', path: '/dashboard/staff/users' },
        { id: 'settings', icon: Settings, label: 'Settings', path: '/dashboard/staff/settings' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 z-20 max-w-6xl mx-auto">
            {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                    <button
                        key={item.id}
                        onClick={() => router.push(item.path)}
                        className={`flex flex-col items-center justify-center w-20 h-16 rounded-lg transition-colors duration-200 ${isActive
                                ? userRole === 'admin'
                                    ? 'text-red-600 bg-red-50'
                                    : 'text-purple-600 bg-purple-50'
                                : 'text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-xs mt-1 font-medium">{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}