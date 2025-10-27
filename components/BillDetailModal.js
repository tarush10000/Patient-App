import { useRef } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

const BillDetailModal = ({ bill, clinicInfo, onClose }) => {
    const billContentRef = useRef(null);
    console.log('Bill Data:', bill);

    const handleDownloadPDF = async () => {
        const element = billContentRef.current;


        if (!element) {
            console.error('Bill content element not found');
            return;
        }

        const billNo = bill?.billNo || 'Bill';

        try {
            const dataUrl = await toPng(element, {
                quality: 1,
                pixelRatio: 2,
                backgroundColor: '#ffffff',
            });

            const pdf = new jsPDF('p', 'mm', 'a4');
            const img = new Image();
            img.src = dataUrl;

            img.onload = () => {
                const imgWidth = 210;
                const imgHeight = (img.height * imgWidth) / img.width;
                pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight);
                pdf.save(`Bill_${billNo}.pdf`);
            };
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    const handleShare = async () => {
        const element = billContentRef.current;

        if (!element) {
            console.error('Bill content element not found');
            return;
        }

        const billNo = bill?.billNo || 'Bill';

        try {
            const blob = await toPng(element, {
                quality: 1,
                pixelRatio: 2,
                backgroundColor: '#ffffff',
            }).then(dataUrl => {
                return fetch(dataUrl).then(res => res.blob());
            });

            const file = new File([blob], `Bill_${billNo}.png`, {
                type: 'image/png'
            });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Bill Details',
                        text: `Bill #${billNo}`,
                    });
                } catch (shareError) {
                    if (shareError.name !== 'AbortError') {
                        console.error('Error sharing:', shareError);
                    }
                }
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Bill_${billNo}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Error sharing:', error);
            alert('Failed to share. Please try again.');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header with buttons */}
                <div className="flex items-center justify-between p-4 border-b modal-header-buttons">
                    <h2 className="text-xl font-semibold">Bill Details</h2>

                    <div className="flex gap-2">
                        <button
                            onClick={handleDownloadPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download
                        </button>

                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print
                        </button>

                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            Share
                        </button>

                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Bill Content with Inline Styles */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                    <div ref={billContentRef} data-print-content style={{ padding: '32px', backgroundColor: '#ffffff' }}>
                        {/* Header - Logo Left, Name Center */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            marginBottom: '20px',
                            paddingBottom: '16px',
                            borderBottom: '2px solid #000'
                        }}>
                            {/* Logo */}
                            <div style={{ flex: '0 0 80px' }}>
                                <img
                                    src="/logo.png"
                                    alt="Clinic Logo"
                                    style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                                />
                            </div>

                            {/* Center Content */}
                            <div style={{ flex: '1', textAlign: 'center', padding: '0 16px' }}>
                                <h2 style={{
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    marginBottom: '4px'
                                }}>
                                    {clinicInfo.name}
                                </h2>
                                <p style={{ fontSize: '12px', color: '#4b5563', fontStyle: 'italic', marginBottom: '8px' }}>
                                    {clinicInfo.tagline}
                                </p>
                                <p style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.5' }}>
                                    {clinicInfo.address}<br />
                                    Phone: {clinicInfo.phone} | Email: {clinicInfo.email}
                                </p>
                            </div>

                            {/* Right spacer for balance */}
                            <div style={{ flex: '0 0 80px' }}></div>
                        </div>

                        {/* Doctor Info */}
                        <div style={{
                            borderLeft: '4px solid #000',
                            paddingLeft: '16px',
                            marginBottom: '24px'
                        }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000' }}>
                                {clinicInfo.doctorName}
                            </h3>
                            <p style={{ fontSize: '14px', color: '#4b5563' }}>
                                {clinicInfo.doctorQualification}
                            </p>
                        </div>

                        {/* Title */}
                        <h3 style={{
                            fontSize: '28px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            marginBottom: '24px',
                            color: '#111827',
                            letterSpacing: '0.05em'
                        }}>
                            BILL / INVOICE
                        </h3>

                        {/* Bill Details Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '16px',
                            marginBottom: '24px'
                        }}>
                            <div>
                                <div style={{ marginBottom: '12px' }}>
                                    <span style={{ fontWeight: '600', color: '#000', fontSize: '14px' }}>Bill No:</span>
                                    <span style={{ marginLeft: '8px', color: '#4b5563', fontSize: '14px' }}>
                                        #{bill?._id?.toString().slice(-8).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <span style={{ fontWeight: '600', color: '#000', fontSize: '14px' }}>Patient:</span>
                                    <span style={{ marginLeft: '8px', color: '#4b5563', fontSize: '14px' }}>
                                        {bill?.patientId?.fullName}
                                    </span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ marginBottom: '12px' }}>
                                    <span style={{ fontWeight: '600', color: '#000', fontSize: '14px' }}>Date:</span>
                                    <span style={{ marginLeft: '8px', color: '#4b5563', fontSize: '14px' }}>
                                        {bill?.billDate ? new Date(bill.billDate).toLocaleDateString('en-IN', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                        }) : ''}
                                    </span>
                                </div>
                                <div>
                                    <span style={{ fontWeight: '600', color: '#000', fontSize: '14px' }}>Phone:</span>
                                    <span style={{ marginLeft: '8px', color: '#4b5563', fontSize: '14px' }}>
                                        {bill?.patientId?.phone}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Services Table */}
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            marginBottom: '24px'
                        }}>
                            <thead>
                                <tr style={{ backgroundColor: '#1f2937' }}>
                                    <th style={{
                                        textAlign: 'left',
                                        padding: '12px 16px',
                                        color: '#ffffff',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        backgroundColor: '#1f2937'
                                    }}>
                                        S.No
                                    </th>
                                    <th style={{
                                        textAlign: 'left',
                                        padding: '12px 16px',
                                        color: '#ffffff',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        backgroundColor: '#1f2937'
                                    }}>
                                        Service
                                    </th>
                                    <th style={{
                                        textAlign: 'left',
                                        padding: '12px 16px',
                                        color: '#ffffff',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        backgroundColor: '#1f2937'
                                    }}>
                                        Payment Mode
                                    </th>
                                    <th style={{
                                        textAlign: 'right',
                                        padding: '12px 16px',
                                        color: '#ffffff',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        backgroundColor: '#1f2937'
                                    }}>
                                        Amount (₹)
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    // Parse the CSV string: "Consultation, 1000, UPI,"
                                    if (bill?.items && typeof bill.items === 'string') {
                                        const parts = bill.items.split(',').map(p => p.trim());
                                        const service = parts[0] || '';
                                        const amount = parts[1] || '0';
                                        const paymentMode = parts[2] || '';

                                        return (
                                            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                                                    1
                                                </td>
                                                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                                                    {service}
                                                </td>
                                                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                                                    {paymentMode}
                                                </td>
                                                <td style={{
                                                    padding: '12px 16px',
                                                    fontSize: '14px',
                                                    color: '#111827',
                                                    textAlign: 'right'
                                                }}>
                                                    ₹{parseFloat(amount || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return (
                                        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                            <td colSpan="4" style={{
                                                padding: '12px 16px',
                                                fontSize: '14px',
                                                color: '#6b7280',
                                                textAlign: 'center'
                                            }}>
                                                No services found
                                            </td>
                                        </tr>
                                    );
                                })()}

                                {/* Total Row */}
                                <tr style={{ borderTop: '2px solid #000', backgroundColor: '#f9fafb' }}>
                                    <td colSpan="3" style={{
                                        padding: '12px 16px',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        color: '#000',
                                        textAlign: 'right'
                                    }}>
                                        TOTAL
                                    </td>
                                    <td style={{
                                        padding: '12px 16px',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        color: '#000',
                                        textAlign: 'right'
                                    }}>
                                        ₹{parseFloat(bill?.totalAmount || 0).toFixed(2)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Payment Status */}
                        <div style={{
                            backgroundColor: '#f9fafb',
                            padding: '16px',
                            borderRadius: '8px',
                            marginBottom: '24px',
                            border: '1px solid #e5e7eb'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px'
                            }}>
                                <span style={{ fontWeight: '600', color: '#000', fontSize: '14px' }}>
                                    Payment Status:
                                </span>
                                <span style={{
                                    fontWeight: 'bold',
                                    color: bill?.status?.toLowerCase() === 'paid' ? '#16a34a' : '#dc2626',
                                    fontSize: '14px',
                                    textTransform: 'uppercase'
                                }}>
                                    {bill?.status}
                                </span>
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontWeight: '600', color: '#000', fontSize: '14px' }}>
                                    Payment Date:
                                </span>
                                <span style={{ color: '#4b5563', fontSize: '14px' }}>
                                    {bill?.paidDate ? new Date(bill.paidDate).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    }) : ''}
                                </span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ textAlign: 'center', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
                            <p style={{ fontSize: '14px', color: '#111827', marginBottom: '8px', fontWeight: '600' }}>
                                Thank you for choosing {clinicInfo.name}
                            </p>
                            <p style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                                This is a computer-generated receipt and doesn't require signature / stamp.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillDetailModal;