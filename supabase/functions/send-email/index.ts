import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { Resend } from 'npm:resend@4.0.0';
import {
  generateWelcomeEmailHtml,
  generateMagicLinkEmailHtml,
  generateResetPasswordEmailHtml,
  generateEmailChangeEmailHtml,
} from './_templates/index.ts';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);
// Remove the v1,whsec_ prefix from the secret for standardwebhooks
const hookSecret = (Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string).replace('v1,whsec_', '');

interface AuthEmailPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  // Verify webhook signature
  const wh = new Webhook(hookSecret);

  let data: AuthEmailPayload;
  try {
    data = wh.verify(payload, headers) as AuthEmailPayload;
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return new Response(
      JSON.stringify({ error: { message: 'Invalid webhook signature' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const {
    user,
    email_data: {
      token,
      token_hash,
      redirect_to,
      email_action_type,
      site_url,
    },
  } = data;

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? site_url;
  const userName = user.user_metadata?.full_name || user.user_metadata?.name || '';

  // Build verification URL
  const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to)}`;

  let html: string;
  let subject: string;

  // Generate appropriate email based on action type
  switch (email_action_type) {
    case 'signup':
    case 'email_confirmation':
      html = generateWelcomeEmailHtml({
        userName,
        confirmUrl: verifyUrl,
      });
      subject = 'Welcome to Goal Achiever Pro - Confirm Your Email';
      break;

    case 'magiclink':
    case 'magic_link':
      html = generateMagicLinkEmailHtml({
        magicLinkUrl: verifyUrl,
        userEmail: user.email,
        expiresInMinutes: 60,
      });
      subject = 'Sign in to Goal Achiever Pro';
      break;

    case 'recovery':
    case 'password_recovery':
      html = generateResetPasswordEmailHtml({
        resetUrl: verifyUrl,
        userEmail: user.email,
        userName,
        expiresInHours: 24,
      });
      subject = 'Reset Your Password - Goal Achiever Pro';
      break;

    case 'email_change':
    case 'email_change_new':
      html = generateEmailChangeEmailHtml({
        confirmUrl: verifyUrl,
        userEmail: user.email,
        userName,
      });
      subject = 'Confirm Your Email Change - Goal Achiever Pro';
      break;

    case 'invite':
      html = generateWelcomeEmailHtml({
        userName,
        confirmUrl: verifyUrl,
      });
      subject = "You've Been Invited to Goal Achiever Pro";
      break;

    default:
      console.warn(`Unknown email action type: ${email_action_type}`);
      // Fallback to magic link style
      html = generateMagicLinkEmailHtml({
        magicLinkUrl: verifyUrl,
        userEmail: user.email,
        expiresInMinutes: 60,
      });
      subject = 'Action Required - Goal Achiever Pro';
  }

  try {
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'Goal Achiever Pro <noreply@goalachieverpro.com>';

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [user.email],
      subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return new Response(
        JSON.stringify({ error: { message: error.message } }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Email sent successfully: ${email_action_type} to ${user.email}`);
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    return new Response(
      JSON.stringify({ error: { message: error instanceof Error ? error.message : 'Unknown error' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
