import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OTP from '@/models/OTP';
import { sendOTPViaSMS } from '@/lib/msg91Sms';

export async function POST(request) {
    try {
        const { phone } = await request.json();

        if (!phone) {
            return NextResponse.json(
                { error: 'Phone number is required' },
                { status: 400 }
            );
        }

        const cleanPhone = phone.replace(/\D/g, '').slice(-10);

        if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
            return NextResponse.json(
                { error: 'Invalid phone number.' },
                { status: 400 }
            );
        }

        await connectDB();

        // Rate-limit: block if an OTP was sent in the last 30 seconds
        const recentOtp = await OTP.findOne({
            phone: cleanPhone,
            verified: false,
            createdAt: { $gt: new Date(Date.now() - 30 * 1000) }
        });

        if (recentOtp) {
            return NextResponse.json(
                { error: 'Please wait 30 seconds before requesting another OTP.' },
                { status: 429 }
            );
        }

        // Invalidate previous unused OTPs
        await OTP.deleteMany({ phone: cleanPhone, verified: false });

        // Generate a new 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        await OTP.create({
            phone: cleanPhone,
            otp: otpCode,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });

        // Send via MSG91 Flow API (DLT Template 7)
        await sendOTPViaSMS(cleanPhone, otpCode);

        console.log(`[resend-otp] OTP resent to ${cleanPhone}`);

        return NextResponse.json({
            success: true,
            message: 'OTP resent successfully'
        });

    } catch (error) {
        console.error('[resend-otp] Error:', error.message);
        return NextResponse.json(
            { error: error.message || 'Failed to resend OTP' },
            { status: 500 }
        );
    }
}