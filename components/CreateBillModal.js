'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, User, DollarSign } from 'lucide-react';

export default function CreateBillModal({ isOpen, onClose, onSave, editingBill = null }) {
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [billDate, setBillDate] = useState('');
    const [items, setItems] = useState([
        { service: '', amount: '', paymentMethod: 'cash' }
    ]);
    const [status, setStatus] = useState('unpaid');
    const [errors, setErrors] = useState({});

    // Initialize form when editing a bill
    useEffect(() => {
        if (editingBill) {
            setSelectedPatient(editingBill.appointmentId);
            setBillDate(new Date(editingBill.billDate).toISOString().slice(0, 16));
            setItems(editingBill.items || [{ service: '', amount: '', paymentMethod: 'cash' }]);
            setStatus(editingBill.status || 'unpaid');
        } else {
            // Reset form for new bill
            resetForm();
        }
    }, [editingBill, isOpen]);

    const resetForm = () => {
        setSelectedPatient(null);
        setBillDate('');
        setItems([{ service: '', amount: '', paymentMethod: 'cash' }]);
        setStatus('unpaid');
        setErrors({});
    };

    const handleAddItem = () => {
        setItems([...items, { service: '', amount: '', paymentMethod: 'cash' }]);
    };

    const handleRemoveItem = (index) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => {
            const amount = parseFloat(item.amount) || 0;
            return sum + amount;
        }, 0);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!selectedPatient) {
            newErrors.patient = 'Please select a patient';
        }

        if (!billDate) {
            newErrors.billDate = 'Please select a date';
        }

        items.forEach((item, index) => {
            if (!item.service.trim()) {
                newErrors[`service_${index}`] = 'Service is required';
            }
            if (!item.amount || parseFloat(item.amount) <= 0) {
                newErrors[`amount_${index}`] = 'Valid amount is required';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validateForm()) {
            return;
        }

        const billData = {
            patientId: selectedPatient._id,
            billDate: new Date(billDate).toISOString(),
            items: items.map(item => ({
                service: item.service.trim(),
                amount: parseFloat(item.amount),
                paymentMethod: item.paymentMethod
            })),
            totalAmount: calculateTotal(),
            status: status
        };

        onSave(billData);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    const totalAmount = calculateTotal();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <DollarSign size={24} />
                        {editingBill ? 'Edit Bill' : 'Create New Bill'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Patient Selection */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                            <User size={16} />
                            Patient
                        </label>
                        {/* Add your patient search/select component here */}
                        <div className="p-3 border rounded-lg bg-gray-50">
                            {selectedPatient ? (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {selectedPatient.fullName}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {selectedPatient.phone}
                                        </div>
                                    </div>
                                    {!editingBill && (
                                        <button
                                            onClick={() => setSelectedPatient(null)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <X size={20} />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="text-gray-500">
                                    Click to select a patient
                                </div>
                            )}
                        </div>
                        {errors.patient && (
                            <p className="text-red-500 text-sm mt-1">{errors.patient}</p>
                        )}
                    </div>

                    {/* Bill Items */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-semibold text-gray-700">
                                Bill Items
                            </label>
                            <button
                                onClick={handleAddItem}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                            >
                                <Plus size={16} />
                                Add Item
                            </button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div
                                    key={index}
                                    className="p-4 border rounded-lg bg-gray-50 space-y-3"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1 space-y-3 text-black">
                                            {/* Service Name */}
                                            <div>
                                                <label className="text-xs font-medium text-gray-600 mb-1 block">
                                                    Service
                                                </label>
                                                <input
                                                    type="text"
                                                    value={item.service}
                                                    onChange={(e) =>
                                                        handleItemChange(index, 'service', e.target.value)
                                                    }
                                                    placeholder="e.g., Consultation, X-Ray, etc."
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                />
                                                {errors[`service_${index}`] && (
                                                    <p className="text-red-500 text-xs mt-1">
                                                        {errors[`service_${index}`]}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                {/* Amount */}
                                                <div>
                                                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                                                        Amount (₹)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={item.amount}
                                                        onChange={(e) =>
                                                            handleItemChange(index, 'amount', e.target.value)
                                                        }
                                                        placeholder="0"
                                                        min="0"
                                                        step="0.01"
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                    />
                                                    {errors[`amount_${index}`] && (
                                                        <p className="text-red-500 text-xs mt-1">
                                                            {errors[`amount_${index}`]}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Payment Method */}
                                                <div>
                                                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                                                        Payment Method
                                                    </label>
                                                    <select
                                                        value={item.paymentMethod}
                                                        onChange={(e) =>
                                                            handleItemChange(index, 'paymentMethod', e.target.value)
                                                        }
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                    >
                                                        <option value="cash">Cash</option>
                                                        <option value="upi">UPI</option>
                                                        <option value="card">Card</option>
                                                        <option value="online">Online</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Remove Button */}
                                        {items.length > 1 && (
                                            <button
                                                onClick={() => handleRemoveItem(index)}
                                                className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remove item"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Status */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">
                            Payment Status
                        </label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setStatus('paid')}
                                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                                    status === 'paid'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Paid
                            </button>
                            <button
                                onClick={() => setStatus('unpaid')}
                                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                                    status === 'unpaid'
                                        ? 'bg-red-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Unpaid
                            </button>
                        </div>
                    </div>

                    {/* Total Amount Display */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-gray-700">
                                Total Amount:
                            </span>
                            <span className="text-2xl font-bold text-blue-600">
                                ₹{totalAmount.toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        {editingBill ? 'Update Bill' : 'Create Bill'}
                    </button>
                </div>
            </div>
        </div>
    );
}