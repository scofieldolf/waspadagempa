# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: geo.spec.ts >> calculateDistance Utility >> should correctly calculate distance between Jakarta and Surabaya
- Location: tests\geo.spec.ts:10:7

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 750
Received:   662.6
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { calculateDistance } from '../app/utils/geo';
  3  | 
  4  | test.describe('calculateDistance Utility', () => {
  5  |   test('should return 0 for identical coordinates', () => {
  6  |     const dist = calculateDistance(-6.2, 106.8, -6.2, 106.8);
  7  |     expect(dist).toBe(0);
  8  |   });
  9  | 
  10 |   test('should correctly calculate distance between Jakarta and Surabaya', () => {
  11 |     // Jakarta: -6.2088, 106.8456
  12 |     // Surabaya: -7.2575, 112.7521
  13 |     // Expected distance is ~760km
  14 |     const dist = calculateDistance(-6.2088, 106.8456, -7.2575, 112.7521);
> 15 |     expect(dist).toBeGreaterThan(750);
     |                  ^ Error: expect(received).toBeGreaterThan(expected)
  16 |     expect(dist).toBeLessThan(770);
  17 |   });
  18 | 
  19 |   test('should handle coordinate boundaries and negative values', () => {
  20 |     const dist = calculateDistance(-90, -180, 90, 180);
  21 |     // Across the globe (half circumference) is ~20015km
  22 |     expect(dist).toBeCloseTo(20015, -2);
  23 |   });
  24 | 
  25 |   test('should round to 1 decimal place', () => {
  26 |     const dist = calculateDistance(-6.2088, 106.8456, -6.2100, 106.8500);
  27 |     expect(Number.isInteger(dist * 10)).toBe(true);
  28 |   });
  29 | });
  30 | 
```