import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import OTP from '@/models/OTP';
import { generateToken } from '@/lib/auth';

export async function POST(request) {
    try {
        const { phone, otp, fullName, rememberMe } = await request.json();

        console.log('=== Verify OTP Request ===');
        console.log('Phone:', phone);
        console.log('OTP:', otp ? 'Yes' : 'No');
        console.log('Full Name:', fullName);
        console.log('Remember Me:', rememberMe);

        if (!phone) {
            return NextResponse.json(
                { error: 'Phone number is required' },
                { status: 400 }
            );
        }

        if (!otp) {
            return NextResponse.json(
                { error: 'OTP is required' },
                { status: 400 }
            );
        }

        await connectDB();

        // Format phone number consistently
        const formattedPhone = phone;
        console.log('Formatted phone:', formattedPhone);

        // Find the OTP in database
        const otpDoc = await OTP.findOne({
            phone: formattedPhone,
            otp: otp,
            verified: false,
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        if (!otpDoc) {
            return NextResponse.json(
                { error: 'Invalid or expired OTP' },
                { status: 400 }
            );
        }

        // Mark OTP as verified
        otpDoc.verified = true;
        await otpDoc.save();

        // Check if user exists
        console.log('Looking for user with phone:', formattedPhone);
        let user = await User.findOne({ phone: formattedPhone });
        console.log('User found:', user ? 'Yes' : 'No');

        let isNewUser = false;

        if (!user) {
            // New user signup
            console.log('Creating new user...');

            if (!fullName) {
                return NextResponse.json(
                    { error: 'Full name is required for new users' },
                    { status: 400 }
                );
            }

            user = await User.create({
                fullName: fullName,
                phone: formattedPhone,
                isPhoneVerified: true,
                role: 'patient'
            });

            isNewUser = true;
            console.log('New user created:', user._id);
        } else {
            // Existing user login
            console.log('Updating existing user...');
            user.isPhoneVerified = true;
            await user.save();
        }

        // Generate token with remember me option
        const tokenExpiry = rememberMe ? '30d' : '7d';
        const token = generateToken(user._id, user.role, tokenExpiry);

        // Set secure HTTP-only cookie for remember me
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
                maxAge: 30 * 24 * 60 * 60 // 30 days
            });
        }

        console.log('=== Verify OTP Success ===');
        return response;

    } catch (error) {
        console.error('=== Verify OTP Error ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Full error:', error);

        return NextResponse.json(
            { error: error.message || 'Verification failed' },
            { status: 500 }
        );
    }
}