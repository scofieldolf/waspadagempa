import { chromium } from '@playwright/test';

async function findBugs() {
  console.log('🔍 Starting comprehensive bug detection...\n');

  const browser = await chromium.launch({
    headless: false,
    timeout: 60000
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();
  const bugs = [];
  const consoleErrors = [];
  const consoleWarnings = [];
  const networkErrors = [];

  // Collect console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(msg.text());
    }
  });

  // Collect network errors
  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });

  // Collect page errors
  page.on('pageerror', error => {
    bugs.push({
      type: 'PAGE_ERROR',
      severity: 'HIGH',
      message: error.message,
      stack: error.stack
    });
  });

  try {
    console.log('📱 Loading application...');
    await page.goto('http://localhost:3001', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'bug-test-01-initial.png' });
    console.log('✅ Initial load complete\n');

    // Test 1: Check for visible error messages
    console.log('🔍 Test 1: Checking for visible errors...');
    const errorElements = await page.locator('text=/error|failed|not found|undefined|null/i').all();
    if (errorElements.length > 0) {
      for (let i = 0; i < Math.min(errorElements.length, 5); i++) {
        const text = await errorElements[i].textContent();
        if (text && text.trim() && !text.includes('global-error')) {
          bugs.push({
            type: 'VISIBLE_ERROR',
            severity: 'MEDIUM',
            message: `Visible error text found: "${text.substring(0, 100)}"`
          });
        }
      }
    }

    // Test 2: Check for broken images
    console.log('🔍 Test 2: Checking for broken images...');
    const images = await page.locator('img').all();
    for (const img of images) {
      const src = await img.getAttribute('src');
      const naturalWidth = await img.evaluate(el => el.naturalWidth);
      if (naturalWidth === 0 && src) {
        bugs.push({
          type: 'BROKEN_IMAGE',
          severity: 'LOW',
          message: `Broken image: ${src}`
        });
      }
    }

    // Test 3: Test language toggle
    console.log('🔍 Test 3: Testing language toggle...');
    const langButton = page.locator('button').filter({ hasText: /ID|EN/i }).first();
    if (await langButton.isVisible()) {
      await langButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'bug-test-02-lang-toggle.png' });
      console.log('  ✅ Language toggle works');
    } else {
      bugs.push({
        type: 'MISSING_ELEMENT',
        severity: 'MEDIUM',
        message: 'Language toggle button not found'
      });
    }

    // Test 4: Test earthquake filters
    console.log('🔍 Test 4: Testing earthquake filters...');
    const filterButtons = await page.locator('button').filter({ hasText: /All|Mag/i }).all();
    if (filterButtons.length > 0) {
      for (let i = 0; i < filterButtons.length; i++) {
        await filterButtons[i].click();
        await page.waitForTimeout(500);
      }
      await page.screenshot({ path: 'bug-test-03-filters.png' });
      console.log('  ✅ Earthquake filters work');
    }

    // Test 5: Test mobile responsiveness
    console.log('🔍 Test 5: Testing mobile responsiveness...');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'bug-test-04-mobile.png' });

    // Check for horizontal scroll on mobile
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    if (hasHorizontalScroll) {
      bugs.push({
        type: 'RESPONSIVE_ISSUE',
        severity: 'MEDIUM',
        message: 'Horizontal scroll detected on mobile viewport (375px)'
      });
    }

    // Test 6: Check map functionality on mobile
    console.log('🔍 Test 6: Checking map on mobile...');
    const mapExists = await page.locator('.leaflet-container').count() > 0;
    if (!mapExists) {
      bugs.push({
        type: 'MISSING_ELEMENT',
        severity: 'HIGH',
        message: 'Map container not found on mobile viewport'
      });
    }

    // Test 7: Test tablet responsiveness
    console.log('🔍 Test 7: Testing tablet responsiveness...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'bug-test-05-tablet.png' });

    // Test 8: Test large desktop
    console.log('🔍 Test 8: Testing large desktop view...');
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'bug-test-06-large-desktop.png' });

    // Test 9: Check for layout shifts
    console.log('🔍 Test 9: Checking for layout shifts...');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await page.waitForTimeout(500);

    const shifts = await page.evaluate(() => {
      return new Promise(resolve => {
        let cls = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });

        setTimeout(() => resolve(cls), 3000);
      });
    });

    if (shifts > 0.1) {
      bugs.push({
        type: 'LAYOUT_SHIFT',
        severity: 'MEDIUM',
        message: `Cumulative Layout Shift score: ${shifts.toFixed(4)} (threshold: 0.1)`
      });
    }

    // Test 10: Check accessibility issues
    console.log('🔍 Test 10: Basic accessibility checks...');

    // Check for images without alt text
    const imgsWithoutAlt = await page.locator('img:not([alt])').count();
    if (imgsWithoutAlt > 0) {
      bugs.push({
        type: 'ACCESSIBILITY',
        severity: 'LOW',
        message: `${imgsWithoutAlt} images without alt text`
      });
    }

    // Check for buttons without accessible names
    const buttonsWithoutLabel = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.filter(btn => {
        const hasText = btn.textContent?.trim();
        const hasAriaLabel = btn.getAttribute('aria-label');
        const hasTitle = btn.getAttribute('title');
        return !hasText && !hasAriaLabel && !hasTitle;
      }).length;
    });

    if (buttonsWithoutLabel > 0) {
      bugs.push({
        type: 'ACCESSIBILITY',
        severity: 'MEDIUM',
        message: `${buttonsWithoutLabel} buttons without accessible names`
      });
    }

    // Final screenshot
    await page.screenshot({ path: 'bug-test-07-final.png' });

  } catch (error) {
    bugs.push({
      type: 'TEST_ERROR',
      severity: 'HIGH',
      message: `Test execution error: ${error.message}`
    });
  } finally {
    await browser.close();
  }

  // Generate report
  console.log('\n' + '='.repeat(60));
  console.log('🐛 BUG DETECTION REPORT');
  console.log('='.repeat(60) + '\n');

  // Console errors
  if (consoleErrors.length > 0) {
    console.log('❌ CONSOLE ERRORS (' + consoleErrors.length + '):');
    consoleErrors.slice(0, 10).forEach((err, i) => {
      console.log(`  ${i + 1}. ${err.substring(0, 100)}`);
      bugs.push({
        type: 'CONSOLE_ERROR',
        severity: 'HIGH',
        message: err
      });
    });
    console.log('');
  }

  // Console warnings
  if (consoleWarnings.length > 0) {
    console.log('⚠️  CONSOLE WARNINGS (' + consoleWarnings.length + '):');
    consoleWarnings.slice(0, 5).forEach((warn, i) => {
      console.log(`  ${i + 1}. ${warn.substring(0, 100)}`);
    });
    console.log('');
  }

  // Network errors
  if (networkErrors.length > 0) {
    console.log('🌐 NETWORK ERRORS (' + networkErrors.length + '):');
    networkErrors.forEach((err, i) => {
      console.log(`  ${i + 1}. [${err.status}] ${err.url}`);
      bugs.push({
        type: 'NETWORK_ERROR',
        severity: 'MEDIUM',
        message: `${err.status} ${err.statusText}: ${err.url}`
      });
    });
    console.log('');
  }

  // Detected bugs
  if (bugs.length > 0) {
    console.log('🐛 BUGS DETECTED (' + bugs.length + '):');

    const highSeverity = bugs.filter(b => b.severity === 'HIGH');
    const mediumSeverity = bugs.filter(b => b.severity === 'MEDIUM');
    const lowSeverity = bugs.filter(b => b.severity === 'LOW');

    if (highSeverity.length > 0) {
      console.log('\n  🔴 HIGH SEVERITY (' + highSeverity.length + '):');
      highSeverity.forEach((bug, i) => {
        console.log(`    ${i + 1}. [${bug.type}] ${bug.message}`);
      });
    }

    if (mediumSeverity.length > 0) {
      console.log('\n  🟡 MEDIUM SEVERITY (' + mediumSeverity.length + '):');
      mediumSeverity.forEach((bug, i) => {
        console.log(`    ${i + 1}. [${bug.type}] ${bug.message}`);
      });
    }

    if (lowSeverity.length > 0) {
      console.log('\n  🟢 LOW SEVERITY (' + lowSeverity.length + '):');
      lowSeverity.forEach((bug, i) => {
        console.log(`    ${i + 1}. [${bug.type}] ${bug.message}`);
      });
    }
  } else {
    console.log('✅ NO BUGS DETECTED!');
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Bugs: ${bugs.length}`);
  console.log(`Console Errors: ${consoleErrors.length}`);
  console.log(`Console Warnings: ${consoleWarnings.length}`);
  console.log(`Network Errors: ${networkErrors.length}`);
  console.log('\n📸 Screenshots saved in ./bug-test-*.png');
  console.log('='.repeat(60) + '\n');

  return { bugs, consoleErrors, consoleWarnings, networkErrors };
}

findBugs();
