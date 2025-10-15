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

        // Normalize the date to midnight UTC to avoid timezone issues
        const blockDate = new Date(date);
        blockDate.setHours(0, 0, 0, 0);

        console.log('Blocking slot on date:', blockDate.toISOString(), 'time:', timeSlot);

        // Check if this slot is already blocked
        const existing = await BlockedSlot.findOne({
            date: {
                $gte: blockDate,
                $lt: new Date(blockDate.getTime() + 24 * 60 * 60 * 1000)
            },
            timeSlot: timeSlot
        });

        if (existing) {
            return NextResponse.json(
                { error: 'This slot is already blocked' },
                { status: 409 }
            );
        }

        const blockedSlot = await BlockedSlot.create({
            date: blockDate,
            timeSlot,
            reason,
            createdBy: user._id
        });

        console.log('Created blocked slot:', blockedSlot);

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

// DELETE unblock a slot
export async function DELETE(request) {
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

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Blocked slot ID is required' },
                { status: 400 }
            );
        }

        const blockedSlot = await BlockedSlot.findByIdAndDelete(id);

        if (!blockedSlot) {
            return NextResponse.json(
                { error: 'Blocked slot not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'Slot unblocked successfully'
        });

    } catch (error) {
        console.error('Unblock slot error:', error);
        return NextResponse.json(
            { error: 'Failed to unblock slot' },
            { status: 500 }
        );
    }
}