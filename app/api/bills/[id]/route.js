import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Bill from '@/models/Bill';
import { authenticate } from '@/middleware/auth';

export async function PATCH(request, { params }) {
    try {
        const authResult = await authenticate(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        await connectDB();
        const { user } = authResult;
        const { id } = await params;

        const bill = await Bill.findById(id);

        if (!bill) {
            return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
        }

        // Patients can only update their own bills (mark as paid)
        if (user.role === 'patient' && bill.patientId.toString() !== user._id.toString()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const updates = await request.json();

        // If marking as paid, add paidDate
        if (updates.status === 'paid' && !bill.paidDate) {
            updates.paidDate = new Date();
        }

        Object.assign(bill, updates);
        await bill.save();

        return NextResponse.json({
            message: 'Bill updated successfully',
            bill
        });

    } catch (error) {
        console.error('Update bill error:', error);
        return NextResponse.json(
            { error: 'Failed to update bill' },
            { status: 500 }
        );
    }
}

export async function PUT(request, { params }) {
    try {
        const authResult = await authenticate(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { user } = authResult;

        if (!['reception', 'admin'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        await connectDB();

        const { id } = await params;
        const { patientId, appointmentId, items, totalAmount, status, paidDate, billDate } = await request.json();

        // Validate required fields
        if (!Array.isArray(items) || items.length === 0 || !Number.isFinite(Number(totalAmount)) || Number(totalAmount) <= 0) {
            return NextResponse.json(
                { error: 'Bill items and a valid total amount are required' },
                { status: 400 }
            );
        }

        const normalizedItems = items.map(item => ({
            service: String(item.service || '').trim(),
            amount: Number(item.amount),
            paymentMethod: String(item.paymentMethod || '').trim()
        }));

        if (normalizedItems.some(item => !item.service || !Number.isFinite(item.amount) || item.amount <= 0 || !item.paymentMethod)) {
            return NextResponse.json(
                { error: 'Each bill item must have a service, valid amount, and payment method' },
                { status: 400 }
            );
        }

        // Check if bill exists
        const existingBill = await Bill.findById(id);
        if (!existingBill) {
            return NextResponse.json(
                { error: 'Bill not found' },
                { status: 404 }
            );
        }

        // Prepare update data
        const updateData = {
            items: normalizedItems.map(item =>
                `${item.service}, ${item.amount}, ${item.paymentMethod}`
            ).join(', '),
            totalAmount: Number(totalAmount),
            status: status || 'unpaid',
            updatedAt: new Date()
        };

        if (paidDate) {
            updateData.paidDate = paidDate;
        }

        if (billDate) {
            updateData.billDate = billDate;
        }

        // Update patientId if provided
        if (patientId) {
            updateData.patientId = patientId;
        }

        // Update appointmentId if provided
        if (appointmentId) {
            updateData.appointmentId = appointmentId;
        }

        // Handle paidDate based on status
        if (status === 'paid') {
            updateData.paidDate = paidDate || new Date();
        } else if (status === 'unpaid') {
            updateData.paidDate = null;
        }

        // Update the bill
        const updatedBill = await Bill.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('patientId', 'fullName phone')
            .populate('appointmentId');

        return NextResponse.json({
            message: 'Bill updated successfully',
            bill: updatedBill
        }, { status: 200 });

    } catch (error) {
        console.error('Update bill error:', error);
        return NextResponse.json(
            { error: 'Failed to update bill' },
            { status: 500 }
        );
    }
}