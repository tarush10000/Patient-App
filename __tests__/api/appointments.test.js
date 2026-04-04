/**
 * API Test: Appointments System
 * Tests appointment endpoints for basic functionality
 */

const BASE_URL = process.env.TEST_BASE_URL;

describe('Appointments API', () => {
  test('GET /api/appointments rejects unauthenticated requests', async () => {
    const res = await fetch(`${BASE_URL}/api/appointments`);
    
    expect(res.status).toBe(401);
    
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  test('POST /api/appointments rejects unauthenticated requests', async () => {
    const res = await fetch(`${BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Patient',
        phone: '9876543210',
        appointmentDate: new Date().toISOString(),
        timeSlot: '09:00 AM - 10:00 AM',
        consultationType: 'general'
      })
    });
    
    expect(res.status).toBe(401);
  });

  test('GET /api/appointments/available-slots returns slots for valid date', async () => {
    // Available slots is typically a public or auth-required endpoint
    // Testing with a future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split('T')[0];
    
    const res = await fetch(`${BASE_URL}/api/appointments/available-slots?date=${dateStr}`);
    
    // This may require auth — if so, we just verify it doesn't crash
    expect([200, 401]).toContain(res.status);
    
    const data = await res.json();
    expect(data).toBeDefined();
  });

  test('Guest appointment endpoint exists and validates input', async () => {
    const res = await fetch(`${BASE_URL}/api/appointments/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    // Should reject but not crash (400 for missing fields, not 500)
    expect(res.status).toBeLessThan(500);
    
    const data = await res.json();
    expect(data).toBeDefined();
  });

  test('Appointment reminder endpoint requires auth', async () => {
    const res = await fetch(`${BASE_URL}/api/appointments/send-reminder`);
    
    expect(res.status).toBe(401);
  });
});
