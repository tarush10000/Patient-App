import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';

export async function POST(request) {
    try {
        await connectDB();

        const { phone, password, rememberMe } = await request.json();

        if (!phone || !password) {
            return NextResponse.json(
                { error: 'Phone and password are required' },
                { status: 400 }
            );
        }

        const user = await User.findOne({ phone });

        if (!user || !user.password) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Generate token with remember me option
        const tokenExpiry = rememberMe ? '30d' : '7d';
        const token = generateToken(user._id, user.role, tokenExpiry);

        const response = NextResponse.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                phone: user.phone,
                email: user.email,
                role: user.role
            }
        });

        if (rememberMe) {
            response.cookies.set('authToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 // 30 days
            });
        }

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}