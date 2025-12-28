
import connectDB from '@/lib/mongodb';
import whatsBoostService from '@/lib/whatsboost';
import SystemLog from '@/models/SystemLog';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');
        const authHeader = request.headers.get('authorization');

        // Check for CRON_SECRET in env
        const CRON_SECRET = process.env.CRON_SECRET;

        // Security Check
        const providedSecret = secret || (authHeader?.replace('Bearer ', ''));
        if (!CRON_SECRET || providedSecret !== CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const results = {
            timestamp: new Date(),
            services: {}
        };

        // 1. MongoDB Check
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

        // 2. WhatsBoost Check
        try {
            const wbStatus = await whatsBoostService.getDeviceStatus();
            results.services.whatsboost = {
                status: wbStatus.status,
                details: wbStatus.status === 'connected' ? 'Connected (Cron)' : wbStatus.error
            };
        } catch (e) {
            results.services.whatsboost = { status: 'error', details: e.message };
        }

        // 3. Auth/Env Check
        const jwtSecret = process.env.JWT_SECRET;
        const isDefaultSecret = !jwtSecret || jwtSecret === 'your-secret-key-change-in-production';
        results.services.auth = {
            status: isDefaultSecret ? 'monitor' : 'secure',
            details: 'Checked via Cron'
        };

        // 4. Overall Status
        let overallStatus = 'healthy';
        if (results.services.mongodb.status === 'down') overallStatus = 'down';
        else if (results.services.whatsboost.status === 'error' || results.services.whatsboost.status === 'disconnected') overallStatus = 'degraded';

        // 5. Save Log
        await SystemLog.create({
            status: overallStatus,
            services: results.services,
            details: 'Automated Cron Check'
        });

        return NextResponse.json({
            success: true,
            status: overallStatus,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Cron health check failed:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
