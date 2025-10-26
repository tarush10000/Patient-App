'use client';

import Image from 'next/image';

export default function Header() {
    return (
        <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 shadow-sm">
            <div className="max-w-4xl mx-auto text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <Image
                        src="/logo.png"
                        alt="Dr. Anjali Gupta Logo"
                        width={60}
                        height={60}
                        className="rounded-full"
                    />
                    <div className="text-left">
                        <h1 className="text-2xl font-bold text-blue-800">Dr. Anjali Gupta</h1>
                        <p className="text-sm text-gray-500">Gynaecologist & Obstetrician</p>
                    </div>
                </div>
            </div>
        </header>
    );
}