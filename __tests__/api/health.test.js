/**
 * API Test: Health Endpoint
 * Tests the public health API route
 */

const BASE_URL = process.env.TEST_BASE_URL;

describe('Health API', () => {
  test('GET /api/health returns basic status without secret', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.status).toBeDefined();
    expect(['ok', 'degraded', 'down']).toContain(data.status);
    // Without secret, should NOT expose detailed service info
    expect(data.logs).toBeUndefined();
  });

  test('GET /api/health with secret returns full details', async () => {
    const secret = process.env.HEALTH_SECRET;
    const res = await fetch(`${BASE_URL}/api/health?secret=${secret}`);
    
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.status).toBeDefined();
    expect(data.logs).toBeDefined();
    expect(Array.isArray(data.logs)).toBe(true);
  });

  test('GET /api/health with wrong secret returns basic only', async () => {
    const res = await fetch(`${BASE_URL}/api/health?secret=wrong-secret-123`);
    
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.status).toBeDefined();
    // Wrong secret should NOT expose details
    expect(data.logs).toBeUndefined();
  });

  test('POST /api/health triggers health check with valid secret', async () => {
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
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.status).toBeDefined();
    expect(data.data.services).toBeDefined();
    expect(data.data.services.mongodb).toBeDefined();
    expect(data.data.services.whatsboost).toBeDefined();
    expect(data.data.services.auth).toBeDefined();
  });

  test('POST /api/health rejects without secret', async () => {
    const res = await fetch(`${BASE_URL}/api/health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(res.status).toBe(401);
  });
});
