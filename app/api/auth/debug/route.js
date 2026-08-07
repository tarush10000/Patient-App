import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { event, details } = body;

        // Log to Vercel server console (visible in Vercel Dashboard → Logs)
        console.log(`[MSG91 CLIENT DIAGNOSTIC] Event: ${event}`, JSON.stringify(details, null, 2));

        return NextResponse.json({ received: true });
    } catch (err) {
        return NextResponse.json({ received: false }, { status: 400 });
    }
}

// Also expose a GET to verify env vars are present on the server
export async function GET() {
    const config = {
        NEXT_PUBLIC_MSG91_WIDGET_ID: !!process.env.NEXT_PUBLIC_MSG91_WIDGET_ID,
        NEXT_PUBLIC_MSG91_TOKEN_AUTH: !!process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH,
        MSG91_AUTH_KEY: !!process.env.MSG91_AUTH_KEY,
        NODE_ENV: process.env.NODE_ENV,
    };

    console.log('[MSG91 SERVER DIAGNOSTIC] Env var presence check:', config);

    return NextResponse.json({ config });
}
