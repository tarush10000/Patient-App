import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OTP from '@/models/OTP';
import whatsBoostService from '@/lib/whatsboost';

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

        const cleanPhone = phone;

        // Check rate limiting - allow resend after 30 seconds
        const recentOTP = await OTP.findOne({
            phone: cleanPhone,
            createdAt: { $gt: new Date(Date.now() - 30000) }
        }).sort({ createdAt: -1 });

        if (recentOTP && !recentOTP.verified) {
            const timeSinceLastOTP = Date.now() - recentOTP.createdAt.getTime();
            const waitTime = Math.ceil((30000 - timeSinceLastOTP) / 1000);

            return NextResponse.json(
                { error: `Please wait ${waitTime} seconds before resending OTP` },
                { status: 429 }
            );
        }

        // Invalidate previous OTPs for this phone
        await OTP.updateMany(
            { phone: cleanPhone, verified: false },
            { verified: true }
        );

        // Generate new OTP
        const otp = whatsBoostService.generateOTP();

        // Save new OTP
        await OTP.create({
            phone: cleanPhone,
            otp,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });

        // Send OTP via WhatsBoost
        try {
            const result = await whatsBoostService.sendOTP(cleanPhone, otp);

            if (!result.success) {
                throw new Error('WhatsBoost send failed');
            }

            return NextResponse.json({
                message: 'OTP resent successfully to your WhatsApp',
                ...(process.env.NODE_ENV === 'development' && { otp })
            });
        } catch (smsError) {
            await OTP.deleteOne({ phone: cleanPhone, otp });

            return NextResponse.json(
                { error: 'Failed to resend OTP. Please try again.' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Resend OTP error:', error);
        return NextResponse.json(
            { error: 'Failed to resend OTP' },
            { status: 500 }
        );
    }
}