import { NextResponse } from 'next/server';
import whatsBoostService from '@/lib/whatsboost';
import dbConnect from '@/lib/mongodb';
import OTP from '@/models/OTP';

export async function POST(request) {
    try {
        const { phone } = await request.json();

        if (!phone) {
            return NextResponse.json(
                { error: 'Phone number is required' },
                { status: 400 }
            );
        }

        // Format phone number (remove country code if present)
        const formattedPhone = phone;
        // .replace(/^\+?91/, '');

        // Validate phone number (10 digits)
        if (!/^\d{10}$/.test(formattedPhone)) {
            return NextResponse.json(
                { error: 'Invalid phone number format' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check for rate limiting - allow only one OTP per 30 seconds
        const recentOTP = await OTP.findOne({
            phone: formattedPhone,
            createdAt: { $gte: new Date(Date.now() - 30000) }
        });

        if (recentOTP) {
            return NextResponse.json(
                { error: 'Please wait 30 seconds before requesting another OTP' },
                { status: 429 }
            );
        }

        // Invalidate any previous OTPs for this phone
        await OTP.updateMany(
            { phone: formattedPhone, verified: false },
            { verified: true }
        );

        // Generate new OTP
        const otp = whatsBoostService.generateOTP();

        // Save OTP to database
        const otpDoc = new OTP({
            phone: formattedPhone,
            otp: otp,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        });
        await otpDoc.save();

        // Send OTP via WhatsBoost
        const result = await whatsBoostService.sendOTP(formattedPhone, otp);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Failed to send OTP. Please try again.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'OTP sent successfully to your WhatsApp',
            otpId: otpDoc._id
        });

    } catch (error) {
        console.error('Send OTP error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send OTP' },
            { status: 500 }
        );
    }
}