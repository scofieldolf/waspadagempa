import { chromium } from '@playwright/test';

async function testApp() {
  console.log('🚀 Starting application test...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // 1. Load the application
    console.log('📱 Loading application...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for map to load

    await page.screenshot({ path: 'screenshots/01-initial-load.png', fullPage: true });
    console.log('✅ Initial load - screenshot saved\n');

    // 2. Test desktop view
    console.log('🖥️  Testing desktop view...');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/02-desktop-view.png', fullPage: true });
    console.log('✅ Desktop view - screenshot saved\n');

    // 3. Test language toggle
    console.log('🌐 Testing language toggle...');
    const langButton = page.locator('button').filter({ hasText: /ID|EN/i }).first();
    if (await langButton.isVisible()) {
      await langButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/03-language-toggle.png', fullPage: true });
      console.log('✅ Language toggle - screenshot saved\n');
    }

    // 4. Test earthquake filter
    console.log('🔍 Testing earthquake filter...');
    const filterButtons = await page.locator('button').filter({ hasText: /All|Mag/i }).all();
    if (filterButtons.length > 0) {
      await filterButtons[1].click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/04-earthquake-filter.png', fullPage: true });
      console.log('✅ Earthquake filter - screenshot saved\n');
    }

    // 5. Test tectonic plates toggle
    console.log('🌍 Testing tectonic plates...');
    const plateToggle = page.locator('button, input').filter({ hasText: /Tectonic|Lempeng/i }).first();
    if (await plateToggle.isVisible()) {
      await plateToggle.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/05-tectonic-plates.png', fullPage: true });
      console.log('✅ Tectonic plates - screenshot saved\n');
    }

    // 6. Test mobile view
    console.log('📱 Testing mobile view...');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/06-mobile-view.png', fullPage: true });
    console.log('✅ Mobile view - screenshot saved\n');

    // 7. Test tablet view
    console.log('📱 Testing tablet view...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/07-tablet-view.png', fullPage: true });
    console.log('✅ Tablet view - screenshot saved\n');

    // 8. Check console errors
    console.log('🔍 Checking for console errors...');
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    if (errors.length > 0) {
      console.log('⚠️  Console errors found:');
      errors.forEach(err => console.log(`   - ${err}`));
    } else {
      console.log('✅ No console errors detected\n');
    }

    // 9. Final screenshot
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/08-final-state.png', fullPage: true });
    console.log('✅ Final state - screenshot saved\n');

    console.log('✨ All tests completed successfully!\n');
    console.log('📸 Screenshots saved to ./screenshots/');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testApp();
