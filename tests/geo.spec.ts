import { test, expect } from '@playwright/test';
import { calculateDistance } from '../app/utils/geo';

test.describe('calculateDistance Utility', () => {
  test('should return 0 for identical coordinates', () => {
    const dist = calculateDistance(-6.2, 106.8, -6.2, 106.8);
    expect(dist).toBe(0);
  });

  test('should correctly calculate distance between Jakarta and Surabaya', () => {
    // Jakarta: -6.2088, 106.8456
    // Surabaya: -7.2575, 112.7521
    // Expected distance is ~662.6km
    const dist = calculateDistance(-6.2088, 106.8456, -7.2575, 112.7521);
    expect(dist).toBeGreaterThan(650);
    expect(dist).toBeLessThan(675);
    expect(dist).toBe(662.6);
  });

  test('should handle coordinate boundaries and negative values', () => {
    const dist = calculateDistance(-90, -180, 90, 180);
    // Across the globe is ~20015km
    expect(dist).toBeCloseTo(20015, -2);
  });

  test('should round to 1 decimal place', () => {
    const dist = calculateDistance(-6.2088, 106.8456, -6.2100, 106.8500);
    expect(Number.isInteger(dist * 10)).toBe(true);
  });
});
