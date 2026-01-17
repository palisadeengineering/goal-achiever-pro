# Email Templates Reference

This project uses a reusable email template system located in `src/lib/email/templates/`.

## Available Templates

### 1. Base Template (`base.ts`)
The foundation for all email templates with consistent styling.

**Exports:**
- `baseEmailTemplate({ title, preheader?, children })` - Main wrapper
- `emailButton(text, url, variant?)` - CTA buttons (primary/secondary)
- `emailInfoBox(content)` - Green info box with left border
- `emailWarningBox(content)` - Amber warning box
- `emailDangerBox(content)` - Red danger box
- `emailCodeBox(code)` - Monospace code display
- `emailDivider()` - Horizontal line separator
- `emailParagraph(text)` - Standard paragraph
- `emailHeading(text, level?)` - H2 or H3 heading
- `emailMutedText(text)` - Small muted disclaimer text
- `emailFallbackUrl(url)` - "Button not working?" fallback
- `colors` - Brand color palette

**Brand Colors:**
```typescript
colors = {
  primary: '#10b981',      // Emerald green
  primaryDark: '#059669',
  primaryLight: '#d1fae5',
  background: '#fafaf9',   // Warm off-white
  cardBackground: '#ffffff',
  text: '#1e293b',         // Dark blue-black
  textMuted: '#64748b',
  textLight: '#94a3b8',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  warning: '#f59e0b',
  warningBg: '#fef3c7',
  warningText: '#92400e',
  danger: '#ef4444',
  dangerBg: '#fee2e2',
  dangerText: '#991b1b',
  success: '#10b981',
  successBg: '#d1fae5',
  successText: '#065f46',
}
```

### 2. Welcome Email (`welcome.ts`)
Sent to new users after signup.

```typescript
import { generateWelcomeEmail } from '@/lib/email';

const html = generateWelcomeEmail({
  userName?: string,      // Optional user's name
  confirmUrl?: string,    // Email confirmation link (if needed)
  loginUrl?: string,      // Dashboard URL
});
```

### 3. Magic Link Email (`magic-link.ts`)
For passwordless authentication.

```typescript
import { generateMagicLinkEmail } from '@/lib/email';

const html = generateMagicLinkEmail({
  magicLinkUrl: string,       // The magic sign-in link
  userEmail: string,          // User's email address
  expiresInMinutes?: number,  // Default: 60
});
```

### 4. Reset Password Email (`reset-password.ts`)
For password reset requests.

```typescript
import { generateResetPasswordEmail } from '@/lib/email';

const html = generateResetPasswordEmail({
  resetUrl: string,           // Password reset link
  userEmail: string,          // User's email address
  userName?: string,          // Optional user's name
  expiresInHours?: number,    // Default: 24
});
```

### 5. Share Invitation Email (`share-invitation.ts`)
For team sharing invitations.

```typescript
import { generateShareInvitationEmail } from '@/lib/email';

const html = generateShareInvitationEmail({
  ownerName: string,
  ownerEmail: string,
  inviteeName: string,
  tabs: { tabName: TabName; permissionLevel: 'view' | 'edit' }[],
  acceptUrl: string,
  expiresAt: Date,
});
```

## Creating New Templates

1. Import helpers from `./base`:
```typescript
import {
  baseEmailTemplate,
  emailButton,
  emailHeading,
  emailParagraph,
  emailDivider,
  emailMutedText,
  colors,
} from './base';
```

2. Build content using helper functions:
```typescript
const content = `
  ${emailHeading("Your Heading")}
  ${emailParagraph("Your message here.")}
  ${emailButton("Click Me", "https://example.com")}
  ${emailDivider()}
  ${emailMutedText("Footer disclaimer text")}
`;
```

3. Wrap with base template:
```typescript
return baseEmailTemplate({
  title: 'Email Subject Line',
  preheader: 'Preview text shown in email clients',
  children: content,
});
```

4. Export from `src/lib/email/index.ts`:
```typescript
export { generateYourEmail, type YourEmailProps } from './templates/your-template';
```

## Sending Emails

Use with Resend:
```typescript
import { sendEmail, generateWelcomeEmail } from '@/lib/email';

await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to Goal Achiever Pro',
  html: generateWelcomeEmail({ userName: 'John' }),
});
```
