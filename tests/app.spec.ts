import { test, expect } from '@playwright/test';

test.describe('Waspadagempa Frontend E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto('/');
  });

  test('should load the page structure, title, and initial components', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle(/Waspadagempa/i);

    // Verify presence of Map Container
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible({ timeout: 15000 });

    // Verify title and subtitle
    const heading = page.locator('h1', { hasText: 'Waspadagempa' });
    await expect(heading).toBeVisible();
  });

  test('should toggle language between ID and EN', async ({ page }) => {
    // Initially local language should be ID (translations.ts defaults it, Home state sets ID first)
    const subTitleID = page.locator('p', { hasText: /Risiko Bencana & Iklim/i });
    await expect(subTitleID).toBeVisible();

    // Click English language button
    const enButton = page.locator('button', { hasText: 'EN' }).first();
    await enButton.click();

    // Subtitle should update to English version
    const subTitleEN = page.locator('p', { hasText: /Disaster & Climate Risk/i });
    await expect(subTitleEN).toBeVisible();

    // Toggle back to ID
    const idButton = page.locator('button', { hasText: 'ID' }).first();
    await idButton.click();
    await expect(subTitleID).toBeVisible();
  });

  test('should toggle sidebar visibility', async ({ page }) => {
    const sidebar = page.locator('div[class*="w-\\[85vw\\]"], div[class*="w-\\[340px\\]"]').first();

    // Collapse sidebar
    const collapseButton = page.locator('button[aria-label="Collapse Sidebar"]').first();
    await collapseButton.click();

    // Sidebar should be collapsed (width 0 or hidden)
    await expect(sidebar).toHaveClass(/w-0/);

    // Expand sidebar using floating navigation trigger or click event
    // Find the toggle trigger (usually maps canvas show/hide button)
    const expandButton = page.locator('button[aria-label="Expand Sidebar"], button[title="Expand Sidebar"]').first();
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await expect(sidebar).not.toHaveClass(/w-0/);
    }
  });

  test('should interact with earthquake filters', async ({ page }) => {
    // Verify filter buttons exist
    const allFilter = page.locator('button', { hasText: 'All' }).first();
    const mag4Filter = page.locator('button', { hasText: 'Mag 4+' }).first();
    const mag6Filter = page.locator('button', { hasText: 'Mag 6+' }).first();

    await expect(allFilter).toBeVisible();
    await expect(mag4Filter).toBeVisible();
    await expect(mag6Filter).toBeVisible();

    // Select Mag 4+ and verify click is registered
    await mag4Filter.click();
    await expect(mag4Filter).toHaveClass(/bg-white|text-stone-950/);

    // Select Mag 6+
    await mag6Filter.click();
    await expect(mag6Filter).toHaveClass(/bg-white|text-stone-950/);
  });

  test('should support toggling map layers and tectonic plates', async ({ page }) => {
    // Locate the tectonic plates layer switch/button
    const tectonicSwitch = page.locator('button[aria-label*="Lempeng Tektonik"], button[aria-label*="Tectonic Plates"]').first();
    if (await tectonicSwitch.isVisible()) {
      // Toggle tectonic plates ON
      const isPressedBefore = await tectonicSwitch.getAttribute('aria-pressed');
      await tectonicSwitch.click();
      const isPressedAfter = await tectonicSwitch.getAttribute('aria-pressed');
      expect(isPressedAfter).not.toBe(isPressedBefore);
    }
  });
});
