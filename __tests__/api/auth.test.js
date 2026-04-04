/**
 * API Test: Authentication System
 * Tests OTP send/verify flow and auth token management
 */

const BASE_URL = process.env.TEST_BASE_URL;

describe('Authentication API', () => {
  test('POST /api/auth/send-otp rejects missing phone', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    expect(res.status).toBe(400);
    
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  test('POST /api/auth/send-otp rejects invalid phone format', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '12345' })
    });
    
    expect(res.status).toBe(400);
    
    const data = await res.json();
    expect(data.error).toContain('Invalid phone number');
  });

  test('POST /api/auth/verify-otp rejects missing fields', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    // Should return 400 or appropriate error
    expect(res.status).toBeGreaterThanOrEqual(400);
    
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  test('POST /api/auth/verify-otp rejects wrong OTP', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9999999999', otp: '000000' })
    });
    
    // Should return error status
    expect(res.status).toBeGreaterThanOrEqual(400);
    
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  test('Protected route rejects missing auth token', async () => {
    const res = await fetch(`${BASE_URL}/api/user/profile`);
    
    expect(res.status).toBe(401);
    
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  test('Protected route rejects invalid auth token', async () => {
    const res = await fetch(`${BASE_URL}/api/user/profile`, {
      headers: { 'Authorization': 'Bearer invalid.token.here' }
    });
    
    expect(res.status).toBe(401);
  });
});
