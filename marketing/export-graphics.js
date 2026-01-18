const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Helper function to wait
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Graphics to export
const graphics = {
  // Instagram Carousels - Week 1
  'instagram-carousels/week1': [
    'day1-smart-vision.html',
    'day2-300-rule.html',
    'day3-power-goals.html',
    'day4-drip-matrix.html',
    'day5-drip-deep-dive.html',
    'day7-weekly-recap.html'
  ],
  // Instagram Carousels - Week 2
  'instagram-carousels/week2': [
    'day8-time-tracking.html',
    'day9-energy-tracking.html',
    'day10-mins.html',
    'day11-app-reveal.html',
    'day12-300-deep-dive.html',
    'day14-weekly-recap.html'
  ],
  // Instagram Carousels - Week 3
  'instagram-carousels/week3': [
    'day15-morning-routine.html',
    'day16-shutdown-ritual.html',
    'day17-daily-reviews.html',
    'day18-pomodoro.html',
    'day21-sunday-planning.html'
  ],
  // Instagram Carousels - Week 4
  'instagram-carousels/week4': [
    'day22-4cs-leverage.html',
    'day23-delegation.html',
    'day24-friend-inventory.html',
    'day25-full-system.html',
    'day30-take-action.html'
  ],
  // LinkedIn Posts - Week 1
  'linkedin-posts/week1': [
    'day1-smart-vision.html',
    'day2-300-rule.html',
    'day3-power-goals.html',
    'day4-drip-matrix.html',
    'day5-drip-deep-dive.html',
    'day7-weekly-recap.html'
  ],
  // LinkedIn Posts - Week 2
  'linkedin-posts/week2': [
    'day8-time-tracking.html',
    'day9-energy-tracking.html',
    'day10-mins.html',
    'day11-app-reveal.html',
    'day12-300-deep-dive.html',
    'day14-weekly-recap.html'
  ],
  // LinkedIn Posts - Week 3
  'linkedin-posts/week3': [
    'day15-morning-routine.html',
    'day16-shutdown-ritual.html',
    'day17-daily-reviews.html',
    'day18-pomodoro.html'
  ],
  // LinkedIn Posts - Week 4
  'linkedin-posts/week4': [
    'day22-4cs-leverage.html',
    'day23-delegation.html',
    'day24-friend-inventory.html',
    'day25-full-system.html',
    'day30-take-action.html'
  ],
  // Instagram Stories - Week 1
  'instagram-stories/week1': [
    'day6-rest-day.html'
  ],
  // Instagram Stories - Week 2
  'instagram-stories/week2': [
    'day13-rest-day.html'
  ],
  // Instagram Stories - Week 3
  'instagram-stories/week3': [
    'day19-qa.html',
    'day20-rest-day.html'
  ],
  // Instagram Stories - Week 4
  'instagram-stories/week4': [
    'day26-testimonials.html',
    'day27-rest-day.html',
    'day28-recap.html',
    'day29-countdown.html'
  ]
};

// Dimensions for each platform
const dimensions = {
  'instagram-carousels': { width: 1080, height: 1080 },
  'linkedin-posts': { width: 1200, height: 627 },
  'instagram-stories': { width: 1080, height: 1920 }
};

async function exportGraphics() {
  console.log('Starting PNG export...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const marketingDir = __dirname;
  let exportCount = 0;
  let errorCount = 0;

  for (const [folder, files] of Object.entries(graphics)) {
    const platform = folder.split('/')[0];
    const { width, height } = dimensions[platform];

    // Create exports directory
    const exportsDir = path.join(marketingDir, folder, 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    console.log(`\nExporting ${folder} (${width}x${height})...`);

    for (const file of files) {
      const htmlPath = path.join(marketingDir, folder, file);
      const pngName = file.replace('.html', '.png');
      const pngPath = path.join(exportsDir, pngName);

      // Check if HTML file exists
      if (!fs.existsSync(htmlPath)) {
        console.log(`  [SKIP] ${file} - not found`);
        continue;
      }

      try {
        const page = await browser.newPage();
        await page.setViewport({ width, height, deviceScaleFactor: 2 });

        const fileUrl = `file://${htmlPath.replace(/\\/g, '/')}`;
        await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

        // Wait a bit for fonts and images to load
        await delay(500);

        // Find the graphic container and screenshot it
        const element = await page.$('.slide, .instagram-slide, .linkedin-graphic, .story');

        if (element) {
          await element.screenshot({ path: pngPath, type: 'png' });
        } else {
          // Fallback to full page screenshot with clip
          await page.screenshot({
            path: pngPath,
            type: 'png',
            clip: { x: 0, y: 0, width, height }
          });
        }

        console.log(`  [OK] ${pngName}`);
        exportCount++;

        await page.close();
      } catch (error) {
        console.log(`  [ERROR] ${file}: ${error.message}`);
        errorCount++;
      }
    }
  }

  await browser.close();

  console.log('\n========================================');
  console.log(`Export complete!`);
  console.log(`  Exported: ${exportCount} images`);
  console.log(`  Errors: ${errorCount}`);
  console.log('========================================\n');

  console.log('PNG files saved to:');
  for (const folder of Object.keys(graphics)) {
    console.log(`  marketing/${folder}/exports/`);
  }
}

// Handle Instagram carousels with multiple slides
async function exportCarouselSlides() {
  console.log('\nExporting individual carousel slides...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const marketingDir = __dirname;
  let exportCount = 0;

  const carouselFolders = Object.keys(graphics).filter(f => f.includes('instagram'));

  for (const folder of carouselFolders) {
    const files = graphics[folder];
    const exportsDir = path.join(marketingDir, folder, 'exports');

    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    for (const file of files) {
      const htmlPath = path.join(marketingDir, folder, file);

      if (!fs.existsSync(htmlPath)) continue;

      try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });

        const fileUrl = `file://${htmlPath.replace(/\\/g, '/')}`;
        await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });
        await delay(500);

        // Get all slides (try both selectors)
        let slides = await page.$$('.slide');
        if (slides.length === 0) {
          slides = await page.$$('.instagram-slide');
        }
        const baseName = file.replace('.html', '');

        if (slides.length > 1) {
          console.log(`  ${file} - ${slides.length} slides`);

          for (let i = 0; i < slides.length; i++) {
            const pngName = `${baseName}-slide${i + 1}.png`;
            const pngPath = path.join(exportsDir, pngName);

            await slides[i].screenshot({ path: pngPath, type: 'png' });
            console.log(`    [OK] ${pngName}`);
            exportCount++;
          }
        } else if (slides.length === 1) {
          const pngName = `${baseName}.png`;
          const pngPath = path.join(exportsDir, pngName);

          await slides[0].screenshot({ path: pngPath, type: 'png' });
          console.log(`  [OK] ${pngName}`);
          exportCount++;
        }

        await page.close();
      } catch (error) {
        console.log(`  [ERROR] ${file}: ${error.message}`);
      }
    }
  }

  await browser.close();
  console.log(`\nExported ${exportCount} carousel slides total.`);
}

// Handle Instagram stories with multiple stories per file
async function exportStorySlides() {
  console.log('\nExporting individual story slides...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const marketingDir = __dirname;
  let exportCount = 0;

  const storyFolders = Object.keys(graphics).filter(f => f.includes('instagram-stories'));

  for (const folder of storyFolders) {
    const files = graphics[folder];
    const exportsDir = path.join(marketingDir, folder, 'exports');

    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    for (const file of files) {
      const htmlPath = path.join(marketingDir, folder, file);

      if (!fs.existsSync(htmlPath)) continue;

      try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 2 });

        const fileUrl = `file://${htmlPath.replace(/\\/g, '/')}`;
        await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });
        await delay(500);

        // Get all stories
        const stories = await page.$$('.story');
        const baseName = file.replace('.html', '');

        if (stories.length > 1) {
          console.log(`  ${file} - ${stories.length} stories`);

          for (let i = 0; i < stories.length; i++) {
            const pngName = `${baseName}-story${i + 1}.png`;
            const pngPath = path.join(exportsDir, pngName);

            await stories[i].screenshot({ path: pngPath, type: 'png' });
            console.log(`    [OK] ${pngName}`);
            exportCount++;
          }
        } else if (stories.length === 1) {
          const pngName = `${baseName}.png`;
          const pngPath = path.join(exportsDir, pngName);

          await stories[0].screenshot({ path: pngPath, type: 'png' });
          console.log(`  [OK] ${pngName}`);
          exportCount++;
        }

        await page.close();
      } catch (error) {
        console.log(`  [ERROR] ${file}: ${error.message}`);
      }
    }
  }

  await browser.close();
  console.log(`\nExported ${exportCount} story slides total.`);
}

// Main execution
async function main() {
  try {
    // Export LinkedIn graphics (single images)
    console.log('=== Exporting LinkedIn Graphics ===');
    await exportGraphics();

    // Export Instagram carousel slides
    console.log('\n=== Exporting Instagram Carousel Slides ===');
    await exportCarouselSlides();

    // Export Instagram story slides
    console.log('\n=== Exporting Instagram Story Slides ===');
    await exportStorySlides();

  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
}

main();
