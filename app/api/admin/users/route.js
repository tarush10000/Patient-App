import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { authenticate, authorizeRoles } from '@/middleware/auth';

// GET all users
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

        const users = await User.find().select('-password').sort({ createdAt: -1 });

        return NextResponse.json({ users });

    } catch (error) {
        console.error('Get users error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}