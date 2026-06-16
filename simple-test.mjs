import { chromium } from '@playwright/test';

async function simpleTest() {
  console.log('🚀 Testing Waspadagempa application...\n');

  const browser = await chromium.launch({
    headless: false,
    timeout: 60000
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    console.log('📱 Navigating to http://localhost:3001...');
    await page.goto('http://localhost:3001', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    console.log('⏳ Waiting for page to stabilize...');
    await page.waitForTimeout(8000);

    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: 'screenshot-test.png', fullPage: false });
    console.log('✅ Screenshot saved as screenshot-test.png\n');

    // Check if map loaded
    const mapExists = await page.locator('.leaflet-container').count() > 0;
    console.log(`🗺️  Map container found: ${mapExists ? '✅' : '❌'}\n`);

    // Check for sidebar
    const sidebarExists = await page.locator('[class*="sidebar"], aside, nav').count() > 0;
    console.log(`📋 Sidebar found: ${sidebarExists ? '✅' : '❌'}\n`);

    // Check for any visible errors
    const errorText = await page.locator('text=/error|failed|not found/i').count();
    console.log(`⚠️  Error messages found: ${errorText > 0 ? '❌ ' + errorText : '✅ None'}\n`);

    console.log('✨ Test completed! Check screenshot-test.png\n');
    console.log('Browser will stay open for 30 seconds for manual inspection...');

    // Keep browser open for manual inspection
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'screenshot-error.png' });
  } finally {
    await browser.close();
  }
}

simpleTest();
