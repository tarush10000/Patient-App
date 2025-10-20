import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import msg91Service from '@/lib/msg91';

export async function POST(request) {
    try {
        const { accessToken, newPin } = await request.json();

        if (!accessToken || !newPin) {
            return NextResponse.json(
                { error: 'Access token and new PIN are required' },
                { status: 400 }
            );
        }

        // Validate PIN format
        if (!/^\d{6}$/.test(newPin)) {
            return NextResponse.json(
                { error: 'PIN must be exactly 6 digits' },
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

        // Find user by phone
        const user = await User.findOne({ phone: verificationResult.phone });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Update PIN
        user.pin = newPin;
        await user.save();

        return NextResponse.json({
            message: 'PIN reset successfully'
        });

    } catch (error) {
        console.error('Forgot PIN error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to reset PIN' },
            { status: 500 }
        );
    }
}