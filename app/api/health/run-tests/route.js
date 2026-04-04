
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

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
const MIN_TEST_INTERVAL = 60000; // 60 seconds between test runs

// ──────────────────────────────────────────────────
// GET: Run Jest API tests remotely
// Requires HEALTH_SECRET
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
            // Return cached results if available
            const cachedPath = path.join(process.cwd(), '.next', 'test-results.json');
            if (fs.existsSync(cachedPath)) {
                const cached = JSON.parse(fs.readFileSync(cachedPath, 'utf-8'));
                return NextResponse.json({
                    ...cached,
                    cached: true,
                    nextRunAvailableIn: Math.ceil((MIN_TEST_INTERVAL - (now - lastTestRun)) / 1000)
                });
            }
            return NextResponse.json({
                error: 'Rate limited. Please wait before running tests again.',
                nextRunAvailableIn: Math.ceil((MIN_TEST_INTERVAL - (now - lastTestRun)) / 1000)
            }, { status: 429 });
        }

        lastTestRun = now;

        // Run Jest tests
        try {
            const { stdout, stderr } = await execAsync(
                'npx jest --forceExit --json 2>&1',
                {
                    cwd: process.cwd(),
                    timeout: 120000, // 2 minute timeout
                    env: { ...process.env, NODE_ENV: 'test' }
                }
            );

            // Try to parse Jest JSON output
            const jsonMatch = stdout.match(/\{[\s\S]*"numTotalTests"[\s\S]*\}/);
            if (jsonMatch) {
                const jestResult = JSON.parse(jsonMatch[0]);
                const result = {
                    timestamp: new Date().toISOString(),
                    success: jestResult.success,
                    numTotalTests: jestResult.numTotalTests,
                    numPassedTests: jestResult.numPassedTests,
                    numFailedTests: jestResult.numFailedTests,
                    numPendingTests: jestResult.numPendingTests,
                    duration: jestResult.testResults?.reduce((sum, s) => sum + (s.endTime - s.startTime), 0) || 0,
                    testSuites: jestResult.testResults?.map(suite => ({
                        name: path.basename(suite.testFilePath || suite.name || 'unknown'),
                        status: suite.status === 'passed' ? 'passed' : 'failed',
                        duration: (suite.endTime - suite.startTime) || 0,
                        tests: suite.assertionResults?.map(test => ({
                            name: test.fullName || test.title,
                            status: test.status,
                            duration: test.duration,
                            error: test.failureMessages?.length > 0
                                ? test.failureMessages.join('\n').substring(0, 500)
                                : null
                        })) || []
                    })) || []
                };

                return NextResponse.json(result);
            }

            // Fallback: Return raw output
            return NextResponse.json({
                timestamp: new Date().toISOString(),
                success: false,
                rawOutput: stdout.substring(0, 2000),
                error: stderr?.substring(0, 500) || null
            });

        } catch (execError) {
            // Jest exits with code 1 when tests fail — that's expected
            const output = execError.stdout || '';
            const jsonMatch = output.match(/\{[\s\S]*"numTotalTests"[\s\S]*\}/);

            if (jsonMatch) {
                try {
                    const jestResult = JSON.parse(jsonMatch[0]);
                    const result = {
                        timestamp: new Date().toISOString(),
                        success: jestResult.success,
                        numTotalTests: jestResult.numTotalTests,
                        numPassedTests: jestResult.numPassedTests,
                        numFailedTests: jestResult.numFailedTests,
                        numPendingTests: jestResult.numPendingTests,
                        duration: jestResult.testResults?.reduce((sum, s) => sum + (s.endTime - s.startTime), 0) || 0,
                        testSuites: jestResult.testResults?.map(suite => ({
                            name: path.basename(suite.testFilePath || suite.name || 'unknown'),
                            status: suite.status === 'passed' ? 'passed' : 'failed',
                            duration: (suite.endTime - suite.startTime) || 0,
                            tests: suite.assertionResults?.map(test => ({
                                name: test.fullName || test.title,
                                status: test.status,
                                duration: test.duration,
                                error: test.failureMessages?.length > 0
                                    ? test.failureMessages.join('\n').substring(0, 500)
                                    : null
                            })) || []
                        })) || []
                    };
                    return NextResponse.json(result);
                } catch { /* fall through */ }
            }

            return NextResponse.json({
                timestamp: new Date().toISOString(),
                success: false,
                error: 'Test execution failed',
                details: (execError.stderr || execError.message || '').substring(0, 500),
                rawOutput: output.substring(0, 2000)
            });
        }

    } catch (error) {
        console.error('Run tests failed:', error);
        return NextResponse.json(
            { error: 'Failed to run tests', details: error.message },
            { status: 500 }
        );
    }
}
