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

        return NextResponse.json({
            success: true,
            message: 'OTP resend initialized via MSG91'
        });

    } catch (error) {
        console.error('Resend OTP error:', error);
        return NextResponse.json(
            { error: 'Failed to resend OTP' },
            { status: 500 }
        );
    }
}