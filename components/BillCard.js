'use client';

export default function BillCard({ bill, onPay }) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition">
            <div className="flex justify-between items-center">
                <div className="flex-1">
                    <p className="font-bold text-lg">{bill.service}</p>
                    <p className="text-sm text-gray-600">{formatDate(bill.billDate)}</p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">₹{bill.amount}</p>
                </div>
                {bill.status === 'unpaid' ? (
                    <button
                        onClick={() => onPay(bill._id)}
                        className="bg-green-500 text-white px-4 py-2 rounded-full font-semibold hover:bg-green-600 transition"
                    >
                        Pay Now
                    </button>
                ) : (
                    <span className="bg-green-100 text-green-600 px-4 py-2 rounded-full font-semibold">
                        Paid
                    </span>
                )}
            </div>
            {bill.paidDate && (
                <p className="text-xs text-gray-500 mt-2">
                    Paid on {formatDate(bill.paidDate)}
                </p>
            )}
        </div>
    );
}
