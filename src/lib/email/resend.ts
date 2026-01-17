import { Resend } from 'resend';

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY;

let resend: Resend | null = null;

export function getResendClient(): Resend | null {
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY is not set. Email sending is disabled.');
    return null;
  }

  if (!resend) {
    resend = new Resend(resendApiKey);
  }

  return resend;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const client = getResendClient();

  if (!client) {
    console.log('Email not sent (Resend not configured):', options.subject);
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { error } = await client.emails.send({
      from: options.from || 'Goal Achiever Pro <noreply@goalachieverpro.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error('Failed to send email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Error sending email:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
