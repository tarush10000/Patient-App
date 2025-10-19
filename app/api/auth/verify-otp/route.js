import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';
import msg91Service from '@/lib/msg91';

export async function POST(request) {
    try {
        const { accessToken, fullName, rememberMe } = await request.json();

        if (!accessToken) {
            return NextResponse.json(
                { error: 'Access token is required' },
                { status: 400 }
            );
        }

        // Verify the access token with MSG91
        const verificationResult = await msg91Service.verifyAccessToken(accessToken);

        if (!verificationResult.verified) {
            return NextResponse.json(
                { error: 'OTP verification failed' },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if user exists
        let user = await User.findOne({ phone: verificationResult.phone });

        if (!user) {
            // New user signup
            if (!fullName) {
                return NextResponse.json(
                    { error: 'Full name is required for new users' },
                    { status: 400 }
                );
            }

            user = await User.create({
                fullName,
                phone: verificationResult.phone,
                email: verificationResult.email,
                isPhoneVerified: true,
                role: 'patient'
            });
        } else {
            // Update phone verification status
            user.isPhoneVerified = true;
            await user.save();
        }

        // Generate token with remember me option
        const tokenExpiry = rememberMe ? '30d' : '7d';
        const token = generateToken(user._id, user.role, tokenExpiry);

        // Set secure HTTP-only cookie for remember me
        const response = NextResponse.json({
            message: user.isNew ? 'Account created successfully' : 'Login successful',
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
        console.error('Verify OTP error:', error);
        return NextResponse.json(
            { error: error.message || 'Verification failed' },
            { status: 500 }
        );
    }
}