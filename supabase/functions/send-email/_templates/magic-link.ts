import {
  baseEmailTemplate,
  emailButton,
  emailDivider,
  emailFallbackUrl,
  emailHeading,
  emailMutedText,
  emailParagraph,
  emailWarningBox,
  colors,
} from './base.ts';

export interface MagicLinkEmailProps {
  magicLinkUrl: string;
  userEmail: string;
  expiresInMinutes?: number;
}

/**
 * Magic link email for passwordless authentication
 */
export function generateMagicLinkEmailHtml(props: MagicLinkEmailProps): string {
  const { magicLinkUrl, userEmail, expiresInMinutes = 60 } = props;

  const content = `
    ${emailHeading("Sign in to Goal Achiever Pro")}

    ${emailParagraph("Hi there,")}

    ${emailParagraph(`We received a request to sign in to your Goal Achiever Pro account associated with <strong style="color: ${colors.text};">${userEmail}</strong>.`)}

    ${emailParagraph("Click the button below to sign in instantly — no password needed.")}

    ${emailButton("Sign In to Goal Achiever Pro", magicLinkUrl)}

    <p style="margin: 0 0 24px 0; color: ${colors.textLight}; font-size: 14px; text-align: center;">
      This link will expire in <strong style="color: ${colors.textMuted};">${expiresInMinutes} minutes</strong>
    </p>

    ${emailDivider()}

    ${emailWarningBox("<strong>Security tip:</strong> If you didn't request this sign-in link, someone may have entered your email address by mistake. You can safely ignore this email — your account remains secure.")}

    ${emailMutedText("For security reasons, this link can only be used once. If you need to sign in again, please request a new link from the login page.")}

    ${emailDivider()}

    ${emailFallbackUrl(magicLinkUrl)}
  `;

  return baseEmailTemplate({
    title: 'Sign in to Goal Achiever Pro',
    preheader: "Your magic link to sign in",
    children: content,
  });
}
