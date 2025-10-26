'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, Calendar, Settings, DollarSign } from 'lucide-react';

export default function StaffBottomNav({ activeScreen = 'home', userRole }) {
    const router = useRouter();
    const pathname = usePathname();

    const navItems = [
        {
            id: 'home',
            icon: Home,
            label: 'Home',
            path: '/dashboard/staff'
        },
        {
            id: 'all-appointments',
            icon: Calendar,
            label: 'Appointments',
            path: '/dashboard/staff/appointments'
        },
        {
            id: 'collections',
            icon: DollarSign,
            label: 'Collections',
            path: '/dashboard/staff/collections',
            adminOnly: false // Available to both admin and reception
        },
        {
            id: 'settings',
            icon: Settings,
            label: 'Settings',
            path: '/dashboard/staff/settings',
            adminOnly: false // Settings available to both admin and reception
        },
    ];

    // Filter nav items based on user role
    const filteredNavItems = navItems.filter(item => {
        if (item.adminOnly && userRole !== 'admin') {
            return false;
        }
        return true;
    });

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg flex justify-around p-2 z-20 max-w-6xl mx-auto">
            {filteredNavItems.map((item) => {
                const isActive = pathname === item.path;
                const Icon = item.icon;

                return (
                    <button
                        key={item.id}
                        onClick={() => router.push(item.path)}
                        className={`flex flex-col items-center justify-center w-20 h-16 rounded-lg transition-all duration-200 ${isActive
                                ? userRole === 'admin'
                                    ? 'text-red-600 bg-red-50 shadow-sm'
                                    : 'text-purple-600 bg-purple-50 shadow-sm'
                                : 'text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                        <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
}