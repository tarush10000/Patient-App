import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import OTP from '@/models/OTP';
import { generateToken } from '@/lib/auth';

export async function POST(request) {
    try {
        await connectDB();

        const { phone, otp, fullName } = await request.json();

        if (!phone || !otp) {
            return NextResponse.json(
                { error: 'Phone and OTP are required' },
                { status: 400 }
            );
        }

        // Find the most recent OTP for this phone
        const otpRecord = await OTP.findOne({
            phone,
            otp,
            verified: false,
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return NextResponse.json(
                { error: 'Invalid or expired OTP' },
                { status: 401 }
            );
        }

        // Mark OTP as verified
        otpRecord.verified = true;
        await otpRecord.save();

        // Find or create user
        let user = await User.findOne({ phone });

        if (!user) {
            // Create new user if doesn't exist
            if (!fullName) {
                return NextResponse.json(
                    { error: 'Full name is required for new users' },
                    { status: 400 }
                );
            }

            user = await User.create({
                fullName,
                phone,
                role: 'patient',
                isVerified: true
            });
        } else {
            // Mark existing user as verified
            user.isVerified = true;
            await user.save();
        }

        // Generate token
        const token = generateToken(user._id, user.role);

        return NextResponse.json({
            message: 'OTP verified successfully',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                phone: user.phone,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        return NextResponse.json(
            { error: 'Failed to verify OTP' },
            { status: 500 }
        );
    }
}