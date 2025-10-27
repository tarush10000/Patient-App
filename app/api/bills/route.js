import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Bill from '@/models/Bill';
import { authenticate } from '@/middleware/auth';

// GET all bills
export async function GET(request) {
    try {
        const authResult = await authenticate(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        await connectDB();
        const { user } = authResult;

        let query = {};

        // Patients can only see their own bills
        if (user.role === 'patient') {
            query.patientId = user._id;
        }

        const bills = await Bill.find(query)
            .populate('patientId', 'fullName phone')
            .populate('appointmentId')
            .sort({ billDate: -1 });

        return NextResponse.json({ bills });

    } catch (error) {
        console.error('Get bills error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bills' },
            { status: 500 }
        );
    }
}

// POST create new bill (reception/admin only)
export async function POST(request) {
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

        const { patientId, appointmentId, items, totalAmount, status, paidDate } = await request.json();

        if (!items || !totalAmount) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Allow either patientId OR guestPatient
        if (!patientId && !guestPatient) {
            return NextResponse.json(
                { error: 'Either patientId or guest patient info is required' },
                { status: 400 }
            );
        }

        const billData = {
            appointmentId: appointmentId || undefined,
            items,
            totalAmount,
            status: status || 'unpaid',
            createdBy: user._id
        };

        // Add patientId OR guestPatient
        if (patientId) {
            billData.patientId = patientId;
        } else if (guestPatient) {
            billData.guestPatient = guestPatient;
        }

        // Add paidDate if status is paid
        if (status === 'paid' && paidDate) {
            billData.paidDate = paidDate;
        }

        const bill = await Bill.create(billData);

        return NextResponse.json({
            message: 'Bill created successfully',
            bill
        }, { status: 201 });

    } catch (error) {
        console.error('Create bill error:', error);
        return NextResponse.json(
            { error: 'Failed to create bill' },
            { status: 500 }
        );
    }
}
