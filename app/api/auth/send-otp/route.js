import { NextResponse } from 'next/server';

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
                { error: 'Invalid phone number format. Must be a valid 10-digit Indian mobile number' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'OTP verification initialized via MSG91'
        });

    } catch (error) {
        console.error('Send OTP error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process OTP request' },
            { status: 500 }
        );
    }
}