
import connectDB from '@/lib/mongodb';
import whatsBoostService from '@/lib/whatsboost';
import SystemLog from '@/models/SystemLog';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Timing-safe secret comparison to prevent timing attacks
 */
function verifySecret(provided, expected) {
    if (!provided || !expected) return false;
    try {
        const a = Buffer.from(provided);
        const b = Buffer.from(expected);
        if (a.length !== b.length) return false;
        return crypto.timingSafeEqual(a, b);
    } catch {
        return false;
    }
}

/**
 * Extract secret from request (query param or header)
 */
function getSecret(request) {
    const { searchParams } = new URL(request.url);
    return searchParams.get('secret') || request.headers.get('x-health-secret') || '';
}

// ──────────────────────────────────────────────────
// GET: Public health status
// Without secret → basic status only (for uptime bots)
// With valid secret → full details + history
// ──────────────────────────────────────────────────
export async function GET(request) {
    try {
        const HEALTH_SECRET = process.env.HEALTH_SECRET;
        const secret = getSecret(request);
        const isAuthed = verifySecret(secret, HEALTH_SECRET);

        await connectDB();

        // Always fetch latest log for basic status
        const latest = await SystemLog.findOne().sort({ timestamp: -1 });

        // Basic response for unauthenticated requests (uptime bots, etc.)
        if (!isAuthed) {
            return NextResponse.json({
                status: latest?.status === 'healthy' ? 'ok' : (latest?.status || 'unknown'),
                timestamp: latest?.timestamp || new Date().toISOString()
            });
        }

        // Full response for authenticated requests
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit')) || 50;

        const logs = await SystemLog.find()
            .sort({ timestamp: -1 })
            .limit(limit);

        return NextResponse.json({
            status: latest?.status === 'healthy' ? 'ok' : (latest?.status || 'unknown'),
            logs,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Health GET failed:', error);
        return NextResponse.json(
            { status: 'error', message: 'Health check failed' },
            { status: 500 }
        );
    }
}

// ──────────────────────────────────────────────────
// POST: Trigger a new health check (requires secret)
// ──────────────────────────────────────────────────
export async function POST(request) {
    try {
        const HEALTH_SECRET = process.env.HEALTH_SECRET;
        const secret = getSecret(request);

        if (!verifySecret(secret, HEALTH_SECRET)) {
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
                details: wbStatus.status === 'error' ? wbStatus.error : 'Checked via Health API'
            };
        } catch (e) {
            results.services.whatsboost = { status: 'error', details: e.message };
        }

        // 3. Auth/Env Check
        const jwtSecret = process.env.JWT_SECRET;
        const isDefaultSecret = !jwtSecret || jwtSecret === 'your-secret-key-change-in-production';
        results.services.auth = {
            status: isDefaultSecret ? 'monitor' : 'secure',
            details: isDefaultSecret ? 'Using default JWT secret' : 'JWT secret configured'
        };

        // 4. Overall Status
        let overallStatus = 'healthy';
        if (results.services.mongodb.status === 'down') overallStatus = 'down';
        else if (results.services.whatsboost.status === 'error' || results.services.whatsboost.status === 'disconnected') overallStatus = 'degraded';

        // 5. Save Log
        const log = await SystemLog.create({
            status: overallStatus,
            services: results.services,
            details: 'Health check via public API'
        });

        return NextResponse.json({
            success: true,
            data: log
        });

    } catch (error) {
        console.error('Health POST failed:', error);
        return NextResponse.json(
            { error: 'Health check failed' },
            { status: 500 }
        );
    }
}
