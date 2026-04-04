/**
 * API Test: WhatsBoost Service
 * Tests WhatsBoost message sending with a dummy message to the canary number
 */

const BASE_URL = process.env.TEST_BASE_URL;

describe('WhatsBoost Service', () => {
  test('Send dummy test message to canary number', async () => {
    // Direct API test to WhatsBoost
    const formData = new FormData();
    formData.append('appkey', process.env.WHATSBOOST_APP_KEY);
    formData.append('authkey', process.env.WHATSBOOST_AUTH_KEY);
    formData.append('to', '918630632030');
    formData.append('message', `🔬 Health Test: Automated API test at ${new Date().toISOString()}`);

    const res = await fetch('https://whatsboost.in/api/create-message', {
      method: 'POST',
      body: formData,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://appointment.dranjaligupta.in',
        'Referer': 'https://appointment.dranjaligupta.in/',
      }
    });

    expect(res.status).toBe(200);

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`WhatsBoost returned non-JSON response: ${text.substring(0, 200)}`);
    }

    // Verify new format: { status: true, ok: true, ... }
    const isNewFormat = data.status === true && data.ok === true;
    // Also accept old format: { message_status: "Success", ... }
    const isOldFormat = data.message_status === 'Success';

    expect(isNewFormat || isOldFormat).toBe(true);

    if (isNewFormat) {
      expect(data.messageId).toBeDefined();
      expect(data.phone).toBeDefined();
    }
  });

  test('WhatsBoost rejects invalid credentials', async () => {
    const formData = new FormData();
    formData.append('appkey', 'invalid-test-key');
    formData.append('authkey', 'invalid-test-auth');
    formData.append('to', '919999999999');
    formData.append('message', 'test');

    const res = await fetch('https://whatsboost.in/api/create-message', {
      method: 'POST',
      body: formData,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json, text/plain, */*',
      }
    });

    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.code).toBe(401);
    expect(data.message).toContain('Invalid');
  });

  test('WhatsBoost rejects missing required fields', async () => {
    const formData = new FormData();
    formData.append('appkey', process.env.WHATSBOOST_APP_KEY);
    formData.append('authkey', process.env.WHATSBOOST_AUTH_KEY);
    // Missing 'to' and 'message'

    const res = await fetch('https://whatsboost.in/api/create-message', {
      method: 'POST',
      body: formData,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json, text/plain, */*',
      }
    });

    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.code).toBe(400);
  });

  test('Health check reports WhatsBoost status', async () => {
    const secret = process.env.HEALTH_SECRET;
    const res = await fetch(`${BASE_URL}/api/health`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-health-secret': secret
      }
    });

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.data.services.whatsboost).toBeDefined();
    expect(data.data.services.whatsboost.status).toBe('connected');
  });
});
