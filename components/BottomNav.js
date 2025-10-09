'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, Calendar, FileText, User } from 'lucide-react';

export default function BottomNav({ activeScreen = 'home' }) {
    const router = useRouter();
    const pathname = usePathname();

    const navItems = [
        { id: 'home', icon: Home, label: 'Home', path: '/dashboard' },
        { id: 'appointments', icon: Calendar, label: 'Appointments', path: '/dashboard/appointments' },
        { id: 'billing', icon: FileText, label: 'Billing', path: '/dashboard/billing' },
        { id: 'profile', icon: User, label: 'Profile', path: '/dashboard/profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 z-20 max-w-4xl mx-auto">
            {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                    <button
                        key={item.id}
                        onClick={() => router.push(item.path)}
                        className={`flex flex-col items-center justify-center w-20 h-16 rounded-lg transition-colors duration-200 ${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'
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