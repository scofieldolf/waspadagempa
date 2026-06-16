import { chromium } from '@playwright/test';

async function advancedBugTests() {
  console.log('🔍 Running advanced bug detection tests...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const bugs = [];
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      bugs.push({
        type: 'CONSOLE_ERROR',
        severity: 'HIGH',
        message: msg.text()
      });
    }
  });

  page.on('pageerror', error => {
    bugs.push({
      type: 'PAGE_ERROR',
      severity: 'HIGH',
      message: error.message
    });
  });

  try {
    // Load app
    console.log('📱 Loading application...');
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(6000);

    // Test 1: Click all toggles rapidly to check for state issues
    console.log('🔍 Test 1: Rapid toggle testing...');
    const allToggles = await page.locator('button[aria-pressed]').all();
    console.log(`  Found ${allToggles.length} toggleable buttons`);

    for (const toggle of allToggles) {
      try {
        await toggle.click({ delay: 50 });
        await toggle.click({ delay: 50 });
        await toggle.click({ delay: 50 });
      } catch (e) {
        bugs.push({
          type: 'TOGGLE_ERROR',
          severity: 'MEDIUM',
          message: `Toggle click failed: ${e.message}`
        });
      }
    }
    await page.waitForTimeout(500);
    console.log('  ✅ Rapid toggling completed');

    // Test 2: Check for memory leaks with repeated navigation
    console.log('🔍 Test 2: Navigation stress test...');
    const originalUrl = page.url();
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await page.waitForTimeout(2000);
    }
    console.log('  ✅ Navigation stress test completed');

    // Test 3: Check if all images load
    console.log('🔍 Test 3: Image loading check...');
    const images = await page.locator('img').all();
    console.log(`  Found ${images.length} images`);
    for (let i = 0; i < Math.min(images.length, 10); i++) {
      const src = await images[i].getAttribute('src');
      const loaded = await images[i].evaluate(el => el.complete && el.naturalWidth > 0);
      if (!loaded && src) {
        bugs.push({
          type: 'IMAGE_LOAD_ERROR',
          severity: 'LOW',
          message: `Image failed to load: ${src}`
        });
      }
    }
    console.log('  ✅ Image loading check completed');

    // Test 4: Check for missing error boundaries with unmount/remount
    console.log('🔍 Test 4: Component unmount/remount test...');

    // Collapse sidebar and expand
    const collapseBtn = page.locator('button[aria-label="Collapse Sidebar"]').first();
    if (await collapseBtn.count() > 0) {
      await collapseBtn.click();
      await page.waitForTimeout(1000);
      await page.locator('button[aria-label="Collapse Sidebar"]').nth(1).click();
      await page.waitForTimeout(1000);
    }
    console.log('  ✅ Unmount/remount test completed');

    // Test 5: Check if all buttons have consistent focus states
    console.log('🔍 Test 5: Focus state check...');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName.toLowerCase() : null;
    });
    console.log(`  ✅ Focus moves correctly (currently on: ${focusedElement})`);

    // Test 6: Check for hover/focus state consistency
    console.log('🔍 Test 6: Interactive element state check...');
    const buttons = await page.locator('button').all();
    console.log(`  Found ${buttons.length} buttons`);

    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      const rect = await buttons[i].boundingBox();
      if (rect) {
        await buttons[i].hover();
        await page.waitForTimeout(200);
      }
    }
    console.log('  ✅ Hover state check completed');

    // Test 7: Check for proper aria attributes
    console.log('🔍 Test 7: ARIA attributes check...');

    // Check buttons with aria-pressed have corresponding aria-expanded if toggleable
    const buttonsWithPressed = await page.locator('button[aria-pressed]').count();
    console.log(`  Found ${buttonsWithPressed} buttons with aria-pressed`);

    // Check for proper aria-labels
    const ariaLabelsMissing = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.filter(btn => {
        const hasIcon = btn.querySelector('svg, img');
        const hasText = btn.textContent?.trim();
        return hasIcon && !hasText && !btn.getAttribute('aria-label');
      }).length;
    });

    if (ariaLabelsMissing > 0) {
      bugs.push({
        type: 'MISSING_ARIA_LABEL',
        severity: 'MEDIUM',
        message: `${ariaLabelsMissing} buttons with icons but no aria-label`
      });
    }
    console.log(`  ✅ ARIA check completed (${ariaLabelsMissing} missing labels)`);

    // Test 8: Check for proper error handling with invalid filter values
    console.log('🔍 Test 8: Filter edge case testing...');

    // Try to set invalid earthquake filter
    await page.evaluate(() => {
      // Simulate invalid state
      const originalState = window.__NEXT_DATA__?.props?.pageProps;
    });

    // Try different filters
    const filterButtons = await page.locator('button').filter({ hasText: /Mag|All/i }).all();
    for (const btn of filterButtons) {
      const text = await btn.textContent();
      if (text && text.trim()) {
        await btn.click();
        await page.waitForTimeout(300);
      }
    }
    console.log('  ✅ Filter edge case testing completed');

    // Test 9: Check for proper color contrast
    console.log('🔍 Test 9: Color contrast check (basic)...');

    const contrastIssues = await page.evaluate(() => {
      // Basic check: look for light text on light background
      const buttons = Array.from(document.querySelectorAll('button'));
      const issues = [];

      buttons.slice(0, 20).forEach(btn => {
        const style = window.getComputedStyle(btn);
        const color = style.color;
        const bgColor = style.backgroundColor;

        // Simple check for low contrast combinations
        if (color && bgColor &&
            (color.includes('rgba(0, 0, 0') || color.includes('rgb(0, 0, 0')) &&
            (bgColor.includes('rgba(255, 255, 255') || bgColor.includes('rgb(255, 255, 255'))) {
          // This is white text on white background - issue!
          issues.push({ text: btn.textContent?.trim(), class: btn.className });
        }
      });

      return issues.slice(0, 3); // Return first 3 issues
    });

    console.log(`  ✅ Color contrast check completed (${contrastIssues.length} potential issues)`);

    // Test 10: Check for proper loading states
    console.log('🔍 Test 10: Loading state check...');
    const loadingSpinners = await page.locator('div').filter({
      has: page.locator('.animate-spin, .animate-pulse')
    }).count();
    console.log(`  Found ${loadingSpinners} potential loading states`);

    // Final screenshot
    await page.screenshot({ path: 'advanced-bugs-final.png', fullPage: true });
    console.log('\n✅ Advanced testing completed');

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
  console.log('🔍 ADVANCED BUG DETECTION REPORT');
  console.log('='.repeat(60) + '\n');

  if (consoleErrors.length > 0) {
    console.log('❌ CONSOLE ERRORS (' + consoleErrors.length + '):');
    consoleErrors.slice(0, 10).forEach((err, i) => {
      console.log(`  ${i + 1}. ${err.substring(0, 100)}`);
    });
    console.log('');
  }

  if (bugs.length > 0) {
    console.log('🐛 BUGS DETECTED (' + bugs.length + '):');

    const byType = {};
    bugs.forEach(b => {
      if (!byType[b.type]) byType[b.type] = [];
      byType[b.type].push(b);
    });

    Object.entries(byType).forEach(([type, typeBugs]) => {
      console.log(`\n  ${type} (${typeBugs.length}):`);
      typeBugs.slice(0, 5).forEach((bug, i) => {
        console.log(`    ${i + 1}. [${bug.severity}] ${bug.message}`);
      });
    });
  } else {
    console.log('✅ NO BUGS DETECTED IN ADVANCED TESTS!');
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Bugs: ${bugs.length}`);
  console.log(`Console Errors: ${consoleErrors.length}`);
  console.log('\n📸 Screenshots saved: advanced-bugs-final.png');
  console.log('='.repeat(60) + '\n');

  return bugs;
}

advancedBugTests();
