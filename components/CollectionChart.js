'use client';

import { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';

export default function CollectionChart({ bills, dateFilter, paymentModeFilter="all" }) {
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        prepareChartData();
    }, [bills, dateFilter]);

    const parseBillItems = (itemsString) => {
        const itemsArray = itemsString.split(', ');
        const parsed = [];

        for (let i = 0; i < itemsArray.length; i += 3) {
            if (itemsArray[i] && itemsArray[i + 1] && itemsArray[i + 2]) {
                parsed.push({
                    service: itemsArray[i],
                    amount: parseFloat(itemsArray[i + 1]),
                    paymentMethod: itemsArray[i + 2]
                });
            }
        }

        return parsed;
    };

    const prepareChartData = () => {
        const dataMap = {};

        bills.forEach(bill => {
            if (bill.status !== 'paid') return; // Only count paid bills

            const date = new Date(bill.billDate);
            const dateKey = date.toLocaleDateString('en-IN', { 
                month: 'short', 
                day: 'numeric' 
            });

            if (!dataMap[dateKey]) {
                dataMap[dateKey] = {
                    date: dateKey,
                    fullDate: date,
                    cash: 0,
                    upi: 0,
                    card: 0,
                    online: 0,
                    total: 0
                };
            }

            const items = bill.getParsedItems ? bill.getParsedItems() : parseBillItems(bill.items);

            items.forEach(item => {
                const method = item.paymentMethod.toLowerCase();
                if(paymentModeFilter === 'all'){
                    if (method === 'cash') dataMap[dateKey].cash += item.amount;
                    else if (method === 'upi') dataMap[dateKey].upi += item.amount;
                    else if (method === 'card') dataMap[dateKey].card += item.amount;
                    else if (method === 'online') dataMap[dateKey].online += item.amount;
                    dataMap[dateKey].total += item.amount;
                }else{
                    if (method === 'cash' && paymentModeFilter == 'cash') {
                        dataMap[dateKey].cash += item.amount;
                        dataMap[dateKey].total += item.amount;
                    }
                    else if (method === 'upi' && paymentModeFilter == 'upi' ) {
                        dataMap[dateKey].upi += item.amount;
                        dataMap[dateKey].total += item.amount;
                    }
                    else if (method === 'card' && paymentModeFilter == 'card') {
                        dataMap[dateKey].card += item.amount;
                        dataMap[dateKey].total += item.amount;
                    }
                    else if (method === 'online' && paymentModeFilter == 'online') {
                        dataMap[dateKey].online += item.amount;
                        dataMap[dateKey].total += item.amount;
                    }
                }
            });

            // items.forEach(item => {
            //     const method = item.paymentMethod.toLowerCase();
            //     if (method === 'cash') dataMap[dateKey].cash += item.amount;
            //     else if (method === 'upi') dataMap[dateKey].upi += item.amount;
            //     else if (method === 'card') dataMap[dateKey].card += item.amount;
            //     else if (method === 'online') dataMap[dateKey].online += item.amount;
                
            //     dataMap[dateKey].total += item.amount;
            // });
        });

        // Sort by date
        const sortedData = Object.values(dataMap).sort((a, b) => a.fullDate - b.fullDate);
        
        // Limit to last 30 days for readability
        const limitedData = sortedData.slice(-30);
        
        setChartData(limitedData);
    };

    const maxValue = Math.max(...chartData.map(d => d.total), 1);

    return (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center gap-2 mb-6">
                <BarChart3 size={24} className="text-blue-600" />
                <h3 className="text-lg font-bold text-gray-800">Day-wise Collection Trends</h3>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-amber-500 rounded"></div>
                    <span className="text-sm text-gray-600">Cash</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-indigo-500 rounded"></div>
                    <span className="text-sm text-gray-600">UPI</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-pink-500 rounded"></div>
                    <span className="text-sm text-gray-600">Card</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-teal-500 rounded"></div>
                    <span className="text-sm text-gray-600">Online</span>
                </div>
            </div>

            {/* Chart */}
            {chartData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No collection data available for the selected period</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <div className="flex items-end gap-2 min-w-max pb-4" style={{ minWidth: `${chartData.length * 80}px` }}>
                        {chartData.map((data, index) => {
                            const heightPercentage = (data.total / maxValue) * 100;
                            const cashHeight = (data.cash / data.total) * heightPercentage;
                            const upiHeight = (data.upi / data.total) * heightPercentage;
                            const cardHeight = (data.card / data.total) * heightPercentage;
                            const onlineHeight = (data.online / data.total) * heightPercentage;

                            return (
                                <div key={index} className="flex flex-col items-center group">
                                    {/* Bar */}
                                    <div className="relative flex flex-col justify-end w-16 h-64 bg-gray-100 rounded-t-lg overflow-hidden hover:shadow-lg transition-shadow">
                                        {/* Total amount tooltip on hover */}
                                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                            ₹{data.total.toLocaleString()}
                                        </div>

                                        {/* Stacked bars */}
                                        {data.online > 0 && (
                                            <div
                                                className="w-full bg-teal-500 transition-all duration-300 hover:bg-teal-600 relative group"
                                                style={{ height: `${onlineHeight}%` }}
                                                title={`Online: ₹${data.online}`}
                                            >
                                                {onlineHeight > 15 && (
                                                    <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                                                        ₹{(data.online / 1000).toFixed(1)}k
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {data.card > 0 && (
                                            <div
                                                className="w-full bg-pink-500 transition-all duration-300 hover:bg-pink-600 relative"
                                                style={{ height: `${cardHeight}%` }}
                                                title={`Card: ₹${data.card}`}
                                            >
                                                {cardHeight > 15 && (
                                                    <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                                                        ₹{(data.card / 1000).toFixed(1)}k
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {data.upi > 0 && (
                                            <div
                                                className="w-full bg-indigo-500 transition-all duration-300 hover:bg-indigo-600 relative"
                                                style={{ height: `${upiHeight}%` }}
                                                title={`UPI: ₹${data.upi}`}
                                            >
                                                {upiHeight > 15 && (
                                                    <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                                                        ₹{(data.upi / 1000).toFixed(1)}k
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {data.cash > 0 && (
                                            <div
                                                className="w-full bg-amber-500 transition-all duration-300 hover:bg-amber-600 relative"
                                                style={{ height: `${cashHeight}%` }}
                                                title={`Cash: ₹${data.cash}`}
                                            >
                                                {cashHeight > 15 && (
                                                    <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                                                        ₹{(data.cash / 1000).toFixed(1)}k
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Date label */}
                                    <div className="mt-2 text-xs text-gray-600 text-center font-medium">
                                        {data.date}
                                    </div>

                                    {/* Detailed breakdown on hover */}
                                    <div className="absolute bottom-full mb-16 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border-2 border-gray-200 rounded-lg p-3 shadow-xl z-20 w-48">
                                        <p className="text-xs font-bold text-gray-800 mb-2 border-b pb-1">{data.date}</p>
                                        <div className="space-y-1 text-xs">
                                            {data.cash > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-amber-600">Cash:</span>
                                                    <span className="font-semibold">₹{data.cash.toLocaleString()}</span>
                                                </div>
                                            )}
                                            {data.upi > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-indigo-600">UPI:</span>
                                                    <span className="font-semibold">₹{data.upi.toLocaleString()}</span>
                                                </div>
                                            )}
                                            {data.card > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-pink-600">Card:</span>
                                                    <span className="font-semibold">₹{data.card.toLocaleString()}</span>
                                                </div>
                                            )}
                                            {data.online > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-teal-600">Online:</span>
                                                    <span className="font-semibold">₹{data.online.toLocaleString()}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between border-t pt-1 mt-1">
                                                <span className="text-gray-700 font-bold">Total:</span>
                                                <span className="font-bold text-blue-600">₹{data.total.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Summary stats below chart */}
            <div className="mt-6 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                    <p className="text-sm text-gray-600">Days Shown</p>
                    <p className="text-lg font-bold text-gray-800">{chartData.length}</p>
                </div>
                <div className="text-center">
                    <p className="text-sm text-gray-600">Avg per Day</p>
                    <p className="text-lg font-bold text-blue-600">
                        ₹{chartData.length > 0 
                            ? (chartData.reduce((sum, d) => sum + d.total, 0) / chartData.length).toFixed(0).toLocaleString()
                            : 0}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-sm text-gray-600">Highest Day</p>
                    <p className="text-lg font-bold text-green-600">
                        ₹{chartData.length > 0 
                            ? Math.max(...chartData.map(d => d.total)).toLocaleString()
                            : 0}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-sm text-gray-600">Total Period</p>
                    <p className="text-lg font-bold text-purple-600">
                        ₹{chartData.reduce((sum, d) => sum + d.total, 0).toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );
}
