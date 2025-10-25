import { DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard, Smartphone, Globe, Calendar } from 'lucide-react';

export default function CollectionStats({ stats }) {
    const statsCards = [
        {
            title: 'Total Collection',
            value: `₹${stats.totalCollection.toLocaleString()}`,
            icon: DollarSign,
            color: 'blue',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600',
            borderColor: 'border-blue-200'
        },
        {
            title: 'Paid Amount',
            value: `₹${stats.paidAmount.toLocaleString()}`,
            icon: TrendingUp,
            color: 'green',
            bgColor: 'bg-green-50',
            textColor: 'text-green-600',
            borderColor: 'border-green-200',
            subtitle: `${((stats.paidAmount / stats.totalCollection) * 100 || 0).toFixed(1)}% of total`
        },
        {
            title: 'Unpaid Amount',
            value: `₹${stats.unpaidAmount.toLocaleString()}`,
            icon: TrendingDown,
            color: 'red',
            bgColor: 'bg-red-50',
            textColor: 'text-red-600',
            borderColor: 'border-red-200',
            subtitle: `${((stats.unpaidAmount / stats.totalCollection) * 100 || 0).toFixed(1)}% of total`
        },
        {
            title: 'Today\'s Collection',
            value: `₹${stats.todayCollection.toLocaleString()}`,
            icon: Calendar,
            color: 'purple',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-600',
            borderColor: 'border-purple-200'
        }
    ];

    const paymentModeCards = [
        {
            title: 'Cash',
            value: `₹${stats.cashCollection.toLocaleString()}`,
            icon: Wallet,
            color: 'amber',
            bgColor: 'bg-amber-50',
            textColor: 'text-amber-600',
            percentage: ((stats.cashCollection / stats.paidAmount) * 100 || 0).toFixed(1)
        },
        {
            title: 'UPI',
            value: `₹${stats.upiCollection.toLocaleString()}`,
            icon: Smartphone,
            color: 'indigo',
            bgColor: 'bg-indigo-50',
            textColor: 'text-indigo-600',
            percentage: ((stats.upiCollection / stats.paidAmount) * 100 || 0).toFixed(1)
        },
        {
            title: 'Card',
            value: `₹${stats.cardCollection.toLocaleString()}`,
            icon: CreditCard,
            color: 'pink',
            bgColor: 'bg-pink-50',
            textColor: 'text-pink-600',
            percentage: ((stats.cardCollection / stats.paidAmount) * 100 || 0).toFixed(1)
        },
        {
            title: 'Online',
            value: `₹${stats.onlineCollection.toLocaleString()}`,
            icon: Globe,
            color: 'teal',
            bgColor: 'bg-teal-50',
            textColor: 'text-teal-600',
            percentage: ((stats.onlineCollection / stats.paidAmount) * 100 || 0).toFixed(1)
        }
    ];

    return (
        <div className="space-y-6 mb-6">
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className={`${stat.bgColor} rounded-xl p-6 shadow-md border-2 ${stat.borderColor} transition-transform hover:scale-105`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <Icon className={stat.textColor} size={28} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
                            <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                            {stat.subtitle && (
                                <p className="text-xs text-gray-500 mt-2">{stat.subtitle}</p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Payment Mode Breakdown */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Payment Mode Breakdown</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {paymentModeCards.map((mode, index) => {
                        const Icon = mode.icon;
                        return (
                            <div
                                key={index}
                                className={`${mode.bgColor} rounded-lg p-4 border ${mode.textColor.replace('text', 'border')}`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon className={mode.textColor} size={20} />
                                    <span className="text-sm font-medium text-gray-700">{mode.title}</span>
                                </div>
                                <p className={`text-xl font-bold ${mode.textColor}`}>{mode.value}</p>
                                <div className="mt-2">
                                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                        <span>{mode.percentage}% of paid</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${mode.textColor.replace('text', 'bg')}`}
                                            style={{ width: `${mode.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
