import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone SE size
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });

  const page = await context.newPage();

  try {
    console.log('Loading page...');
    await page.goto('http://localhost:3000', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('Waiting for content to render...');
    await page.waitForTimeout(5000);

    // Take screenshot with sidebar collapsed (default on mobile)
    await page.screenshot({
      path: 'mobile-collapsed.png',
      fullPage: false
    });
    console.log('Screenshot 1: Mobile with sidebar collapsed saved to mobile-collapsed.png');

    // Click toggle button to open sidebar
    await page.click('button[title="Expand Sidebar"]');
    await page.waitForTimeout(500);

    // Take screenshot with sidebar open
    await page.screenshot({
      path: 'mobile-expanded.png',
      fullPage: false
    });
    console.log('Screenshot 2: Mobile with sidebar expanded saved to mobile-expanded.png');

    // Click backdrop to close sidebar
    await page.click('div[class*="fixed inset-0 bg-black"]');
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'mobile-after-close.png',
      fullPage: false
    });
    console.log('Screenshot 3: Mobile after closing sidebar saved to mobile-after-close.png');

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'mobile-error.png' });
    console.log('Error screenshot saved to mobile-error.png');
  }

  await browser.close();
  console.log('\nTest completed!');
})();
