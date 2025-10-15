import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { authenticate } from '@/middleware/auth';

// GET user profile
export async function GET(request) {
    try {
        const authResult = await authenticate(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        await connectDB();
        const { user } = authResult;

        // Return user data without password
        const userData = await User.findById(user._id).select('-password');

        return NextResponse.json({ user: userData });

    } catch (error) {
        console.error('Get profile error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch profile' },
            { status: 500 }
        );
    }
}

// PATCH update user profile
export async function PATCH(request) {
    try {
        const authResult = await authenticate(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        await connectDB();
        const { user } = authResult;
        const updates = await request.json();

        // Validate updates
        const allowedUpdates = ['fullName', 'email', 'phone'];
        const updateKeys = Object.keys(updates);
        const isValidOperation = updateKeys.every(key => allowedUpdates.includes(key));

        if (!isValidOperation) {
            return NextResponse.json(
                { error: 'Invalid updates' },
                { status: 400 }
            );
        }

        // Check if email or phone already exists for another user
        if (updates.email) {
            const existingUser = await User.findOne({ 
                email: updates.email,
                _id: { $ne: user._id }
            });
            if (existingUser) {
                return NextResponse.json(
                    { error: 'Email already in use' },
                    { status: 409 }
                );
            }
        }

        if (updates.phone) {
            const existingUser = await User.findOne({ 
                phone: updates.phone,
                _id: { $ne: user._id }
            });
            if (existingUser) {
                return NextResponse.json(
                    { error: 'Phone number already in use' },
                    { status: 409 }
                );
            }
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        return NextResponse.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}