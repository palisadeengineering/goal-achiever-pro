/**
 * Base email template with consistent styling for Supabase Edge Functions
 * Matches the Goal Achiever Pro light design with emerald green accents
 */

// Brand colors (converted from OKLCH to hex for email compatibility)
export const colors = {
  // Primary emerald green
  primary: '#00BEFF',
  primaryDark: '#0891B2',
  primaryLight: '#d1fae5',

  // Backgrounds
  background: '#fafaf9', // Warm off-white
  cardBackground: '#ffffff',

  // Text
  text: '#1e293b', // Dark blue-black
  textMuted: '#64748b',
  textLight: '#94a3b8',

  // Borders
  border: '#e2e8f0',
  borderLight: '#f1f5f9',

  // Status colors
  warning: '#f59e0b',
  warningBg: '#fef3c7',
  warningText: '#92400e',
  danger: '#ef4444',
  dangerBg: '#fee2e2',
  dangerText: '#991b1b',
  success: '#00BEFF',
  successBg: '#d1fae5',
  successText: '#065f46',
};

export interface BaseEmailProps {
  title: string;
  preheader?: string;
  children: string;
}

/**
 * Generates the base HTML email structure with consistent styling
 */
export function baseEmailTemplate({ title, preheader, children }: BaseEmailProps): string {
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  ${preheader ? `<!--[if !mso]><!--><style>span.preheader { display: none !important; }</style><!--<![endif]-->` : ''}
  <style type="text/css">
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      outline: none;
      text-decoration: none;
    }
    @media only screen and (max-width: 620px) {
      .wrapper {
        padding: 20px 12px !important;
      }
      .content-padding {
        padding: 24px 20px !important;
      }
      .logo-text {
        font-size: 20px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${colors.background}; -webkit-font-smoothing: antialiased;">
  ${preheader ? `<span class="preheader" style="display: none !important; visibility: hidden; mso-hide: all; font-size: 1px; color: ${colors.background}; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">${preheader}</span>` : ''}

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${colors.background};">
    <tr>
      <td align="center" class="wrapper" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px;">
          <tr>
            <td>
              <!-- Header -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${colors.cardBackground}; border-radius: 16px 16px 0 0; border-bottom: 1px solid ${colors.borderLight};">
                <tr>
                  <td align="center" style="padding: 32px 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" valign="middle">
                          <!-- Logo Icon -->
                          <div style="display: inline-block; vertical-align: middle; width: 44px; height: 44px; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%); border-radius: 12px; margin-right: 12px;">
                            <table role="presentation" width="44" height="44" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td align="center" valign="middle" style="color: #ffffff; font-size: 22px; font-weight: bold;">&#10003;</td>
                              </tr>
                            </table>
                          </div>
                          <!-- Logo Text -->
                          <span class="logo-text" style="display: inline-block; vertical-align: middle; color: ${colors.text}; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Goal Achiever Pro</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Main Content -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${colors.cardBackground};">
                <tr>
                  <td class="content-padding" style="padding: 32px 40px;">
                    ${children}
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${colors.cardBackground}; border-radius: 0 0 16px 16px; border-top: 1px solid ${colors.borderLight};">
                <tr>
                  <td align="center" style="padding: 24px;">
                    <p style="margin: 0 0 8px 0; color: ${colors.textMuted}; font-size: 13px; line-height: 1.5;">
                      Goal Achiever Pro — Achieve your goals with clarity and focus
                    </p>
                    <p style="margin: 0; color: ${colors.textLight}; font-size: 12px;">
                      &copy; ${year} Goal Achiever Pro. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailButton(text: string, url: string, variant: 'primary' | 'secondary' = 'primary'): string {
  const bgColor = variant === 'primary' ? colors.primary : colors.cardBackground;
  const textColor = variant === 'primary' ? '#ffffff' : colors.primary;
  const border = variant === 'secondary' ? `border: 2px solid ${colors.primary};` : '';

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
      <tr>
        <td align="center">
          <a href="${url}" style="display: inline-block; padding: 14px 32px; background-color: ${bgColor}; color: ${textColor}; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 10px; ${border}">${text}</a>
        </td>
      </tr>
    </table>`;
}

export function emailInfoBox(content: string): string {
  return `<div style="background-color: ${colors.primaryLight}; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid ${colors.primary};">${content}</div>`;
}

export function emailDivider(): string {
  return `<hr style="border: none; border-top: 1px solid ${colors.border}; margin: 24px 0;">`;
}

export function emailMutedText(text: string): string {
  return `<p style="margin: 0; color: ${colors.textLight}; font-size: 13px; line-height: 1.6;">${text}</p>`;
}

export function emailParagraph(text: string): string {
  return `<p style="margin: 0 0 16px 0; color: ${colors.textMuted}; font-size: 16px; line-height: 1.6;">${text}</p>`;
}

export function emailHeading(text: string, level: 2 | 3 = 2): string {
  const sizes = { 2: '22px', 3: '18px' };
  return `<h${level} style="margin: 0 0 16px 0; color: ${colors.text}; font-size: ${sizes[level]}; font-weight: 600;">${text}</h${level}>`;
}

export function emailWarningBox(content: string): string {
  return `<div style="background-color: ${colors.warningBg}; border-radius: 10px; padding: 16px; margin: 24px 0; border-left: 4px solid ${colors.warning};">
    <p style="margin: 0; color: ${colors.warningText}; font-size: 14px; line-height: 1.5;">${content}</p>
  </div>`;
}

export function emailDangerBox(content: string): string {
  return `<div style="background-color: ${colors.dangerBg}; border-radius: 10px; padding: 16px; margin: 24px 0; border-left: 4px solid ${colors.danger};">
    <p style="margin: 0; color: ${colors.dangerText}; font-size: 14px; line-height: 1.5;">${content}</p>
  </div>`;
}

export function emailFallbackUrl(url: string): string {
  return `<p style="margin: 0; color: ${colors.textLight}; font-size: 12px; line-height: 1.5;">
    <strong style="color: ${colors.textMuted};">Button not working?</strong> Copy and paste this URL into your browser:<br>
    <span style="color: ${colors.textMuted}; word-break: break-all;">${url}</span>
  </p>`;
}
