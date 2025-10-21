import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import msg91Service from '@/lib/msg91';

export async function POST(request) {
    try {
        const { accessToken, phone, newPin } = await request.json();

        console.log('=== Forgot PIN Request ===');
        console.log('Access Token:', accessToken ? 'Yes' : 'No');
        console.log('Phone:', phone);
        console.log('New PIN:', newPin ? 'Yes' : 'No');

        if (!accessToken || !newPin) {
            return NextResponse.json(
                { error: 'Access token and new PIN are required' },
                { status: 400 }
            );
        }

        if (!phone) {
            return NextResponse.json(
                { error: 'Phone number is required' },
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
        console.log('Verifying access token...');
        const verificationResult = await msg91Service.verifyAccessToken(accessToken);

        if (!verificationResult.verified) {
            return NextResponse.json(
                { error: 'OTP verification failed' },
                { status: 400 }
            );
        }

        await connectDB();

        // Format phone number consistently
        const formattedPhone = phone.replace(/[^0-9]/g, '').replace(/^91/, '');
        console.log('Formatted phone:', formattedPhone);

        // Find user by phone
        const user = await User.findOne({ phone: formattedPhone });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Update PIN
        console.log('Updating PIN for user:', user._id);
        user.pin = newPin;
        await user.save();

        console.log('=== Forgot PIN Success ===');
        return NextResponse.json({
            message: 'PIN reset successfully'
        });

    } catch (error) {
        console.error('=== Forgot PIN Error ===');
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to reset PIN' },
            { status: 500 }
        );
    }
}