import {
  baseEmailTemplate,
  emailButton,
  emailDivider,
  emailHeading,
  emailInfoBox,
  emailMutedText,
  emailParagraph,
  colors,
} from './base';

export interface WelcomeEmailProps {
  userName?: string;
  confirmUrl?: string;
  loginUrl?: string;
}

/**
 * Welcome email sent to new users after signup
 */
export function generateWelcomeEmail(props: WelcomeEmailProps): string {
  const { userName, confirmUrl, loginUrl } = props;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const dashboardUrl = loginUrl || `${appUrl}/dashboard`;

  const greeting = userName ? `Hi ${userName},` : 'Hi there,';

  const content = `
    ${emailHeading("Welcome to Goal Achiever Pro!")}

    ${emailParagraph(greeting)}

    ${emailParagraph("Thank you for joining Goal Achiever Pro! We're excited to help you achieve your goals with clarity and focus using our proven productivity methodology.")}

    ${confirmUrl ? emailButton("Confirm Your Email", confirmUrl) : ''}

    ${emailInfoBox(`
      <p style="margin: 0 0 16px 0; color: ${colors.successText}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
        Here's what you can do:
      </p>
      <ul style="margin: 0; padding-left: 20px; color: ${colors.textMuted}; font-size: 14px; line-height: 1.8;">
        <li><strong style="color: ${colors.text};">Set Your Vision</strong> — Define your SMART goals with AI assistance</li>
        <li><strong style="color: ${colors.text};">Create Impact Projects</strong> — Plan your 12 annual projects</li>
        <li><strong style="color: ${colors.text};">Track Your Time</strong> — Use 15-minute blocks with Value categorization</li>
        <li><strong style="color: ${colors.text};">Build Routines</strong> — Establish morning, midday, and evening habits</li>
        <li><strong style="color: ${colors.text};">Review Progress</strong> — Daily reviews to stay on track</li>
      </ul>
    `)}

    ${!confirmUrl ? emailButton("Go to Dashboard", dashboardUrl) : ''}

    ${emailDivider()}

    ${emailParagraph("Need help getting started? Check out our quick start guide or reach out to support anytime.")}

    ${emailMutedText("If you didn't create an account with Goal Achiever Pro, you can safely ignore this email.")}
  `;

  return baseEmailTemplate({
    title: 'Welcome to Goal Achiever Pro',
    preheader: "Start achieving your goals with clarity and focus",
    children: content,
  });
}
