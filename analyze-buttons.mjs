import { chromium } from '@playwright/test';

async function findButtonsWithoutLabels() {
  console.log('🔍 Analyzing buttons without accessible names...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:3001');
  await page.waitForTimeout(5000);

  const buttonInfo = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.map((btn, index) => {
      const hasText = btn.textContent?.trim();
      const ariaLabel = btn.getAttribute('aria-label');
      const title = btn.getAttribute('title');
      const classes = btn.className;
      const innerHTML = btn.innerHTML.substring(0, 200);

      return {
        index,
        hasText: !!hasText,
        text: hasText || '',
        ariaLabel: ariaLabel || '',
        title: title || '',
        classes,
        innerHTML,
        needsLabel: !hasText && !ariaLabel && !title
      };
    }).filter(btn => btn.needsLabel);
  });

  console.log('❌ Buttons without accessible names:\n');
  buttonInfo.forEach((btn, i) => {
    console.log(`${i + 1}. Button #${btn.index}`);
    console.log(`   Classes: ${btn.classes}`);
    console.log(`   HTML: ${btn.innerHTML}`);
    console.log('');
  });

  console.log(`Total: ${buttonInfo.length} buttons need accessible names\n`);

  await page.screenshot({ path: 'buttons-analysis.png', fullPage: true });
  await browser.close();

  return buttonInfo;
}

findButtonsWithoutLabels();
