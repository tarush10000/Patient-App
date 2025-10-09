'use client';

export default function Header() {
    return (
        <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 shadow-sm">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-2xl font-bold text-blue-800">Dr. Anjali Gupta</h1>
                <p className="text-sm text-gray-500">Gynaecologist & Obstetrician</p>
            </div>
        </header>
    );
}