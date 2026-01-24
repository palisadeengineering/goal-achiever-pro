const puppeteer = require('puppeteer');
const path = require('path');

async function exportLogo() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Google Workspace recommended size: 320 x 132
  await page.setViewport({ width: 320, height: 132 });

  const htmlPath = path.join(__dirname, 'instagram-carousels/week1/assets/logo-google-workspace.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

  // Wait for font to load
  await new Promise(resolve => setTimeout(resolve, 1500));

  const outputPath = path.join(__dirname, 'buffer-ready/logo-google-workspace.png');
  await page.screenshot({
    path: outputPath,
    type: 'png'
  });

  console.log(`Google Workspace logo exported to: ${outputPath}`);

  await browser.close();
}

exportLogo().catch(console.error);
