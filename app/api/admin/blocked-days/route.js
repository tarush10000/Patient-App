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

        const blockedDay = await BlockedDay.create({
            date: new Date(date),
            reason,
            createdBy: user._id
        });

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