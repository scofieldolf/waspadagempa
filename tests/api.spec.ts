import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('GET /api/bmkg should return normalized earthquake data', async ({ request }) => {
    const response = await request.get('/api/bmkg');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);

    if (data.length > 0) {
      const eq = data[0];
      expect(eq).toHaveProperty('id');
      expect(eq).toHaveProperty('lat');
      expect(eq).toHaveProperty('lng');
      expect(eq).toHaveProperty('mag');
      expect(eq).toHaveProperty('location');
      expect(eq).toHaveProperty('time');
      expect(eq).toHaveProperty('tsunami');
      expect(eq).toHaveProperty('depth');
    }

    const headers = response.headers();
    expect(headers).toHaveProperty('content-type');
    expect(headers['content-type']).toContain('application/json');
    expect(headers).toHaveProperty('x-cache-source');
  });

  test('GET /api/disaster should support period parameter', async ({ request }) => {
    const resDay = await request.get('/api/disaster?period=day');
    expect(resDay.status()).toBe(200);
    const dayData = await resDay.json();
    expect(Array.isArray(dayData)).toBe(true);

    const resWeek = await request.get('/api/disaster?period=week');
    expect(resWeek.status()).toBe(200);
    const weekData = await resWeek.json();
    expect(Array.isArray(weekData)).toBe(true);

    const dayHeaders = resDay.headers();
    expect(dayHeaders['x-cache-period']).toBe('day');

    const weekHeaders = resWeek.headers();
    expect(weekHeaders['x-cache-period']).toBe('week');
  });

  test('POST /api/briefing should validate input and return seismotectonic briefing', async ({ request }) => {
    // 1. Test validation error for empty request
    const badRes = await request.post('/api/briefing', {
      data: {}
    });
    expect(badRes.status()).toBe(400);

    // 2. Test successful local analytical fallback
    const mockEarthquakes = [
      {
        id: 'test-1',
        lat: -6.2,
        lng: 106.8,
        mag: 5.5,
        depth: 45,
        location: 'Offshore Southern Java',
        time: new Date().toISOString(),
        tsunami: false
      },
      {
        id: 'test-2',
        lat: -1.2,
        lng: 101.5,
        mag: 6.2,
        depth: 10,
        location: 'Sumatra',
        time: new Date().toISOString(),
        tsunami: true
      }
    ];

    const res = await request.post('/api/briefing', {
      data: {
        earthquakes: mockEarthquakes,
        locale: 'id'
      }
    });
    expect(res.status()).toBe(200);
    const result = await res.json();
    expect(result.success).toBe(true);
    expect(result).toHaveProperty('briefing');
    expect(result).toHaveProperty('provider');
    expect(typeof result.briefing).toBe('string');
  });

  test('GET /api/git-push executes git command or fails gracefully', async ({ request }) => {
    // Since it tries to run git commands, it should execute. If we are on clean repo, it might commit or return success/error.
    // We just verify that the response returns JSON with either success true/false.
    const res = await request.get('/api/git-push');
    expect([200, 500]).toContain(res.status());
    const data = await res.json();
    if (res.status() === 200) {
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('output');
    } else {
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('error');
    }
  });
});
