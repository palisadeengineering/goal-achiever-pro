import type { TabName, TAB_DISPLAY_INFO } from '@/types/sharing';

interface ShareInvitationEmailProps {
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
  drip: 'DRIP Matrix',
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
      return `<li style="margin-bottom: 8px;">
        <strong>${tabDisplayName}</strong>
        <span style="display: inline-block; margin-left: 8px; padding: 2px 8px; background-color: ${t.permissionLevel === 'edit' ? '#dcfce7' : '#e0e7ff'}; color: ${t.permissionLevel === 'edit' ? '#166534' : '#3730a3'}; border-radius: 4px; font-size: 12px;">${permissionBadge}</span>
      </li>`;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited to collaborate</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #18181b; border-radius: 12px 12px 0 0; padding: 32px;">
          <tr>
            <td align="center">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Goal Achiever Pro</h1>
            </td>
          </tr>
        </table>

        <!-- Main Content -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; padding: 32px;">
          <tr>
            <td>
              <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 20px; font-weight: 600;">
                You've been invited to collaborate!
              </h2>

              <p style="margin: 0 0 24px 0; color: #52525b; font-size: 16px; line-height: 1.6;">
                Hi${inviteeName ? ` ${inviteeName}` : ''},
              </p>

              <p style="margin: 0 0 24px 0; color: #52525b; font-size: 16px; line-height: 1.6;">
                <strong style="color: #18181b;">${displayName}</strong> has invited you to access their Goal Achiever Pro content. They've shared the following with you:
              </p>

              <!-- Shared Tabs List -->
              <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px 0; color: #18181b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  Shared Tabs
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #52525b; font-size: 14px; line-height: 1.8;">
                  ${tabsList}
                </ul>
              </div>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${acceptUrl}" style="display: inline-block; padding: 14px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px 0; color: #a1a1aa; font-size: 14px; text-align: center;">
                This invitation expires on <strong>${expiresFormatted}</strong>
              </p>

              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">

              <p style="margin: 0; color: #a1a1aa; font-size: 13px; line-height: 1.6;">
                If you didn't expect this invitation, you can safely ignore this email. The invitation will expire automatically.
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; border-radius: 0 0 12px 12px; padding: 24px;">
          <tr>
            <td align="center">
              <p style="margin: 0; color: #71717a; font-size: 13px;">
                Goal Achiever Pro - Achieve your goals with clarity and focus
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}
