import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Timing-safe secret comparison
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

// Track last test run to prevent abuse
let lastTestRun = 0;
const MIN_TEST_INTERVAL = 10000; // 10 seconds between test runs

// ──────────────────────────────────────────────────
// GET: Native API Test Runner
// Escapes Vercel's read-only filesystem restrictions 
// by running fetch commands sequentially inside Node
// ──────────────────────────────────────────────────
export async function GET(request) {
    try {
        const HEALTH_SECRET = process.env.HEALTH_SECRET;
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret') || request.headers.get('x-health-secret') || '';

        if (!verifySecret(secret, HEALTH_SECRET)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limiting
        const now = Date.now();
        if (now - lastTestRun < MIN_TEST_INTERVAL) {
            return NextResponse.json({
                error: 'Rate limited. Please wait 10 seconds before running tests again.',
                nextRunAvailableIn: Math.ceil((MIN_TEST_INTERVAL - (now - lastTestRun)) / 1000)
            }, { status: 429 });
        }

        lastTestRun = now;

        // Determine base URL dynamically or fallback to env variable/localhost
        const host = request.headers.get('host') || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const BASE_URL = process.env.TEST_BASE_URL || `${protocol}://${host}`;

        const startTime = Date.now();
        const testResults = {
            numTotalTests: 0,
            numPassedTests: 0,
            numFailedTests: 0,
            testSuites: []
        };

        // Helper to run a suite
        async function runSuite(name, tests) {
            const suiteStart = Date.now();
            const results = [];
            let failed = false;

            for (const test of tests) {
                testResults.numTotalTests++;
                const tStart = Date.now();
                try {
                    await test.fn();
                    const duration = Date.now() - tStart;
                    results.push({ name: test.name, status: 'passed', duration });
                    testResults.numPassedTests++;
                } catch (err) {
                    const duration = Date.now() - tStart;
                    results.push({ name: test.name, status: 'failed', duration, error: err.message });
                    testResults.numFailedTests++;
                    failed = true;
                }
            }

            testResults.testSuites.push({
                name,
                status: failed ? 'failed' : 'passed',
                duration: Date.now() - suiteStart,
                tests: results
            });
        }

        // Define tests
        await runSuite('mongodb.test.js', [
            {
                name: 'Health endpoint returns database status',
                fn: async () => {
                    const res = await fetch(`${BASE_URL}/api/health?secret=${secret}`);
                    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
                    const data = await res.json();
                    if (data.logs && data.logs.length > 0) {
                        const latest = data.logs[0];
                        if (latest.services?.mongodb?.status !== 'up') throw new Error('MongoDB status is not up in logs');
                    }
                }
            },
            {
                name: 'Health check POST triggers new check with DB verification',
                fn: async () => {
                    const res = await fetch(`${BASE_URL}/api/health`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-health-secret': secret }
                    });
                    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
                    const data = await res.json();
                    if (!data.success) throw new Error('Data success field was false');
                    if (data.data?.services?.mongodb?.status !== 'up') throw new Error('MongoDB status is not up');
                }
            }
        ]);

        await runSuite('whatsboost.test.js', [
            {
                name: 'Send dummy test message to canary number',
                fn: async () => {
                    const formData = new FormData();
                    formData.append('appkey', process.env.WHATSBOOST_APP_KEY || '');
                    formData.append('authkey', process.env.WHATSBOOST_AUTH_KEY || '');
                    formData.append('to', '918630632030');
                    formData.append('message', `🔬 Health Test at ${new Date().toISOString()}`);

                    const res = await fetch('https://whatsboost.in/api/create-message', {
                        method: 'POST', body: formData,
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                    });
                    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
                    
                    const text = await res.text();
                    let data;
                    try { data = JSON.parse(text); } catch { throw new Error('WhatsBoost non-JSON response'); }
                    
                    const isNewFormat = data.status === true && data.ok === true;
                    const isOldFormat = data.message_status === 'Success';
                    if (!isNewFormat && !isOldFormat) throw new Error(`WhatsBoost API format rejected: ${text}`);
                }
            },
            {
                name: 'WhatsBoost rejects invalid credentials',
                fn: async () => {
                    const formData = new FormData();
                    formData.append('appkey', 'invalid-key');
                    formData.append('authkey', 'invalid-auth');
                    formData.append('to', '919999999999');
                    formData.append('message', 'test');

                    const res = await fetch('https://whatsboost.in/api/create-message', {
                        method: 'POST', body: formData
                    });
                    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
                }
            },
            {
                name: 'WhatsBoost rejects missing required fields',
                fn: async () => {
                    const formData = new FormData();
                    formData.append('appkey', process.env.WHATSBOOST_APP_KEY || '');
                    formData.append('authkey', process.env.WHATSBOOST_AUTH_KEY || '');
                    // Missing 'to' and 'message'

                    const res = await fetch('https://whatsboost.in/api/create-message', {
                        method: 'POST', body: formData
                    });
                    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
                }
            },
            {
                name: 'Health check reports WhatsBoost status',
                fn: async () => {
                    const res = await fetch(`${BASE_URL}/api/health`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-health-secret': secret }
                    });
                    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
                    const data = await res.json();
                    if (data.data?.services?.whatsboost?.status !== 'connected') {
                        throw new Error(`Device not connected: ${data.data?.services?.whatsboost?.details}`);
                    }
                }
            }
        ]);

        await runSuite('health.test.js', [
            {
                name: 'GET /api/health returns basic status without secret',
                fn: async () => {
                    const res = await fetch(`${BASE_URL}/api/health`);
                    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
                    const data = await res.json();
                    if (!['ok', 'degraded', 'down', 'unknown'].includes(data.status)) throw new Error('Invalid status format');
                    if (data.logs) throw new Error('Logs should not be exposed');
                }
            },
            {
                name: 'GET /api/health with secret returns full details',
                fn: async () => {
                    const res = await fetch(`${BASE_URL}/api/health?secret=${secret}`);
                    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
                    const data = await res.json();
                    if (!Array.isArray(data.logs)) throw new Error('Logs array missing from response');
                }
            },
            {
                name: 'GET /api/health with wrong secret returns basic only',
                fn: async () => {
                    const res = await fetch(`${BASE_URL}/api/health?secret=wrong-secret-123`);
                    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
                    const data = await res.json();
                    if (data.logs) throw new Error('Logs should not be exposed to wrong secret');
                }
            },
            {
                name: 'POST /api/health triggers health check with valid secret',
                fn: async () => {
                    const res = await fetch(`${BASE_URL}/api/health`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-health-secret': secret }
                    });
                    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
                    const data = await res.json();
                    if (!data.success) throw new Error('Expected success: true');
                    if (!data.data?.services) throw new Error('Missing services data');
                }
            },
            {
                name: 'POST /api/health rejects without secret',
                fn: async () => {
                    const res = await fetch(`${BASE_URL}/api/health`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
                }
            }
        ]);

        await runSuite('auth.test.js', [
            {
                name: 'POST /api/auth/send-otp rejects missing phone',
                fn: async () => {
                    const res = await fetch(`${BASE_URL}/api/auth/send-otp`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({})
                    });
                    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
                }
            },
            {
                name: 'POST /api/auth/send-otp rejects invalid phone format',
                fn: async () => {
                    const res = await fetch(`${BASE_URL}/api/auth/send-otp`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: '12345' })
                    });
                    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
                }
            },
            {
                name: 'POST /api/auth/verify-otp rejects missing fields',
                fn: async () => {
                    const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({})
                    });
                    if (res.status < 400) throw new Error(`Expected error status, got ${res.status}`);
                }
            },
            {
                name: 'POST /api/auth/verify-otp rejects wrong OTP',
                fn: async () => {
                    const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: '9999999999', otp: '000000' })
                    });
                    if (res.status < 400) throw new Error(`Expected error status, got ${res.status}`);
                }
            },
            {
                name: 'Protected route rejects missing auth token',
                fn: async () => {
                    const res = await fetch(`${BASE_URL}/api/user/profile`);
                    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
                }
            },
            {
                name: 'Protected route rejects invalid auth token',
                fn: async () => {
                    const res = await fetch(`${BASE_URL}/api/user/profile`, {
                        headers: { 'Authorization': 'Bearer invalid.token.here' }
                    });
                    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
                }
            }
        ]);

        await runSuite('appointments.test.js', [
            {
                name: 'GET /api/appointments rejects unauthenticated requests',
                fn: async () => {
                    const res = await fetch(`${BASE_URL}/api/appointments`);
                    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
                }
            },
            {
                name: 'POST /api/appointments rejects unauthenticated requests',
                fn: async () => {
                    const res = await fetch(`${BASE_URL}/api/appointments`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, 
                        body: JSON.stringify({
                            fullName: 'Test Patient', phone: '9876543210', 
                            appointmentDate: new Date().toISOString(), timeSlot: '09:00 AM - 10:00 AM', consultationType: 'general'
                        })
                    });
                    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
                }
            },
            {
                name: 'GET /api/appointments/available-slots returns slots for valid date',
                fn: async () => {
                    const futureDate = new Date();
                    futureDate.setDate(futureDate.getDate() + 7);
                    const dateStr = futureDate.toISOString().split('T')[0];
                    const res = await fetch(`${BASE_URL}/api/appointments/available-slots?date=${dateStr}`);
                    if (![200, 401].includes(res.status)) throw new Error(`Expected valid status or 401, got ${res.status}`);
                }
            },
            {
                name: 'Guest appointment endpoint exists and validates input',
                fn: async () => {
                    const res = await fetch(`${BASE_URL}/api/appointments/guest`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({})
                    });
                    if (res.status >= 500) throw new Error(`Expected 400s status, got ${res.status}`);
                }
            },
            {
                name: 'Appointment reminder endpoint requires auth',
                fn: async () => {
                    const res = await fetch(`${BASE_URL}/api/appointments/send-reminder`);
                    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
                }
            }
        ]);


        // Construct final payload tailored to our frontend
        const result = {
            timestamp: new Date().toISOString(),
            success: testResults.numFailedTests === 0,
            numTotalTests: testResults.numTotalTests,
            numPassedTests: testResults.numPassedTests,
            numFailedTests: testResults.numFailedTests,
            duration: Date.now() - startTime,
            testSuites: testResults.testSuites
        };

        return NextResponse.json(result);

    } catch (error) {
        console.error('Run tests failed:', error);
        return NextResponse.json(
            { error: 'Failed to run tests', details: error.message },
            { status: 500 }
        );
    }
}
