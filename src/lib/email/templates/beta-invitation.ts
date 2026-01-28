/**
 * Beta invitation email template
 */

import {
  baseEmailTemplate,
  emailButton,
  emailParagraph,
  emailHeading,
  emailDivider,
  emailMutedText,
  emailFallbackUrl,
} from './base';

export interface BetaInvitationEmailProps {
  inviteUrl: string;
  inviteeEmail: string;
}

export function generateBetaInvitationEmailHtml({
  inviteUrl,
  inviteeEmail,
}: BetaInvitationEmailProps): string {
  const content = `
    ${emailHeading("You're Invited!")}

    ${emailParagraph(`You've been invited to join <strong>Goal Achiever Pro</strong> beta — a comprehensive goal-setting app for entrepreneurs to optimize their time and achieve their vision.`)}

    ${emailParagraph(`As a beta user, you'll get full access to all features including:`)}

    <ul style="margin: 0 0 16px 0; padding-left: 20px; color: #64748b; font-size: 16px; line-height: 1.8;">
      <li>Vision & SMART goal creation with AI assistance</li>
      <li>12 Impact Projects annual planning system</li>
      <li>Time audit with Value Matrix analysis</li>
      <li>KPI tracking and accountability features</li>
      <li>And much more...</li>
    </ul>

    ${emailButton('Accept Invitation', inviteUrl)}

    ${emailDivider()}

    ${emailMutedText(`This invitation was sent to <strong>${inviteeEmail}</strong>.`)}

    ${emailMutedText(`If you have any questions, simply reply to this email.`)}

    ${emailFallbackUrl(inviteUrl)}
  `;

  return baseEmailTemplate({
    title: "You're Invited to Goal Achiever Pro",
    preheader: "Join the Goal Achiever Pro beta and start achieving your goals with clarity and focus.",
    children: content,
  });
}
