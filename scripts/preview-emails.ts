/**
 * Email Template Preview Script
 * Run with: npx tsx scripts/preview-emails.ts
 * Then open the generated HTML files in your browser
 */

import * as fs from 'fs';
import * as path from 'path';

// Import the Next.js email templates
import { generateWelcomeEmail } from '../src/lib/email/templates/welcome';
import { generateMagicLinkEmail } from '../src/lib/email/templates/magic-link';
import { generateResetPasswordEmail } from '../src/lib/email/templates/reset-password';
import { generateShareInvitationEmail } from '../src/lib/email/templates/share-invitation';

// Create output directory
const outputDir = path.join(process.cwd(), 'email-previews');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate preview data
const previewData = {
  userName: 'John Doe',
  userEmail: 'john@example.com',
  appUrl: 'https://goalachieverpro.com',
};

// Generate all email templates
const templates = [
  {
    name: 'welcome',
    subject: 'Welcome to Goal Achiever Pro',
    html: generateWelcomeEmail({
      userName: previewData.userName,
      confirmUrl: `${previewData.appUrl}/auth/confirm?token=abc123`,
    }),
  },
  {
    name: 'welcome-no-confirm',
    subject: 'Welcome to Goal Achiever Pro (No Confirmation)',
    html: generateWelcomeEmail({
      userName: previewData.userName,
      loginUrl: `${previewData.appUrl}/dashboard`,
    }),
  },
  {
    name: 'magic-link',
    subject: 'Sign in to Goal Achiever Pro',
    html: generateMagicLinkEmail({
      magicLinkUrl: `${previewData.appUrl}/auth/verify?token=xyz789&type=magiclink`,
      userEmail: previewData.userEmail,
      expiresInMinutes: 60,
    }),
  },
  {
    name: 'reset-password',
    subject: 'Reset Your Password',
    html: generateResetPasswordEmail({
      resetUrl: `${previewData.appUrl}/reset-password?token=def456`,
      userEmail: previewData.userEmail,
      userName: previewData.userName,
      expiresInHours: 24,
    }),
  },
  {
    name: 'share-invitation',
    subject: "You've been invited to collaborate",
    html: generateShareInvitationEmail({
      ownerName: 'Jane Smith',
      ownerEmail: 'jane@example.com',
      inviteeName: previewData.userName,
      tabs: [
        { tabName: 'vision', permissionLevel: 'edit' },
        { tabName: 'goals', permissionLevel: 'edit' },
        { tabName: 'time_audit', permissionLevel: 'view' },
        { tabName: 'analytics', permissionLevel: 'view' },
      ],
      acceptUrl: `${previewData.appUrl}/sharing/accept?token=invite123`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    }),
  },
];

// Write each template to a file
console.log('\n📧 Generating email template previews...\n');

templates.forEach(({ name, subject, html }) => {
  const filePath = path.join(outputDir, `${name}.html`);
  fs.writeFileSync(filePath, html);
  console.log(`  ✓ ${name}.html - "${subject}"`);
});

// Create an index page to view all templates
const indexHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Email Template Previews</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 40px;
      background: #f4f4f5;
    }
    h1 {
      color: #18181b;
      margin-bottom: 8px;
    }
    p.subtitle {
      color: #71717a;
      margin-bottom: 32px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
    }
    .card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .card-header {
      padding: 16px 20px;
      border-bottom: 1px solid #e4e4e7;
    }
    .card-header h3 {
      margin: 0 0 4px 0;
      color: #18181b;
      font-size: 16px;
    }
    .card-header p {
      margin: 0;
      color: #71717a;
      font-size: 13px;
    }
    .card-body {
      padding: 20px;
    }
    .card-body a {
      display: block;
      padding: 12px 20px;
      background: #18181b;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      text-align: center;
      font-weight: 500;
      transition: background 0.2s;
    }
    .card-body a:hover {
      background: #27272a;
    }
    .instructions {
      margin-top: 40px;
      padding: 20px;
      background: white;
      border-radius: 12px;
      border-left: 4px solid #18181b;
    }
    .instructions h3 {
      margin: 0 0 12px 0;
      color: #18181b;
    }
    .instructions code {
      background: #f4f4f5;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <h1>Email Template Previews</h1>
  <p class="subtitle">Click on any template to preview it in a new tab</p>

  <div class="grid">
    ${templates
      .map(
        ({ name, subject }) => `
      <div class="card">
        <div class="card-header">
          <h3>${subject}</h3>
          <p>${name}.html</p>
        </div>
        <div class="card-body">
          <a href="${name}.html" target="_blank">Preview Template</a>
        </div>
      </div>
    `
      )
      .join('')}
  </div>

  <div class="instructions">
    <h3>Testing Tips</h3>
    <ul>
      <li>Check responsiveness by resizing your browser window</li>
      <li>Test in different email clients using <a href="https://www.emailonacid.com/" target="_blank">Email on Acid</a> or <a href="https://litmus.com/" target="_blank">Litmus</a></li>
      <li>Verify all links point to correct URLs</li>
      <li>Check dark mode compatibility in email clients that support it</li>
    </ul>
  </div>
</body>
</html>
`;

fs.writeFileSync(path.join(outputDir, 'index.html'), indexHtml);

console.log(`\n✅ Generated ${templates.length} email templates in ./email-previews/`);
console.log('\n📂 Open email-previews/index.html in your browser to preview all templates\n');
