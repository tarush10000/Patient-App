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
        const { id } = params;

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
