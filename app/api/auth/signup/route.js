import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';

export async function POST(request) {
    try {
        await connectDB();

        const { fullName, email, phone, password } = await request.json();

        // Validation
        if (!fullName || (!email && !phone) || (!phone && !password)) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                ...(email ? [{ email }] : []),
                ...(phone ? [{ phone }] : [])
            ]
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists with this email or phone' },
                { status: 409 }
            );
        }

        // Create new user
        const user = new User({
            fullName,
            email: email || undefined,
            phone: phone || undefined,
            password: password || undefined,
            role: 'patient', // Default role
            isVerified: phone ? false : true // Email users are verified by default for now
        });

        await user.save();

        // Generate token
        const token = generateToken(user._id, user.role);

        return NextResponse.json({
            message: 'User created successfully',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
