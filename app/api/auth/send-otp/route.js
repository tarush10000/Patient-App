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
                { error: 'Invalid phone number. Must be a valid 10-digit Indian mobile number.' },
                { status: 400 }
            );
        }

        await connectDB();

        // Invalidate any existing unused OTPs for this number
        await OTP.deleteMany({ phone: cleanPhone, verified: false });

        // Generate a 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP to DB (auto-expires in 10 minutes via model TTL)
        await OTP.create({
            phone: cleanPhone,
            otp: otpCode,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });

        // Send OTP via MSG91 Flow API (DLT Template 7)
        await sendOTPViaSMS(cleanPhone, otpCode);

        console.log(`[send-otp] OTP sent to ${cleanPhone}`);

        return NextResponse.json({
            success: true,
            message: 'OTP sent successfully'
        });

    } catch (error) {
        console.error('[send-otp] Error:', error.message);
        return NextResponse.json(
            { error: error.message || 'Failed to send OTP' },
            { status: 500 }
        );
    }
}