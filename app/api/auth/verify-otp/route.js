import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';
import msg91Service from '@/lib/msg91';

export async function POST(request) {
    try {
        const { accessToken, phone, fullName, pin, rememberMe } = await request.json();

        console.log('=== Verify OTP Request ===');
        console.log('Access Token received:', accessToken ? 'Yes' : 'No');
        console.log('Phone:', phone);
        console.log('Full Name:', fullName);
        console.log('PIN:', pin ? 'Yes' : 'No');
        console.log('Remember Me:', rememberMe);

        if (!accessToken) {
            return NextResponse.json(
                { error: 'Access token is required' },
                { status: 400 }
            );
        }

        if (!phone) {
            return NextResponse.json(
                { error: 'Phone number is required' },
                { status: 400 }
            );
        }

        // Verify the access token with MSG91
        console.log('Verifying access token with MSG91...');
        const verificationResult = await msg91Service.verifyAccessToken(accessToken);
        console.log('MSG91 Verification Result:', verificationResult);

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

        // Check if user exists
        console.log('Looking for user with phone:', formattedPhone);
        let user = await User.findOne({ phone: formattedPhone });
        console.log('User found:', user ? 'Yes' : 'No');

        if (!user) {
            // New user signup - PIN is required
            console.log('Creating new user...');

            if (!fullName) {
                return NextResponse.json(
                    { error: 'Full name is required for new users' },
                    { status: 400 }
                );
            }

            if (!pin) {
                return NextResponse.json(
                    { error: 'PIN is required for new users' },
                    { status: 400 }
                );
            }

            // Validate PIN format
            if (!/^\d{6}$/.test(pin)) {
                return NextResponse.json(
                    { error: 'PIN must be exactly 6 digits' },
                    { status: 400 }
                );
            }

            console.log('Creating user with data:', {
                fullName,
                phone: formattedPhone,
                pin: pin ? 'provided' : 'missing',
                isPhoneVerified: true,
                role: 'patient'
            });

            user = await User.create({
                fullName: fullName,
                phone: formattedPhone,
                pin: pin,
                isPhoneVerified: true,
                role: 'patient'
            });

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
            message: user.isNew ? 'Account created successfully' : 'Login successful',
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