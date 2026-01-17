import {
  baseEmailTemplate,
  emailButton,
  emailDangerBox,
  emailDivider,
  emailFallbackUrl,
  emailHeading,
  emailMutedText,
  emailParagraph,
  colors,
} from './base.ts';

export interface ResetPasswordEmailProps {
  resetUrl: string;
  userEmail: string;
  userName?: string;
  expiresInHours?: number;
}

/**
 * Reset password email
 */
export function generateResetPasswordEmailHtml(props: ResetPasswordEmailProps): string {
  const { resetUrl, userEmail, userName, expiresInHours = 24 } = props;

  const greeting = userName ? `Hi ${userName},` : 'Hi there,';

  const content = `
    ${emailHeading("Reset Your Password")}

    ${emailParagraph(greeting)}

    ${emailParagraph(`We received a request to reset the password for your Goal Achiever Pro account associated with <strong style="color: ${colors.text};">${userEmail}</strong>.`)}

    ${emailParagraph("Click the button below to create a new password:")}

    ${emailButton("Reset Password", resetUrl)}

    <p style="margin: 0 0 24px 0; color: ${colors.textLight}; font-size: 14px; text-align: center;">
      This link will expire in <strong style="color: ${colors.textMuted};">${expiresInHours} hours</strong>
    </p>

    ${emailDivider()}

    ${emailDangerBox("<strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged and your account is secure.")}

    ${emailMutedText("For security reasons, this link can only be used once. If you need to reset your password again, please request a new link from the login page.")}

    ${emailDivider()}

    ${emailFallbackUrl(resetUrl)}
  `;

  return baseEmailTemplate({
    title: 'Reset Your Password - Goal Achiever Pro',
    preheader: "Reset your Goal Achiever Pro password",
    children: content,
  });
}
