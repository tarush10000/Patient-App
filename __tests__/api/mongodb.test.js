/**
 * API Test: MongoDB Connectivity
 * Tests database connection and basic operations
 */

const BASE_URL = process.env.TEST_BASE_URL;

describe('MongoDB Connectivity', () => {
  test('Health endpoint returns database status', async () => {
    const secret = process.env.HEALTH_SECRET;
    const res = await fetch(`${BASE_URL}/api/health?secret=${secret}`);
    
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data).toBeDefined();
    
    // If we have logs, check mongodb status
    if (data.logs && data.logs.length > 0) {
      const latest = data.logs[0];
      expect(latest.services).toBeDefined();
      expect(latest.services.mongodb).toBeDefined();
      expect(latest.services.mongodb.status).toBe('up');
      expect(typeof latest.services.mongodb.latency).toBe('number');
    }
  });

  test('Health check POST triggers new check with DB verification', async () => {
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
    expect(data.data.services.mongodb.status).toBe('up');
  });
});
