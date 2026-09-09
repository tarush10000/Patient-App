'use client';

import Image from 'next/image';

export default function Header() {
    return (
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3.5 sticky top-0 z-20 shadow-[0_1px_3px_rgba(23,52,86,0.05)]">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-0.5 rounded-full ring-2 ring-[#0e8a7d]/20 shadow-sm bg-white">
                        <Image
                            src="/logo.png"
                            alt="Dr. Anjali Gupta Logo"
                            width={48}
                            height={48}
                            className="rounded-full object-cover"
                            priority
                        />
                    </div>
                    <div className="text-left">
                        <h1 className="text-xl font-bold tracking-tight text-[#173456]">
                            Dr. Anjali Gupta
                        </h1>
                        <p className="text-xs font-medium text-[#0e8a7d]">
                            Women Wellness Center <span className="text-slate-300 mx-1">•</span> <span className="text-slate-500 font-normal">Gynaecologist & Obstetrician</span>
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
}