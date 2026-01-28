import type { TabName } from '@/types/sharing';
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

export interface ShareInvitationEmailProps {
  ownerName: string;
  ownerEmail: string;
  inviteeName: string;
  tabs: { tabName: TabName; permissionLevel: 'view' | 'edit' }[];
  acceptUrl: string;
  expiresAt: Date;
}

// Tab display names mapping
const TAB_NAMES: Record<string, string> = {
  today: 'Today',
  progress: 'Progress',
  vision: 'Vision',
  goals: 'Goals',
  okrs: 'OKRs',
  milestones: 'Milestones',
  mins: 'MINs',
  time_audit: 'Time Audit',
  drip: 'Value Matrix',
  routines: 'Routines',
  pomodoro: 'Pomodoro',
  reviews: 'Reviews',
  leverage: 'Leverage',
  network: 'Network',
  analytics: 'Analytics',
  backtrack: 'Backtrack Plans',
};

export function generateShareInvitationEmail(props: ShareInvitationEmailProps): string {
  const { ownerName, ownerEmail, inviteeName, tabs, acceptUrl, expiresAt } = props;

  const displayName = ownerName || ownerEmail;
  const expiresFormatted = expiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const tabsList = tabs
    .map((t) => {
      const tabDisplayName = TAB_NAMES[t.tabName] || t.tabName;
      const permissionBadge = t.permissionLevel === 'edit' ? 'Can edit' : 'View only';
      const badgeBgColor = t.permissionLevel === 'edit' ? colors.successBg : colors.borderLight;
      const badgeTextColor = t.permissionLevel === 'edit' ? colors.successText : colors.textMuted;
      return `<li style="margin-bottom: 8px;">
        <strong style="color: ${colors.text};">${tabDisplayName}</strong>
        <span style="display: inline-block; margin-left: 8px; padding: 2px 8px; background-color: ${badgeBgColor}; color: ${badgeTextColor}; border-radius: 6px; font-size: 12px; font-weight: 500;">${permissionBadge}</span>
      </li>`;
    })
    .join('');

  const content = `
    ${emailHeading("You've been invited to collaborate!")}

    ${emailParagraph(`Hi${inviteeName ? ` ${inviteeName}` : ''},`)}

    ${emailParagraph(`<strong style="color: ${colors.text};">${displayName}</strong> has invited you to access their Goal Achiever Pro content. They've shared the following with you:`)}

    ${emailInfoBox(`
      <p style="margin: 0 0 12px 0; color: ${colors.successText}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
        Shared Tabs
      </p>
      <ul style="margin: 0; padding-left: 20px; color: ${colors.textMuted}; font-size: 14px; line-height: 1.8;">
        ${tabsList}
      </ul>
    `)}

    ${emailButton("Accept Invitation", acceptUrl)}

    <p style="margin: 0 0 8px 0; color: ${colors.textLight}; font-size: 14px; text-align: center;">
      This invitation expires on <strong style="color: ${colors.textMuted};">${expiresFormatted}</strong>
    </p>

    ${emailDivider()}

    ${emailMutedText("If you didn't expect this invitation, you can safely ignore this email. The invitation will expire automatically.")}
  `;

  return baseEmailTemplate({
    title: "You've been invited to collaborate - Goal Achiever Pro",
    preheader: `${displayName} has invited you to collaborate on Goal Achiever Pro`,
    children: content,
  });
}
