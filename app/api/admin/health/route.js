
import connectDB from '@/lib/mongodb';
import whatsBoostService from '@/lib/whatsboost';
import { authenticate } from '@/middleware/auth';
import SystemLog from '@/models/SystemLog';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

// POST: Trigger a new health check
export async function POST(request) {
    try {
        // 1. Auth Check
        const authResult = await authenticate(request);
        if (authResult.error || authResult.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const results = {
            timestamp: new Date(),
            services: {}
        };

        // 2. MongoDB Check
        const startMongo = performance.now();
        try {
            if (mongoose.connection.readyState === 1) {
                const latency = Math.round(performance.now() - startMongo);
                results.services.mongodb = { status: 'up', latency };
            } else {
                results.services.mongodb = { status: 'down', latency: 0 };
            }
        } catch (e) {
            results.services.mongodb = { status: 'down', latency: 0, error: e.message };
        }

        // 3. WhatsBoost Check
        try {
            const wbStatus = await whatsBoostService.getDeviceStatus();
            results.services.whatsboost = {
                status: wbStatus.status, // connected/disconnected/error
                details: wbStatus.status === 'error' ? wbStatus.error : 'Checked via API'
            };
        } catch (e) {
            results.services.whatsboost = { status: 'error', details: e.message };
        }

        // 4. Auth/Env Check
        const jwtSecret = process.env.JWT_SECRET;
        const isDefaultSecret = !jwtSecret || jwtSecret === 'your-secret-key-change-in-production';
        results.services.auth = {
            status: isDefaultSecret ? 'monitor' : 'secure',
            details: isDefaultSecret ? 'Using default JWT secret' : 'JWT secret configured'
        };

        // 5. Overall Status Determination
        let overallStatus = 'healthy';
        if (results.services.mongodb.status === 'down') overallStatus = 'down';
        else if (results.services.whatsboost.status === 'error' || results.services.whatsboost.status === 'disconnected') overallStatus = 'degraded';

        // 6. Save Log
        const log = await SystemLog.create({
            status: overallStatus,
            services: results.services,
            details: 'Manual health check triggered'
        });

        return NextResponse.json({
            success: true,
            data: log
        });

    } catch (error) {
        console.error('Health check failed:', error);
        return NextResponse.json(
            { error: 'Health check failed' },
            { status: 500 }
        );
    }
}

// GET: Fetch health history
export async function GET(request) {
    try {
        const authResult = await authenticate(request);
        if (authResult.error || authResult.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit')) || 50;

        await connectDB();

        // Get logs sorted by newest first
        const logs = await SystemLog.find()
            .sort({ timestamp: -1 })
            .limit(limit);

        return NextResponse.json({ logs });

    } catch (error) {
        console.error('Fetch health logs failed:', error);
        return NextResponse.json(
            { error: 'Failed to fetch logs' },
            { status: 500 }
        );
    }
}
