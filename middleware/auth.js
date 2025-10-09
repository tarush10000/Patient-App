import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function authenticate(req) {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return { error: 'No token provided', status: 401 };
        }

        const decoded = verifyToken(token);

        if (!decoded) {
            return { error: 'Invalid token', status: 401 };
        }

        await connectDB();
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return { error: 'User not found', status: 404 };
        }

        return { user };
    } catch (error) {
        return { error: 'Authentication failed', status: 401 };
    }
}

export async function authorizeRoles(user, allowedRoles) {
    if (!allowedRoles.includes(user.role)) {
        return { error: 'Unauthorized access', status: 403 };
    }
    return { authorized: true };
}