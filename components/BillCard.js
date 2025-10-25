'use client';

export default function BillCard({ bill, onClick }) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div 
            onClick={onClick}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition cursor-pointer"
        >
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Bill Date: {formatDate(bill.billDate)}</p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">₹{bill.totalAmount}</p>
                    {bill.paidDate && (
                        <p className="text-xs text-gray-500 mt-2">
                            Paid on {formatDate(bill.paidDate)}
                        </p>
                    )}
                </div>
                <div className="text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </div>
            </div>
        </div>
    );
}