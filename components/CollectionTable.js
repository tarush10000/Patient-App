'use client';

import { useState } from 'react';
import { FileText, User, Calendar, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';

export default function CollectionTable({ bills, onEditBill, onViewBill }) {
    const [sortField, setSortField] = useState('billDate');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

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

    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    // Handler for row click - opens detail view
    const handleRowClick = (bill) => {
        if (onViewBill) {
            onViewBill(bill);
        }
    };

    // Handler for edit button click - opens edit modal
    const handleEditClick = (e, bill) => {
        e.stopPropagation(); // Prevent row click from firing
        if (onEditBill) {
            const items = bill.getParsedItems ? bill.getParsedItems() : parseBillItems(bill.items);
            const billData = {
                _id: bill._id,
                patientId: bill.patientId,
                billDate: bill.billDate,
                items: items,
                totalAmount: bill.totalAmount,
                status: bill.status
            };
            onEditBill(billData);
        }
    };

    const sortedBills = [...bills].sort((a, b) => {
        let aValue, bValue;

        switch (sortField) {
            case 'billDate':
                aValue = new Date(a.billDate);
                bValue = new Date(b.billDate);
                break;
            case 'amount':
                aValue = a.totalAmount;
                bValue = b.totalAmount;
                break;
            case 'patient':
                aValue = a.patientId?.fullName || '';
                bValue = b.patientId?.fullName || '';
                break;
            case 'status':
                aValue = a.status;
                bValue = b.status;
                break;
            default:
                return 0;
        }

        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    // Pagination
    const totalPages = Math.ceil(sortedBills.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentBills = sortedBills.slice(startIndex, endIndex);

    const SortIcon = ({ field }) => {
        if (sortField !== field) return <ChevronDown size={16} className="text-gray-400" />;
        return sortOrder === 'asc'
            ? <ChevronUp size={16} className="text-blue-600" />
            : <ChevronDown size={16} className="text-blue-600" />;
    };

    const getStatusBadge = (status) => {
        const styles = {
            paid: 'bg-green-100 text-green-700 border-green-300',
            unpaid: 'bg-red-100 text-red-700 border-red-300',
        };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.unpaid}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const getPaymentMethodBadge = (method) => {
        const styles = {
            cash: 'bg-amber-100 text-amber-700',
            upi: 'bg-indigo-100 text-indigo-700',
            card: 'bg-pink-100 text-pink-700',
            online: 'bg-teal-100 text-teal-700'
        };

        const methodLower = method.toLowerCase();
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${styles[methodLower] || 'bg-gray-100 text-gray-700'}`}>
                {method}
            </span>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText size={24} className="text-gray-600" />
                        <h3 className="text-lg font-bold text-gray-800">Detailed Collection Records</h3>
                    </div>
                    <span className="text-sm text-gray-600">
                        Showing {startIndex + 1}-{Math.min(endIndex, sortedBills.length)} of {sortedBills.length} records
                    </span>
                </div>
            </div>

            {currentBills.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No collection records found</p>
                    <p className="text-sm mt-2">Try adjusting your filters</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        onClick={() => handleSort('billDate')}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    >
                                        <div className="flex items-center gap-1">
                                            Date
                                            <SortIcon field="billDate" />
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort('patient')}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    >
                                        <div className="flex items-center gap-1">
                                            Patient
                                            <SortIcon field="patient" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Services
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Payment Method
                                    </th>
                                    <th
                                        onClick={() => handleSort('amount')}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    >
                                        <div className="flex items-center gap-1">
                                            Amount
                                            <SortIcon field="amount" />
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort('status')}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    >
                                        <div className="flex items-center gap-1">
                                            Status
                                            <SortIcon field="status" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentBills.map((bill) => {
                                    const items = bill.getParsedItems ? bill.getParsedItems() : parseBillItems(bill.items);
                                    const paymentMethods = [...new Set(items.map(item => item.paymentMethod))];

                                    return (
                                        <tr 
                                            key={bill._id} 
                                            onClick={() => handleRowClick(bill)}
                                            className="hover:bg-blue-50 transition-colors cursor-pointer group"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={16} className="text-gray-400" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {new Date(bill.billDate).toLocaleDateString('en-IN', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {new Date(bill.billDate).toLocaleTimeString('en-IN', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <User size={16} className="text-gray-400" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {bill.patientId?.fullName || 'N/A'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {bill.patientId?.phone || ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm space-y-1">
                                                    {items.map((item, idx) => (
                                                        <div key={idx} className="text-gray-700">
                                                            {item.service}
                                                            <span className="text-gray-500 ml-1">
                                                                (₹{item.amount})
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {paymentMethods.map((method, idx) => (
                                                        <span key={idx}>
                                                            {getPaymentMethodBadge(method)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900">
                                                    ₹{bill.totalAmount.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(bill.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={(e) => handleEditClick(e, bill)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition text-sm font-medium"
                                                >
                                                    <Edit2 size={14} />
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t bg-gray-50">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                <div className="flex items-center gap-2">
                                    {[...Array(totalPages)].map((_, idx) => {
                                        const page = idx + 1;
                                        // Show first, last, current, and adjacent pages
                                        if (
                                            page === 1 ||
                                            page === totalPages ||
                                            (page >= currentPage - 1 && page <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`px-3 py-1 text-sm font-medium rounded-lg ${currentPage === page
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        } else if (
                                            page === currentPage - 2 ||
                                            page === currentPage + 2
                                        ) {
                                            return <span key={page} className="px-2 text-gray-500">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}