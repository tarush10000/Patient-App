import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OTP from '@/models/OTP';
import { generateOTP, sendOTP } from '@/lib/sms';

export async function POST(request) {
    try {
        await connectDB();

        const { phone } = await request.json();

        if (!phone) {
            return NextResponse.json(
                { error: 'Phone number is required' },
                { status: 400 }
            );
        }

        // Clean phone number
        const cleanPhone = phone.replace(/^\+91/, '').replace(/\s/g, '');

        // Validate phone number format
        if (!/^\d{10}$/.test(cleanPhone)) {
            return NextResponse.json(
                { error: 'Invalid phone number. Please enter a valid 10-digit mobile number.' },
                { status: 400 }
            );
        }

        // Check rate limiting - prevent spam
        const recentOTP = await OTP.findOne({
            phone: cleanPhone,
            createdAt: { $gt: new Date(Date.now() - 60000) } // Within last 1 minute
        });

        if (recentOTP) {
            return NextResponse.json(
                { error: 'Please wait 1 minute before requesting another OTP' },
                { status: 429 }
            );
        }

        // Generate OTP
        const otp = generateOTP();

        // Save OTP to database
        await OTP.create({
            phone: cleanPhone,
            otp,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        });

        // Send OTP via Fast2SMS
        try {
            const smsResult = await sendOTP(cleanPhone, otp);

            return NextResponse.json({
                message: 'OTP sent successfully',
                requestId: smsResult.requestId,
                // Only send OTP in development mode for testing
                ...(process.env.NODE_ENV === 'development' && { otp })
            });
        } catch (smsError) {
            console.error('SMS sending failed:', smsError);

            // Delete the OTP from database since SMS failed
            await OTP.deleteOne({ phone: cleanPhone, otp });

            return NextResponse.json(
                {
                    error: 'Failed to send OTP. Please check your phone number and try again.',
                    details: process.env.NODE_ENV === 'development' ? smsError.message : undefined
                },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Send OTP error:', error);
        return NextResponse.json(
            { error: 'Failed to send OTP. Please try again.' },
            { status: 500 }
        );
    }
}