import { NextResponse } from 'next/server';
import msg91Service from '@/lib/msg91';

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
        const formattedPhone = phone.replace(/^\+?91/, '');
        
        const result = await msg91Service.sendOTP(formattedPhone);

        return NextResponse.json({
            success: true,
            message: 'OTP sent successfully',
            reqId: result.reqId
        });

    } catch (error) {
        console.error('Send OTP error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send OTP' },
            { status: 500 }
        );
    }
}