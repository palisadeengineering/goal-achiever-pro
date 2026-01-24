const puppeteer = require('puppeteer');
const path = require('path');

async function exportLogo() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Set viewport to logo size
  await page.setViewport({ width: 500, height: 500 });

  // Load the HTML file
  const htmlPath = path.join(__dirname, 'instagram-carousels/week1/assets/logo-profile.html');
  await page.goto(`file://${htmlPath}`);

  // Export as PNG
  const outputPath = path.join(__dirname, 'buffer-ready/profile-photo.png');
  await page.screenshot({
    path: outputPath,
    type: 'png'
  });

  console.log(`Profile photo exported to: ${outputPath}`);

  // Also create a smaller version (320x320 for Instagram)
  await page.setViewport({ width: 320, height: 320 });
  await page.goto(`file://${htmlPath}`);

  const smallOutputPath = path.join(__dirname, 'buffer-ready/profile-photo-small.png');
  await page.screenshot({
    path: smallOutputPath,
    type: 'png'
  });

  console.log(`Small profile photo exported to: ${smallOutputPath}`);

  await browser.close();
  console.log('Done!');
}

exportLogo().catch(console.error);
