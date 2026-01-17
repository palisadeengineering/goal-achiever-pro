export { getResendClient, sendEmail, type SendEmailOptions } from './resend';

// Email templates
export { generateShareInvitationEmail } from './templates/share-invitation';
export { generateWelcomeEmail, type WelcomeEmailProps } from './templates/welcome';
export { generateMagicLinkEmail, type MagicLinkEmailProps } from './templates/magic-link';
export { generateResetPasswordEmail, type ResetPasswordEmailProps } from './templates/reset-password';

// Base template utilities (for custom emails)
export {
  baseEmailTemplate,
  emailButton,
  emailInfoBox,
  emailDivider,
  emailMutedText,
  emailParagraph,
  emailHeading,
  emailCodeBox,
  emailWarningBox,
  emailDangerBox,
  emailFallbackUrl,
  colors,
} from './templates/base';
