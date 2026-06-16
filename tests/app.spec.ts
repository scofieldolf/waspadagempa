import { test, expect } from '@playwright/test';

test.describe('Waspadagempa Frontend E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the page structure, title, and initial components', async ({ page }) => {
    await expect(page).toHaveTitle(/Waspadagempa/i);

    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible({ timeout: 15000 });

    const heading = page.locator('h1', { hasText: 'Waspadagempa' });
    await expect(heading).toBeVisible();
  });

  test('should toggle language between ID and EN', async ({ page }) => {
    const subTitleID = page.locator('p', { hasText: /Risiko Bencana & Iklim/i });
    await expect(subTitleID).toBeVisible();

    const enButton = page.locator('button', { hasText: 'EN' }).first();
    await enButton.click();

    const subTitleEN = page.locator('p', { hasText: /Disaster & Climate Risk/i });
    await expect(subTitleEN).toBeVisible();

    const idButton = page.locator('button', { hasText: 'ID' }).first();
    await idButton.click();
    await expect(subTitleID).toBeVisible();
  });

  test('should toggle sidebar visibility', async ({ page }) => {
    // Locate sidebar by traversing up 4 levels from the Waspadagempa heading
    const sidebar = page.locator('h1', { hasText: 'Waspadagempa' }).locator('xpath=../../../..');

    // Collapse sidebar
    const collapseButton = page.locator('button[aria-label="Collapse Sidebar"]').first();
    await collapseButton.click();

    // Sidebar should be collapsed (contains w-0 class)
    await expect(sidebar).toHaveClass(/w-0/);

    // Expand sidebar using floating navigation trigger or click event
    const expandButton = page.locator('button[aria-label="Expand Sidebar"], button[title="Expand Sidebar"]').first();
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await expect(sidebar).not.toHaveClass(/w-0/);
    }
  });

  test('should interact with earthquake filters', async ({ page }) => {
    // In Indonesian locale, "All" filter is translated to "Semua"
    const allFilter = page.locator('button', { hasText: 'Semua' }).first();
    const mag4Filter = page.locator('button', { hasText: 'Mag 4+' }).first();
    const mag6Filter = page.locator('button', { hasText: 'Mag 6+' }).first();

    await expect(allFilter).toBeVisible();
    await expect(mag4Filter).toBeVisible();
    await expect(mag6Filter).toBeVisible();

    await mag4Filter.click();
    await expect(mag4Filter).toHaveClass(/bg-white|text-stone-950/);

    await mag6Filter.click();
    await expect(mag6Filter).toHaveClass(/bg-white|text-stone-950/);
  });

  test('should support toggling map layers and tectonic plates', async ({ page }) => {
    const tectonicSwitch = page.locator('button[aria-label*="Lempeng Tektonik"], button[aria-label*="Tectonic Plates"]').first();
    if (await tectonicSwitch.isVisible()) {
      const isPressedBefore = await tectonicSwitch.getAttribute('aria-pressed');
      await tectonicSwitch.click();
      const isPressedAfter = await tectonicSwitch.getAttribute('aria-pressed');
      expect(isPressedAfter).not.toBe(isPressedBefore);
    }
  });
});
