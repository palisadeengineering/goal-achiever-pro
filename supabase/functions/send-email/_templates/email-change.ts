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

export interface EmailChangeEmailProps {
  confirmUrl: string;
  userEmail: string;
  userName?: string;
}

/**
 * Email change confirmation email
 */
export function generateEmailChangeEmailHtml(props: EmailChangeEmailProps): string {
  const { confirmUrl, userEmail, userName } = props;

  const greeting = userName ? `Hi ${userName},` : 'Hi there,';

  const content = `
    ${emailHeading("Confirm Your Email Change")}

    ${emailParagraph(greeting)}

    ${emailParagraph(`We received a request to change the email address for your Goal Achiever Pro account to <strong style="color: ${colors.text};">${userEmail}</strong>.`)}

    ${emailParagraph("Click the button below to confirm this change:")}

    ${emailButton("Confirm Email Change", confirmUrl)}

    ${emailDivider()}

    ${emailWarningBox("<strong>Didn't request this?</strong> If you didn't request an email change, someone else may have access to your account. Please secure your account by changing your password immediately.")}

    ${emailMutedText("This confirmation link will expire in 24 hours. If you need to make this change later, please request a new confirmation email from your account settings.")}

    ${emailDivider()}

    ${emailFallbackUrl(confirmUrl)}
  `;

  return baseEmailTemplate({
    title: 'Confirm Your Email Change - Goal Achiever Pro',
    preheader: "Confirm your email address change",
    children: content,
  });
}
