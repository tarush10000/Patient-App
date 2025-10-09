import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BlockedSlot from '@/models/BlockedSlot';
import { authenticate, authorizeRoles } from '@/middleware/auth';

// GET all blocked slots
export async function GET(request) {
    try {
        const authResult = await authenticate(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { user } = authResult;
        const roleCheck = await authorizeRoles(user, ['admin', 'reception']);
        if (roleCheck.error) {
            return NextResponse.json({ error: roleCheck.error }, { status: roleCheck.status });
        }

        await connectDB();

        const blockedSlots = await BlockedSlot.find()
            .populate('createdBy', 'fullName')
            .sort({ date: 1, timeSlot: 1 });

        return NextResponse.json({ blockedSlots });

    } catch (error) {
        console.error('Get blocked slots error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch blocked slots' },
            { status: 500 }
        );
    }
}

// POST create blocked slot
export async function POST(request) {
    try {
        const authResult = await authenticate(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { user } = authResult;
        const roleCheck = await authorizeRoles(user, ['admin']);
        if (roleCheck.error) {
            return NextResponse.json({ error: roleCheck.error }, { status: roleCheck.status });
        }

        await connectDB();

        const { date, timeSlot, reason } = await request.json();

        if (!date || !timeSlot || !reason) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const blockedSlot = await BlockedSlot.create({
            date: new Date(date),
            timeSlot,
            reason,
            createdBy: user._id
        });

        return NextResponse.json({
            message: 'Slot blocked successfully',
            blockedSlot
        }, { status: 201 });

    } catch (error) {
        if (error.code === 11000) {
            return NextResponse.json(
                { error: 'This slot is already blocked' },
                { status: 409 }
            );
        }
        console.error('Block slot error:', error);
        return NextResponse.json(
            { error: 'Failed to block slot' },
            { status: 500 }
        );
    }
}
