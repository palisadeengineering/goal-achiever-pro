# Week 1 Instagram Carousels - Goal Achiever Pro

## Overview

This folder contains 5 carousel graphics for Week 1 of your social media content calendar. Each carousel is themed around Goal Achiever Pro's core concepts.

## Carousels Included

| Day | File | Topic | Slides |
|-----|------|-------|--------|
| 1 | `day1-smart-vision.html` | SMART Vision Framework | 5 |
| 2 | `day2-300-rule.html` | The 300% Rule | 7 |
| 3 | `day3-power-goals.html` | 12 Impact Projects | 6 |
| 4 | `day4-drip-matrix.html` | Value Matrix | 7 |
| 7 | `day7-sunday-routine.html` | Sunday Night Routine | 6 |

## How to Export as Images

### Option 1: Browser Screenshot (Quickest)

1. Open the HTML file in Chrome or Firefox
2. Each slide is 1080x1080px (Instagram's optimal size)
3. Take a screenshot of each slide using:
   - **Mac**: Cmd + Shift + 4, then drag to select
   - **Windows**: Use Snipping Tool or Win + Shift + S
4. Save each screenshot as a PNG

### Option 2: Chrome DevTools (More Precise)

1. Open the HTML file in Chrome
2. Right-click → Inspect
3. Click the device toggle icon (or Cmd/Ctrl + Shift + M)
4. Set custom dimensions: 1080 x 1080
5. Right-click on the slide → "Capture node screenshot"

### Option 3: Puppeteer Script (Automated)

```javascript
const puppeteer = require('puppeteer');

async function captureSlides(htmlFile, outputPrefix) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`file://${__dirname}/${htmlFile}`);

  const slides = await page.$$('.slide');
  for (let i = 0; i < slides.length; i++) {
    await slides[i].screenshot({
      path: `${outputPrefix}-${i + 1}.png`,
      clip: { x: 0, y: 0, width: 1080, height: 1080 }
    });
  }

  await browser.close();
}

captureSlides('day1-smart-vision.html', 'day1-slide');
```

### Option 4: Figma/Canva Import

1. Open the HTML in browser
2. Screenshot each slide
3. Import into Figma or Canva
4. Export as PNG at 1080x1080

## Brand Assets

### Logo Files
- `assets/logo.svg` - Full color logo (cyan background)
- `assets/logo-white.svg` - White logo for dark backgrounds

### Brand Colors (matching your app)
- **Primary (Cyan)**: `#0891B2`
- **Bright Cyan**: `#00BEFF`
- **Dark Background**: `#0f172a` to `#1e293b`
- **Value Colors**:
  - Delegation (Purple): `#a855f7`
  - Replacement (Amber): `#f59e0b`
  - Investment (Blue): `#3b82f6`
  - Production (Cyan): `#00BEFF`

## Customization

### Changing the Handle
Search and replace `@goalachieverpro` with your actual Instagram handle in each file.

### Adding App Screenshots
To add real screenshots from your app:

1. Take screenshots of your app's features
2. Save them to the `assets` folder
3. Reference them in the HTML:
```html
<img src="assets/your-screenshot.png" alt="App Screenshot" style="max-width: 400px; border-radius: 16px;">
```

### Modifying Content
Each slide is a `<div class="slide">` element. Edit the text directly in the HTML.

## Typography

The carousels use the **Inter** font family from Google Fonts. It's loaded automatically via the stylesheet.

## Dimensions

All slides are sized at **1080 x 1080 pixels**, which is optimal for:
- Instagram feed posts
- Instagram carousel posts
- Facebook posts
- LinkedIn posts

## File Structure

```
week1/
├── README.md
├── styles.css              # Shared styles
├── day1-smart-vision.html
├── day2-300-rule.html
├── day3-power-goals.html
├── day4-drip-matrix.html
├── day7-sunday-routine.html
└── assets/
    ├── logo.svg
    └── logo-white.svg
```

## Next Steps

1. Export all slides as PNG images
2. Upload to your scheduling tool (Buffer, Later, Hootsuite)
3. Add captions from the main content calendar (`../social-media-content-calendar.md`)
4. Schedule according to the calendar

## Tips for Maximum Engagement

1. **First slide is crucial** - Make it a pattern interrupt
2. **Last slide = CTA** - Always end with a question or action
3. **Keep text readable** - The fonts are sized for mobile viewing
4. **Test on mobile** - View the exported images on your phone before posting
