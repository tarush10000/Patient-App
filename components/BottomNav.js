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
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 flex justify-around py-1.5 px-3 z-20 max-w-4xl mx-auto shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
            {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                    <button
                        key={item.id}
                        onClick={() => router.push(item.path)}
                        className={`flex flex-col items-center justify-center w-20 py-1.5 rounded-xl transition-all duration-150 ${
                            isActive
                                ? 'text-[#173456] bg-slate-100/90 font-semibold shadow-xs'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                    >
                        <item.icon size={22} strokeWidth={isActive ? 2.3 : 1.8} className={isActive ? 'text-[#0e8a7d]' : 'text-slate-400'} />
                        <span className={`text-[11px] mt-1 tracking-tight ${isActive ? 'font-semibold text-[#173456]' : 'font-medium'}`}>{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}