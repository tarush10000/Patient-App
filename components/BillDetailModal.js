'use client';

import { useState } from 'react';
import { X, Download, Share2 } from 'lucide-react';

export default function BillDetailModal({ bill, onClose, clinicInfo }) {
    const [downloading, setDownloading] = useState(false);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Parse items string back to array
    const parseItems = () => {
        const itemsArray = bill.items.split(', ');
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

    const items = parseItems();

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const printWindow = window.open('', '', 'height=900,width=800');
            
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>Bill - ${bill._id.slice(-8).toUpperCase()}</title>
                        <meta charset="UTF-8">
                        <style>
                            @page {
                                size: A4;
                                margin: 15mm;
                            }
                            
                            * { 
                                margin: 0; 
                                padding: 0; 
                                box-sizing: border-box; 
                            }
                            
                            body { 
                                font-family: 'Arial', sans-serif;
                                background: white;
                                color: #000;
                                line-height: 1.4;
                                padding: 20mm;
                            }
                            
                            .bill-container { 
                                max-width: 210mm;
                                margin: 0 auto; 
                                background: white;
                            }
                            
                            .header { 
                                display: flex;
                                align-items: flex-start;
                                justify-content: space-between;
                                margin-bottom: 20px; 
                                padding-bottom: 15px; 
                                border-bottom: 2px solid #000;
                            }
                            
                            .logo-section {
                                flex-shrink: 0;
                                width: 80px;
                            }
                            
                            .logo-section img {
                                width: 70px;
                                height: 70px;
                                object-fit: contain;
                            }
                            
                            .header-center {
                                flex: 1;
                                text-align: center;
                                padding: 0 20px;
                            }
                            
                            .clinic-name { 
                                font-size: 22px; 
                                font-weight: bold; 
                                color: #000;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                                margin-bottom: 4px;
                            }
                            
                            .tagline {
                                font-size: 11px;
                                color: #555;
                                font-style: italic;
                                margin-bottom: 8px;
                            }
                            
                            .clinic-contact { 
                                font-size: 10px; 
                                color: #333; 
                                line-height: 1.5;
                            }
                            
                            .doctor-section { 
                                margin: 15px 0;
                                padding: 10px 15px;
                                background: #f8f8f8;
                                border-left: 4px solid #000;
                            }
                            
                            .doctor-name { 
                                font-size: 15px; 
                                font-weight: bold; 
                                color: #000;
                                margin-bottom: 2px;
                            }
                            
                            .doctor-qualification { 
                                font-size: 10px; 
                                color: #444;
                                line-height: 1.4;
                            }
                            
                            .bill-title {
                                text-align: center;
                                font-size: 18px;
                                font-weight: bold;
                                margin: 20px 0 15px;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                            }
                            
                            .bill-details { 
                                margin: 15px 0; 
                                display: grid;
                                grid-template-columns: 1fr 1fr;
                                gap: 8px 20px;
                                font-size: 11px;
                            }
                            
                            .detail-item {
                                display: flex;
                            }
                            
                            .detail-label { 
                                font-weight: 600; 
                                color: #000;
                                min-width: 100px;
                            }
                            
                            .detail-value {
                                color: #333;
                            }
                            
                            table { 
                                width: 100%; 
                                border-collapse: collapse; 
                                margin: 20px 0; 
                                font-size: 11px;
                                border: 1px solid #000;
                            }
                            
                            th { 
                                padding: 10px 8px; 
                                text-align: left; 
                                background: #000;
                                color: white;
                                font-weight: 600;
                                border: 1px solid #000;
                            }
                            
                            th:last-child, td:last-child {
                                text-align: right;
                            }
                            
                            td { 
                                padding: 8px; 
                                border: 1px solid #ddd; 
                                color: #000;
                            }
                            
                            tbody tr:nth-child(odd) {
                                background-color: #fafafa;
                            }
                            
                            .total-row { 
                                font-weight: bold; 
                                font-size: 13px; 
                                background: #f0f0f0 !important;
                                border-top: 2px solid #000 !important;
                            }
                            
                            .total-row td {
                                padding: 12px 8px;
                                border: 1px solid #000;
                            }
                            
                            .payment-info { 
                                margin: 20px 0 15px; 
                                padding: 12px 15px;
                                background: #f8f8f8;
                                border: 1px solid #ddd;
                                font-size: 11px;
                            }
                            
                            .payment-row {
                                display: flex;
                                justify-content: space-between;
                                margin: 5px 0;
                            }
                            
                            .status-paid { 
                                color: #047857; 
                                font-weight: bold;
                            }
                            
                            .status-unpaid { 
                                color: #c2410c; 
                                font-weight: bold;
                            }
                            
                            .footer { 
                                margin-top: 30px; 
                                padding-top: 12px; 
                                border-top: 1px solid #000; 
                                text-align: center; 
                                font-size: 10px;
                                color: #555;
                            }
                            
                            .footer-note {
                                margin: 5px 0;
                            }
                            
                            @media print {
                                body { 
                                    padding: 10mm; 
                                }
                                
                                .no-print { 
                                    display: none !important; 
                                }
                                
                                table {
                                    page-break-inside: avoid;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="bill-container">
                            <div class="header">
                                <div class="logo-section">
                                    <img src="/android-chrome-512x512.png" alt="Logo" onerror="this.style.display='none'" />
                                </div>
                                <div class="header-center">
                                    <div class="clinic-name">${clinicInfo.name}</div>
                                    <div class="tagline">Women's healthcare - all ages, all stages</div>
                                    <div class="clinic-contact">
                                        ${clinicInfo.address}<br>
                                        Phone: ${clinicInfo.phone} | Email: ${clinicInfo.email}
                                    </div>
                                </div>
                                <div class="logo-section"></div>
                            </div>

                            <div class="doctor-section">
                                <div class="doctor-name">Dr. ${clinicInfo.doctorName}</div>
                                <div class="doctor-qualification">${clinicInfo.doctorQualification}</div>
                            </div>

                            <div class="bill-title">BILL / INVOICE</div>

                            <div class="bill-details">
                                <div class="detail-item">
                                    <span class="detail-label">Bill No:</span>
                                    <span class="detail-value">#${bill._id.slice(-8).toUpperCase()}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Date:</span>
                                    <span class="detail-value">${formatDate(bill.billDate)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Patient:</span>
                                    <span class="detail-value">${bill.patientId?.fullName || 'N/A'}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Phone:</span>
                                    <span class="detail-value">${bill.patientId?.phone || 'N/A'}</span>
                                </div>
                            </div>

                            <table>
                                <thead>
                                    <tr>
                                        <th style="width: 50px;">S.No</th>
                                        <th>Service</th>
                                        <th style="width: 120px;">Payment Mode</th>
                                        <th style="width: 100px;">Amount (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${items.map((item, index) => `
                                    <tr>
                                        <td>${index + 1}</td>
                                        <td>${item.service}</td>
                                        <td>${item.paymentMethod}</td>
                                        <td>₹${item.amount.toFixed(2)}</td>
                                    </tr>
                                    `).join('')}
                                    <tr class="total-row">
                                        <td colspan="3">TOTAL</td>
                                        <td>₹${bill.totalAmount.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div class="payment-info">
                                <div class="payment-row">
                                    <span><strong>Payment Status:</strong></span>
                                    <span class="${bill.status === 'paid' ? 'status-paid' : 'status-unpaid'}">
                                        ${bill.status === 'paid' ? 'PAID' : 'UNPAID'}
                                    </span>
                                </div>
                                ${bill.paidDate ? `
                                <div class="payment-row">
                                    <span><strong>Payment Date:</strong></span>
                                    <span>${formatDate(bill.paidDate)}</span>
                                </div>
                                ` : ''}
                            </div>

                            <div class="footer">
                                <div class="footer-note">Thank you for choosing ${clinicInfo.name}</div>
                                <div class="footer-note">This is a computer-generated receipt and doesn't require signature / stamp.</div>
                            </div>
                        </div>
                    </body>
                </html>
            `);
            
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 300);
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download bill. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    const handleShare = async () => {
        const shareText = `BILL - ${clinicInfo.name}\n\n` +
            `Bill No: #${bill._id.slice(-8).toUpperCase()}\n` +
            `Date: ${formatDate(bill.billDate)}\n` +
            `Patient: ${bill.patientId?.fullName || 'N/A'}\n` +
            `Total Amount: Rs.${bill.totalAmount}\n` +
            `Status: ${bill.status === 'paid' ? 'Paid' : 'Unpaid'}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Medical Bill',
                    text: shareText
                });
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Share error:', error);
                }
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareText);
                alert('Bill details copied to clipboard');
            } catch (error) {
                console.error('Clipboard error:', error);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-4xl w-full my-8 shadow-2xl">
                {/* Header Actions */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-300 bg-gray-50">
                    <h3 className="text-xl font-semibold text-gray-900">Bill Details</h3>
                    <div className="flex gap-3">
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 font-medium text-sm"
                        >
                            <Download size={16} />
                            {downloading ? 'Preparing...' : 'Download'}
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium text-sm"
                        >
                            <Share2 size={16} />
                            Share
                        </button>
                        <button 
                            onClick={onClose} 
                            className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 p-2 rounded transition"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Bill Content */}
                <div className="p-8 max-h-[calc(100vh-180px)] overflow-y-auto">
                    {/* Header - Logo Left, Name Center */}
                    <div className="flex items-start justify-between mb-5 pb-4 border-b-2 border-gray-900">
                        <div className="w-20 flex-shrink-0">
                            <img 
                                src="/android-chrome-512x512.png" 
                                alt="Clinic Logo" 
                                className="w-16 h-16 object-contain"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                        </div>
                        <div className="flex-1 text-center px-4">
                            <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide mb-1">{clinicInfo.name}</h2>
                            <p className="text-xs text-gray-600 italic mb-2">Women's healthcare - all ages, all stages</p>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                {clinicInfo.address}<br/>
                                Phone: {clinicInfo.phone} | Email: {clinicInfo.email}
                            </p>
                        </div>
                        <div className="w-20"></div>
                    </div>

                    {/* Doctor Info */}
                    <div className="mb-5 bg-gray-50 p-3 border-l-4 border-gray-900">
                        <p className="text-sm font-bold text-gray-900 mb-1">Dr. {clinicInfo.doctorName}</p>
                        <p className="text-xs text-gray-600 leading-snug">{clinicInfo.doctorQualification}</p>
                    </div>

                    {/* Bill Title */}
                    <h3 className="text-center text-lg font-bold uppercase tracking-wider my-5">Bill / Invoice</h3>

                    {/* Compact Bill Details */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-5 text-xs">
                        <div className="flex">
                            <span className="font-semibold text-gray-900 w-24">Bill No:</span>
                            <span className="text-gray-700">#{bill._id.slice(-8).toUpperCase()}</span>
                        </div>
                        <div className="flex">
                            <span className="font-semibold text-gray-900 w-24">Date:</span>
                            <span className="text-gray-700">{formatDate(bill.billDate)}</span>
                        </div>
                        <div className="flex">
                            <span className="font-semibold text-gray-900 w-24">Patient:</span>
                            <span className="text-gray-700">{bill.patientId?.fullName || 'N/A'}</span>
                        </div>
                        <div className="flex">
                            <span className="font-semibold text-gray-900 w-24">Phone:</span>
                            <span className="text-gray-700">{bill.patientId?.phone || 'N/A'}</span>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="my-6 border border-gray-900">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-gray-900 text-white">
                                    <th className="px-3 py-2 text-left font-semibold w-12">S.No</th>
                                    <th className="px-3 py-2 text-left font-semibold">Service</th>
                                    <th className="px-3 py-2 text-left font-semibold w-32">Payment Mode</th>
                                    <th className="px-3 py-2 text-right font-semibold w-28">Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {items.map((item, index) => (
                                    <tr key={index} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                        <td className="px-3 py-2 text-gray-900">{index + 1}</td>
                                        <td className="px-3 py-2 text-gray-900 font-medium">{item.service}</td>
                                        <td className="px-3 py-2 text-gray-700">{item.paymentMethod}</td>
                                        <td className="px-3 py-2 text-right text-gray-900 font-semibold">₹{item.amount.toFixed(2)}</td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-100 border-t-2 border-gray-900">
                                    <td colSpan="3" className="px-3 py-3 text-right font-bold text-gray-900 text-sm">TOTAL</td>
                                    <td className="px-3 py-3 text-right font-bold text-gray-900 text-base">₹{bill.totalAmount.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Payment Status */}
                    <div className="my-5 bg-gray-50 p-4 border border-gray-300 text-xs">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-gray-900">Payment Status:</span>
                            <span className={`font-bold ${bill.status === 'paid' ? 'text-green-700' : 'text-orange-700'}`}>
                                {bill.status === 'paid' ? 'PAID' : 'UNPAID'}
                            </span>
                        </div>
                        {bill.paidDate && (
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-900">Payment Date:</span>
                                <span className="text-gray-700">{formatDate(bill.paidDate)}</span>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="text-center pt-4 mt-6 border-t border-gray-900 text-xs text-gray-600">
                        <p className="mb-1">Thank you for choosing {clinicInfo.name}</p>
                        <p>This is a computer-generated document</p>
                    </div>
                </div>
            </div>
        </div>
    );
}