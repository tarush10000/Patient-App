import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BlockedDay from '@/models/BlockedDay';
import { authenticate, authorizeRoles } from '@/middleware/auth';

// GET all blocked days
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

        const blockedDays = await BlockedDay.find()
            .populate('createdBy', 'fullName')
            .sort({ date: 1 });

        return NextResponse.json({ blockedDays });

    } catch (error) {
        console.error('Get blocked days error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch blocked days' },
            { status: 500 }
        );
    }
}

// POST create blocked day
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

        const { date, reason } = await request.json();

        if (!date || !reason) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Normalize the date to midnight UTC to avoid timezone issues
        const blockDate = new Date(date);
        blockDate.setHours(0, 0, 0, 0);

        console.log('Blocking date:', blockDate.toISOString());

        // Check if this date is already blocked
        const existing = await BlockedDay.findOne({
            date: {
                $gte: blockDate,
                $lt: new Date(blockDate.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        if (existing) {
            return NextResponse.json(
                { error: 'This day is already blocked' },
                { status: 409 }
            );
        }

        const blockedDay = await BlockedDay.create({
            date: blockDate,
            reason,
            createdBy: user._id
        });

        console.log('Created blocked day:', blockedDay);

        return NextResponse.json({
            message: 'Day blocked successfully',
            blockedDay
        }, { status: 201 });

    } catch (error) {
        if (error.code === 11000) {
            return NextResponse.json(
                { error: 'This day is already blocked' },
                { status: 409 }
            );
        }
        console.error('Block day error:', error);
        return NextResponse.json(
            { error: 'Failed to block day' },
            { status: 500 }
        );
    }
}

// DELETE unblock a day
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
                { error: 'Blocked day ID is required' },
                { status: 400 }
            );
        }

        const blockedDay = await BlockedDay.findByIdAndDelete(id);

        if (!blockedDay) {
            return NextResponse.json(
                { error: 'Blocked day not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'Day unblocked successfully'
        });

    } catch (error) {
        console.error('Unblock day error:', error);
        return NextResponse.json(
            { error: 'Failed to unblock day' },
            { status: 500 }
        );
    }
}