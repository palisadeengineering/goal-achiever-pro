// Email templates for Supabase Auth Email Hook
// These templates match the styling of the Next.js email templates

export { generateWelcomeEmailHtml, type WelcomeEmailProps } from './welcome.ts';
export { generateMagicLinkEmailHtml, type MagicLinkEmailProps } from './magic-link.ts';
export { generateResetPasswordEmailHtml, type ResetPasswordEmailProps } from './reset-password.ts';
export { generateEmailChangeEmailHtml, type EmailChangeEmailProps } from './email-change.ts';

// Base template utilities (for custom emails if needed)
export {
  baseEmailTemplate,
  emailButton,
  emailInfoBox,
  emailDivider,
  emailMutedText,
  emailParagraph,
  emailHeading,
  emailWarningBox,
  emailDangerBox,
  emailFallbackUrl,
  colors,
} from './base.ts';
