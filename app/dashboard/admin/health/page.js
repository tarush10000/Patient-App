"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminHealthRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.push('/health');
    }, [router]);

    return (
        <div className="flex h-full items-center justify-center p-6">
            <div className="flex flex-col items-center gap-4 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Redirecting to health monitor...</p>
            </div>
        </div>
    );
}
