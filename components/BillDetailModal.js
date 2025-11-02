import { useRef } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

const BillDetailModal = ({ bill, clinicInfo, onClose }) => {
    const billContentRef = useRef(null);
    console.log('Bill Data:', bill);

    const handleDownloadPDF = async () => {
        const originalElement = billContentRef.current;

        if (!originalElement) {
            console.error('Bill content element not found');
            return;
        }

        const billNo = bill?.billNo || 'Bill';
        let clone = null; // Declare clone here to access in finally block

        try {
            // 1. Clone the original element
            clone = originalElement.cloneNode(true);
            console.log('Cloned Element:', clone);
            console.log('Original Element :', originalElement);

            // 2. Style the clone to be "desktop-sized" and hide it off-screen
            // clone.style.position = 'absolute';
            // clone.style.top = '0';
            // clone.style.left = '-9999px';
            // clone.style.width = '1024px';
            // clone.style.height = 'auto';
            // clone.style.boxSizing = 'border-box';
            
            // 3. Append the clone to the document body
            document.body.appendChild(clone);

            // Give the browser a tick to render the clone
            await new Promise(resolve => setTimeout(resolve, 0)); 

            // 4. Generate the image from the CLONE, not the original element
            const dataUrl = await toPng(clone, {
                quality: 1,
                pixelRatio: 2,
                backgroundColor: '#ffffff',
                // Pass the clone's dimensions to ensure it captures the whole thing
                width: clone.scrollWidth,
                height: clone.scrollHeight, 
            });

            // 5. Create the PDF as before
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth(); // A4 width in mm (210)
            const pdfHeight = pdf.internal.pageSize.getHeight(); // A4 height in mm (297)

            const img = new Image();
            img.src = dataUrl;

            img.onload = () => {
                const imgWidth = img.width;
                const imgHeight = img.height;
                
                // Calculate the aspect ratio
                const ratio = imgHeight / imgWidth;
                const calculatedImgHeight = pdfWidth * ratio; // Calculate height based on full A4 width

                let heightLeft = calculatedImgHeight;
                let position = 0;

                // Add the first page
                pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, calculatedImgHeight);
                heightLeft -= pdfHeight;

                // 6. (IMPROVEMENT) Add new pages if the bill is too long
                while (heightLeft > 0) {
                    position = heightLeft - calculatedImgHeight; // This will be a negative offset
                    pdf.addPage();
                    pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, calculatedImgHeight);
                    heightLeft -= pdfHeight;
                }

                pdf.save(`Bill_${billNo}.pdf`);
            };

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            // 7. ALWAYS remove the clone from the DOM, even if an error occurs
            if (clone) {
                document.body.removeChild(clone);
            }
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

                {/* Bill Content with Inline Styles - Scrollable on mobile */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                    <div className="overflow-x-auto">
                        <div ref={billContentRef} data-print-content style={{ padding: '32px', backgroundColor: '#ffffff', minWidth: '600px' }}>
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
                                        // Check if bill.items exists and is a non-empty string
                                        if (bill?.items && typeof bill.items === 'string' && bill.items.trim() !== '') {
                                            const parts = bill.items.split(',').map(p => p.trim());
                                            const groupedItems = [];

                                            // Loop through the parts array, incrementing by 3 each time
                                            for (let i = 0; i < parts.length; i += 3) {
                                                // Ensure we have a full set of 3 items
                                                if (parts[i] && parts[i + 1] && parts[i + 2]) {
                                                    groupedItems.push({
                                                        service: parts[i],
                                                        amount: parts[i + 1],
                                                        paymentMode: parts[i + 2]
                                                    });
                                                }
                                            }

                                            // If we successfully grouped items, map them to table rows
                                            if (groupedItems.length > 0) {
                                                return groupedItems.map((item, index) => (
                                                    <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                                                            {/* Use the map index + 1 for the item number */}
                                                            {index + 1}
                                                        </td>
                                                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                                                            {item.service}
                                                        </td>
                                                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                                                            {item.paymentMode}
                                                        </td>
                                                        <td style={{
                                                            padding: '12px 16px',
                                                            fontSize: '14px',
                                                            color: '#111827',
                                                            textAlign: 'right'
                                                        }}>
                                                            {/* Parse the amount from the item object */}
                                                            ₹{parseFloat(item.amount || 0).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ));
                                            }
                                        }

                                        // Fallback case: If bill.items is missing, not a string, or empty
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
        </div>
    );
};

export default BillDetailModal;