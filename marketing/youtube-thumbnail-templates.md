# YouTube Thumbnail Templates

Complete thumbnail system for Goal Achiever Pro YouTube channel.

---

## Specifications

### Dimensions
```
Width: 1280px
Height: 720px
Aspect Ratio: 16:9
File Format: PNG or JPG
Max File Size: 2MB
Color Space: sRGB
```

### Safe Zones
```
┌────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────┐   │
│ │                                                  │   │
│ │                 SAFE ZONE                        │   │
│ │              (1200 x 640px)                      │   │
│ │                                                  │   │
│ │    Keep key elements inside this area           │   │
│ │                                                  │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│                              ┌─────────┐               │
│                              │ DURATION│ ← Avoid       │
│                              │ 12:34   │   bottom-right│
│                              └─────────┘               │
└────────────────────────────────────────────────────────┘

Margins: 40px on all sides
Duration overlay: Bottom-right 120x40px - AVOID THIS AREA
```

---

## Brand Colors

### Primary Palette
```
CYAN (Primary):     #00BEFF / rgb(0, 190, 255)
DARK BG:            #0A0A0A / rgb(10, 10, 10)
LIGHT TEXT:         #FAFAFA / rgb(250, 250, 250)
```

### Accent Colors
```
SUCCESS GREEN:      #22C55E / rgb(34, 197, 94)
WARNING AMBER:      #F59E0B / rgb(245, 158, 11)
ERROR RED:          #EF4444 / rgb(239, 68, 68)
```

### Gradient Options
```
Gradient 1: #00BEFF → #0066FF (Cyan to Blue)
Gradient 2: #0A0A0A → #1A1A2E (Dark to Navy)
Gradient 3: #00BEFF → #00FFB2 (Cyan to Teal)
```

---

## Typography

### Primary Font: Outfit
```
Headlines: Outfit Bold (700) or ExtraBold (800)
Subheadlines: Outfit SemiBold (600)

Download: https://fonts.google.com/specimen/Outfit
```

### Font Sizes (at 1280x720)
```
Main Text (2-3 words): 120-160px
Secondary Text: 60-80px
Small Text/Labels: 40-50px
```

### Text Styling
```
Letter Spacing: -2% to -4% (tighter for impact)
Line Height: 0.9 - 1.0 (tight)
Text Transform: UPPERCASE for main headlines
```

### Text Effects
```
Drop Shadow: 0px 4px 20px rgba(0,0,0,0.5)
Outline: 4-6px stroke in contrasting color
Glow: 0px 0px 40px brand color at 50% opacity
```

---

## Template 1: Face + Text (Most Common)

### Layout
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│                                    ┌────────────────┐  │
│   ┌──────────┐                     │   HEADLINE     │  │
│   │          │                     │   TEXT HERE    │  │
│   │   FACE   │                     │   (2-4 words)  │  │
│   │  (40%)   │                     │                │  │
│   │          │                     └────────────────┘  │
│   │          │                                         │
│   └──────────┘                                         │
│                                                        │
└────────────────────────────────────────────────────────┘

Face: Left 40% of frame
Text: Right 55% of frame
Background: Gradient or solid color
```

### Specs
```css
.face-container {
  position: absolute;
  left: 0;
  width: 40%;
  height: 100%;
}

.text-container {
  position: absolute;
  right: 5%;
  top: 50%;
  transform: translateY(-50%);
  width: 50%;
  text-align: right;
}

.headline {
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 140px;
  color: #FAFAFA;
  text-shadow: 0 4px 20px rgba(0,0,0,0.5);
  line-height: 0.95;
}
```

### Face Guidelines
```
Expression: Strong emotion (surprise, curiosity, determination)
Eye Contact: Looking at camera OR at text
Cropping: Head and shoulders, face takes 30-40% of frame
Lighting: Well-lit, no harsh shadows
Background: Remove or blur original background
```

### Example Text Placements
```
Video: "Complete Goal System"
Text:  THE GOAL
       SYSTEM

Video: "Time Audit Tutorial"
Text:  22 HOURS
       FOUND

Video: "Morning Routine"
Text:  WIN BY
       8AM
```

---

## Template 2: Big Number Focus

### Layout
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│              ┌─────────────────────┐                   │
│              │                     │                   │
│              │        93%          │                   │
│              │                     │                   │
│              │    of goals fail    │                   │
│              │                     │                   │
│              └─────────────────────┘                   │
│                                                        │
│                              ┌─────┐                   │
│                              │FACE │ (small, corner)   │
│                              └─────┘                   │
└────────────────────────────────────────────────────────┘

Number: Center, 60% of frame
Subtext: Below number
Face: Small, bottom-right corner (optional)
```

### Specs
```css
.number {
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 300px;
  color: #00BEFF;
  text-align: center;
  text-shadow: 0 0 60px rgba(0,190,255,0.5);
}

.subtext {
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  font-size: 60px;
  color: #FAFAFA;
  text-align: center;
  margin-top: -20px;
}

.small-face {
  position: absolute;
  bottom: 40px;
  right: 40px;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  border: 4px solid #00BEFF;
}
```

### Number Examples
```
"93%" - goals that fail
"22" - hours/week found
"300%" - the rule
"12" - power goals
"15" - minute blocks
"3" - MINs per day
"$500" - delegation decision
```

---

## Template 3: Before/After Split

### Layout
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│   ┌───────────────────┐ │ ┌───────────────────┐       │
│   │                   │ │ │                   │       │
│   │      BEFORE       │ │ │       AFTER       │       │
│   │                   │ │ │                   │       │
│   │   (chaos image)   │ │ │   (calm image)    │       │
│   │                   │ │ │                   │       │
│   │   RED TINT        │ │ │   GREEN/CYAN TINT │       │
│   │                   │ │ │                   │       │
│   └───────────────────┘ │ └───────────────────┘       │
│                         │                              │
│         "BEFORE"        │        "AFTER"               │
└────────────────────────────────────────────────────────┘

Left Half: "Before" state with red overlay
Right Half: "After" state with green/cyan overlay
Center Line: Diagonal or straight divider
Labels: Top of each section
```

### Specs
```css
.before-section {
  position: absolute;
  left: 0;
  width: 50%;
  height: 100%;
  background: linear-gradient(rgba(239,68,68,0.3), rgba(239,68,68,0.3));
}

.after-section {
  position: absolute;
  right: 0;
  width: 50%;
  height: 100%;
  background: linear-gradient(rgba(0,190,255,0.3), rgba(0,190,255,0.3));
}

.divider {
  position: absolute;
  left: 50%;
  width: 8px;
  height: 100%;
  background: #FAFAFA;
  transform: skewX(-5deg);
}

.label {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 48px;
  color: #FAFAFA;
  text-transform: uppercase;
  padding: 20px;
}
```

### Comparison Ideas
```
Before: Messy desk / After: Organized workspace
Before: Overwhelmed face / After: Confident face
Before: Chaotic calendar / After: Blocked calendar
Before: 70 hours / After: 40 hours
Before: Stressed / After: Balanced
```

---

## Template 4: Framework/Matrix

### Layout
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│              ┌─────────┬─────────┐                     │
│              │    D    │    R    │                     │
│   DRIP       ├─────────┼─────────┤      FACE           │
│   MATRIX     │    I    │    P    │     (corner)        │
│              └─────────┴─────────┘                     │
│                                                        │
│                    "Find 20 Hours"                     │
│                                                        │
└────────────────────────────────────────────────────────┘

Framework: Center-left with visual representation
Face: Right side, looking at framework
Title/Hook: Below or above framework
```

### Specs
```css
.matrix-container {
  position: absolute;
  left: 10%;
  top: 50%;
  transform: translateY(-50%);
  width: 400px;
  height: 300px;
}

.matrix-cell {
  width: 50%;
  height: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 80px;
}

.cell-d { background: rgba(239,68,68,0.8); }
.cell-r { background: rgba(245,158,11,0.8); }
.cell-i { background: rgba(34,197,94,0.8); }
.cell-p { background: rgba(0,190,255,0.8); }
```

### Framework Examples
```
DRIP Matrix (2x2 grid)
300% Rule (3 circles: Clarity, Belief, Consistency)
Goal Hierarchy (pyramid)
Power Goals (12 boxes in 4 rows)
Daily Reviews (3 icons: morning, midday, evening)
```

---

## Template 5: Text Only (Bold Statement)

### Layout
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│                                                        │
│                    STOP                                │
│                  SETTING                               │
│                   GOALS                                │
│                                                        │
│              (contrarian/provocative)                  │
│                                                        │
│                                                        │
└────────────────────────────────────────────────────────┘

Text: Centered, stacked
Background: Gradient or textured
No face required
```

### Specs
```css
.bold-text {
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 160px;
  color: #FAFAFA;
  text-align: center;
  text-transform: uppercase;
  line-height: 0.85;
  text-shadow:
    0 0 40px rgba(0,190,255,0.5),
    0 4px 20px rgba(0,0,0,0.5);
}

.background {
  background: linear-gradient(135deg, #0A0A0A 0%, #1A1A2E 100%);
}

/* Optional: Add subtle pattern or texture */
.texture-overlay {
  background-image: url('noise.png');
  opacity: 0.05;
}
```

### Bold Statement Examples
```
"STOP SETTING GOALS"
"TO-DO LISTS ARE BROKEN"
"YOU'RE WASTING TIME"
"93% FAIL"
"BUSY ≠ PRODUCTIVE"
```

---

## Template 6: App Screenshot Feature

### Layout
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│   ┌─────────────────┐                                  │
│   │                 │         NEW FEATURE              │
│   │   APP SCREEN    │                                  │
│   │   (mockup)      │         Progress                 │
│   │                 │         Dashboard                │
│   │                 │                                  │
│   └─────────────────┘                                  │
│                                                        │
│                                    ┌─────┐             │
│                                    │FACE │             │
│                                    └─────┘             │
└────────────────────────────────────────────────────────┘

App Screenshot: Left side, in device mockup
Feature Name: Right side, large text
Face: Small, bottom-right
```

### Specs
```css
.phone-mockup {
  position: absolute;
  left: 8%;
  top: 50%;
  transform: translateY(-50%) rotate(-5deg);
  width: 280px;
  height: 560px;
  border-radius: 40px;
  border: 8px solid #333;
  background: #000;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}

.feature-text {
  position: absolute;
  right: 8%;
  top: 30%;
  text-align: right;
}

.feature-label {
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  font-size: 40px;
  color: #00BEFF;
  text-transform: uppercase;
  letter-spacing: 4px;
}

.feature-name {
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 100px;
  color: #FAFAFA;
  line-height: 1.0;
}
```

---

## Template 7: List/Number Series

### Layout
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│       5                                                │
│      HABITS           [FACE with                       │
│        that           expression]                      │
│      change                                            │
│   everything                                           │
│                                                        │
└────────────────────────────────────────────────────────┘

Number: Large, left side
Text: Stacked below number
Face: Right side
```

### Specs
```css
.big-number {
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 280px;
  color: #00BEFF;
  line-height: 0.8;
}

.list-text {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 70px;
  color: #FAFAFA;
  text-transform: uppercase;
  line-height: 1.1;
}

.highlight-word {
  color: #00BEFF;
}
```

### Number Series Examples
```
"3 MINs that win your day"
"5 habits that change everything"
"7 time vampires to eliminate"
"12 Power Goals for 2025"
"The 300% Rule"
```

---

## Color Combinations

### Combination 1: Dark + Cyan (Primary)
```
Background: #0A0A0A (dark)
Primary Text: #FAFAFA (white)
Accent: #00BEFF (cyan)
Use for: Most videos
```

### Combination 2: Cyan + Dark
```
Background: #00BEFF (cyan)
Primary Text: #0A0A0A (dark)
Accent: #FAFAFA (white)
Use for: Important/featured videos
```

### Combination 3: Gradient Drama
```
Background: Linear gradient #0A0A0A → #1A1A2E
Primary Text: #FAFAFA (white)
Accent: #00BEFF (cyan) with glow
Use for: Pillar content
```

### Combination 4: Warning/Urgent
```
Background: #0A0A0A (dark)
Primary Text: #F59E0B (amber) or #EF4444 (red)
Accent: #FAFAFA (white)
Use for: Contrarian/provocative content
```

---

## Thumbnail Checklist

### Before Creating
```
□ Video title finalized
□ 2-4 word hook identified
□ Face photo selected (if using)
□ Template style chosen
□ Color scheme selected
```

### Design Phase
```
□ Canvas set to 1280x720px
□ Key elements in safe zone
□ Text readable at small size (100px thumbnail)
□ High contrast between text and background
□ Face clearly visible (if using)
□ Brand colors applied
```

### Quality Check
```
□ No text in bottom-right (duration overlay)
□ Text readable at YouTube thumbnail size
□ Emotion/curiosity conveyed
□ Consistent with channel branding
□ File size under 2MB
□ Exported as PNG or high-quality JPG
```

### A/B Testing
```
□ Create 2-3 variations
□ Test different:
  - Text placement
  - Face expressions
  - Color schemes
  - Number vs text focus
```

---

## Thumbnail Examples by Video Type

### Tutorial Videos
```
Template: Face + Text
Text: Action-oriented ("FIND 20 HOURS", "WIN YOUR MORNING")
Face: Helpful/confident expression
Color: Primary (dark + cyan)
```

### Concept Explainers
```
Template: Framework/Matrix OR Big Number
Text: The concept name ("DRIP MATRIX", "300% RULE")
Visual: Framework graphic
Color: Primary or gradient
```

### App Walkthroughs
```
Template: App Screenshot Feature
Text: Feature name ("PROGRESS PAGE", "AI TRACKING")
Visual: App screenshot in device mockup
Color: Primary
```

### Contrarian/Provocative
```
Template: Text Only OR Face + Text
Text: Bold statement ("STOP SETTING GOALS")
Face: Skeptical/challenging expression
Color: Warning (amber/red accent)
```

### Results/Transformations
```
Template: Before/After OR Big Number
Text: The result ("65 → 40 HOURS")
Visual: Comparison or number focus
Color: Green accent for "after"
```

---

## Canva Setup Guide

### Step 1: Create Template
```
1. New design → Custom size → 1280 x 720 px
2. Set background color: #0A0A0A
3. Add guides at 40px margins
4. Save as template
```

### Step 2: Add Brand Kit
```
Colors:
- #00BEFF (Cyan)
- #0A0A0A (Dark)
- #FAFAFA (Light)
- #22C55E (Green)
- #F59E0B (Amber)
- #EF4444 (Red)

Fonts:
- Upload Outfit font family
- Set as brand font
```

### Step 3: Create Template Variations
```
1. Face + Text template
2. Big Number template
3. Before/After template
4. Framework template
5. Text Only template
6. App Screenshot template
```

### Step 4: Add Elements Library
```
- Face cutouts (multiple expressions)
- App screenshots
- Framework graphics
- Icon set
- Texture overlays
```

---

## Figma Setup Guide

### Step 1: Create Frame
```
Frame: 1280 x 720
Name: "YT Thumbnail - [Type]"
Background: #0A0A0A
```

### Step 2: Set Up Grid
```
Layout Grid:
- Columns: 12
- Margin: 40px
- Gutter: 20px
```

### Step 3: Create Components
```
Components to create:
- Text/Headline (auto-layout)
- Face container
- Number display
- Framework graphics
- App mockup
```

### Step 4: Create Variants
```
Component variants for:
- Color schemes (dark, light, accent)
- Text sizes (large, medium, small)
- Face positions (left, right, corner)
```

---

## Export Settings

### For YouTube Upload
```
Format: PNG
Quality: Maximum
Color Profile: sRGB
Dimensions: 1280 x 720 px exactly
```

### File Naming
```
[VIDEO-ID]_thumb_v[VERSION].png

Examples:
V001_thumb_v1.png
V001_thumb_v2.png (A/B test variation)
V015_thumb_final.png
```

### Batch Export (Figma)
```
1. Select all thumbnail frames
2. Export → PNG → 1x
3. Use frame names as filenames
```

---

## Quick Reference Card

### Text Guidelines
```
Main text: 2-4 words MAX
Font size: 120-160px minimum
Always UPPERCASE for headlines
High contrast with background
```

### Face Guidelines
```
Strong emotion visible
Eye contact with camera or text
Well-lit, no harsh shadows
Remove/blur background
30-40% of frame
```

### Color Rules
```
Primary: Dark background + white text + cyan accent
Maximum 3 colors per thumbnail
Text must pass contrast check
Cyan for emphasis/highlighting
```

### Size Test
```
View at 100px width (mobile search)
All text still readable?
Face still recognizable?
Main message clear?
```
