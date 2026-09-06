import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import OTP from '@/models/OTP';
import msg91Service from '@/lib/msg91';
import { generateToken } from '@/lib/auth';

export async function POST(request) {
    try {
        const { phone, otp, fullName, rememberMe, accessToken } = await request.json();

        console.log('=== Verify OTP Request ===');
        console.log('Phone:', phone);
        console.log('OTP provided:', !!otp);
        console.log('Access Token provided:', !!accessToken);

        if (!phone) {
            return NextResponse.json(
                { error: 'Phone number is required' },
                { status: 400 }
            );
        }

        await connectDB();

        const formattedPhone = phone.replace(/\D/g, '').slice(-10);

        // 1. Verify via MSG91 Server verifyAccessToken API if access-token is passed
        if (accessToken) {
            try {
                console.log('Verifying token via MSG91 verifyAccessToken API...');
                const verifyResult = await msg91Service.verifyAccessToken(accessToken);
                console.log('MSG91 verifyAccessToken verified successfully:', verifyResult);
            } catch (msg91Err) {
                console.error('MSG91 verifyAccessToken failed:', msg91Err.message);
                return NextResponse.json(
                    { error: msg91Err.message || 'OTP verification failed with provider' },
                    { status: 400 }
                );
            }
        } else if (otp) {
            // 2. Fallback to database OTP record
            const otpDoc = await OTP.findOne({
                phone: formattedPhone,
                otp: String(otp),
                verified: false,
                expiresAt: { $gt: new Date() }
            }).sort({ createdAt: -1 });

            if (!otpDoc) {
                return NextResponse.json(
                    { error: 'Invalid or expired OTP. Please request a new one.' },
                    { status: 400 }
                );
            }

            otpDoc.verified = true;
            await otpDoc.save();
        } else {
            return NextResponse.json(
                { error: 'Either OTP or verification access token is required' },
                { status: 400 }
            );
        }

        // Find or create user
        let user = await User.findOne({ phone: formattedPhone });
        let isNewUser = false;

        if (!user) {
            if (!fullName) {
                return NextResponse.json(
                    { error: 'Full name is required for new users' },
                    { status: 400 }
                );
            }

            user = await User.create({
                fullName,
                phone: formattedPhone,
                isPhoneVerified: true,
                role: 'patient'
            });
            isNewUser = true;
        } else {
            user.isPhoneVerified = true;
            await user.save();
        }

        // Issue JWT
        const tokenExpiry = rememberMe ? '30d' : '7d';
        const token = generateToken(user._id, user.role, tokenExpiry);

        const response = NextResponse.json({
            message: isNewUser ? 'Account created successfully' : 'Login successful',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                phone: user.phone,
                role: user.role
            }
        });

        if (rememberMe) {
            response.cookies.set('authToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60
            });
        }

        return response;

    } catch (error) {
        console.error('[verify-otp] Error:', error.message);
        return NextResponse.json(
            { error: error.message || 'Verification failed' },
            { status: 500 }
        );
    }
}