# Supabase Email Templates

Copy and paste these templates into your Supabase Dashboard under **Authentication > Email Templates**.

---

## 1. Confirm Signup (Email Confirmation)

**Subject:** `Welcome to Goal Achiever Pro - Confirm Your Email`

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Goal Achiever Pro</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafaf9; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fafaf9;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px;">
          <tr>
            <td>
              <!-- Header -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 16px 16px 0 0; border-bottom: 1px solid #f1f5f9;">
                <tr>
                  <td align="center" style="padding: 32px 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" valign="middle">
                          <div style="display: inline-block; vertical-align: middle; width: 44px; height: 44px; background: linear-gradient(135deg, #00BEFF 0%, #0891B2 100%); border-radius: 12px; margin-right: 12px;">
                            <table role="presentation" width="44" height="44" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td align="center" valign="middle" style="color: #ffffff; font-size: 22px; font-weight: bold;">&#10003;</td>
                              </tr>
                            </table>
                          </div>
                          <span style="display: inline-block; vertical-align: middle; color: #1e293b; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Goal Achiever Pro</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Main Content -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff;">
                <tr>
                  <td style="padding: 32px 40px;">
                    <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 22px; font-weight: 600;">Welcome to Goal Achiever Pro!</h2>

                    <p style="margin: 0 0 16px 0; color: #64748b; font-size: 16px; line-height: 1.6;">Hi there,</p>

                    <p style="margin: 0 0 16px 0; color: #64748b; font-size: 16px; line-height: 1.6;">Thank you for joining Goal Achiever Pro! We're excited to help you achieve your goals with clarity and focus using Dan Martell's proven "Buy Back Your Time" methodology.</p>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
                      <tr>
                        <td align="center">
                          <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background-color: #00BEFF; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 10px;">Confirm Your Email</a>
                        </td>
                      </tr>
                    </table>

                    <div style="background-color: #d1fae5; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #00BEFF;">
                      <p style="margin: 0 0 16px 0; color: #065f46; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Here's what you can do:</p>
                      <ul style="margin: 0; padding-left: 20px; color: #64748b; font-size: 14px; line-height: 1.8;">
                        <li><strong style="color: #1e293b;">Set Your Vision</strong> — Define your SMART goals with AI assistance</li>
                        <li><strong style="color: #1e293b;">Create Power Goals</strong> — Plan your 12 annual projects</li>
                        <li><strong style="color: #1e293b;">Track Your Time</strong> — Use 15-minute blocks with DRIP categorization</li>
                        <li><strong style="color: #1e293b;">Build Routines</strong> — Establish morning, midday, and evening habits</li>
                        <li><strong style="color: #1e293b;">Review Progress</strong> — Daily reviews to stay on track</li>
                      </ul>
                    </div>

                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">

                    <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.6;">If you didn't create an account with Goal Achiever Pro, you can safely ignore this email.</p>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 0 0 16px 16px; border-top: 1px solid #f1f5f9;">
                <tr>
                  <td align="center" style="padding: 24px;">
                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; line-height: 1.5;">Goal Achiever Pro — Achieve your goals with clarity and focus</p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">© 2025 Goal Achiever Pro. All rights reserved.</p>
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
</html>
```

---

## 2. Magic Link

**Subject:** `Sign in to Goal Achiever Pro`

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to Goal Achiever Pro</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafaf9; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fafaf9;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px;">
          <tr>
            <td>
              <!-- Header -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 16px 16px 0 0; border-bottom: 1px solid #f1f5f9;">
                <tr>
                  <td align="center" style="padding: 32px 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" valign="middle">
                          <div style="display: inline-block; vertical-align: middle; width: 44px; height: 44px; background: linear-gradient(135deg, #00BEFF 0%, #0891B2 100%); border-radius: 12px; margin-right: 12px;">
                            <table role="presentation" width="44" height="44" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td align="center" valign="middle" style="color: #ffffff; font-size: 22px; font-weight: bold;">&#10003;</td>
                              </tr>
                            </table>
                          </div>
                          <span style="display: inline-block; vertical-align: middle; color: #1e293b; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Goal Achiever Pro</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Main Content -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff;">
                <tr>
                  <td style="padding: 32px 40px;">
                    <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 22px; font-weight: 600;">Sign in to Goal Achiever Pro</h2>

                    <p style="margin: 0 0 16px 0; color: #64748b; font-size: 16px; line-height: 1.6;">Hi there,</p>

                    <p style="margin: 0 0 16px 0; color: #64748b; font-size: 16px; line-height: 1.6;">We received a request to sign in to your Goal Achiever Pro account associated with <strong style="color: #1e293b;">{{ .Email }}</strong>.</p>

                    <p style="margin: 0 0 16px 0; color: #64748b; font-size: 16px; line-height: 1.6;">Click the button below to sign in instantly — no password needed.</p>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
                      <tr>
                        <td align="center">
                          <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background-color: #00BEFF; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 10px;">Sign In to Goal Achiever Pro</a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0 0 24px 0; color: #94a3b8; font-size: 14px; text-align: center;">This link will expire in <strong style="color: #64748b;">60 minutes</strong></p>

                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">

                    <div style="background-color: #fef3c7; border-radius: 10px; padding: 16px; margin: 24px 0; border-left: 4px solid #f59e0b;">
                      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;"><strong>Security tip:</strong> If you didn't request this sign-in link, someone may have entered your email address by mistake. You can safely ignore this email — your account remains secure.</p>
                    </div>

                    <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.6;">For security reasons, this link can only be used once. If you need to sign in again, please request a new link from the login page.</p>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 0 0 16px 16px; border-top: 1px solid #f1f5f9;">
                <tr>
                  <td align="center" style="padding: 24px;">
                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; line-height: 1.5;">Goal Achiever Pro — Achieve your goals with clarity and focus</p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">© 2025 Goal Achiever Pro. All rights reserved.</p>
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
</html>
```

---

## 3. Reset Password

**Subject:** `Reset Your Password - Goal Achiever Pro`

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafaf9; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fafaf9;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px;">
          <tr>
            <td>
              <!-- Header -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 16px 16px 0 0; border-bottom: 1px solid #f1f5f9;">
                <tr>
                  <td align="center" style="padding: 32px 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" valign="middle">
                          <div style="display: inline-block; vertical-align: middle; width: 44px; height: 44px; background: linear-gradient(135deg, #00BEFF 0%, #0891B2 100%); border-radius: 12px; margin-right: 12px;">
                            <table role="presentation" width="44" height="44" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td align="center" valign="middle" style="color: #ffffff; font-size: 22px; font-weight: bold;">&#10003;</td>
                              </tr>
                            </table>
                          </div>
                          <span style="display: inline-block; vertical-align: middle; color: #1e293b; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Goal Achiever Pro</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Main Content -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff;">
                <tr>
                  <td style="padding: 32px 40px;">
                    <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 22px; font-weight: 600;">Reset Your Password</h2>

                    <p style="margin: 0 0 16px 0; color: #64748b; font-size: 16px; line-height: 1.6;">Hi there,</p>

                    <p style="margin: 0 0 16px 0; color: #64748b; font-size: 16px; line-height: 1.6;">We received a request to reset the password for your Goal Achiever Pro account associated with <strong style="color: #1e293b;">{{ .Email }}</strong>.</p>

                    <p style="margin: 0 0 16px 0; color: #64748b; font-size: 16px; line-height: 1.6;">Click the button below to create a new password:</p>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
                      <tr>
                        <td align="center">
                          <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background-color: #00BEFF; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 10px;">Reset Password</a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0 0 24px 0; color: #94a3b8; font-size: 14px; text-align: center;">This link will expire in <strong style="color: #64748b;">24 hours</strong></p>

                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">

                    <div style="background-color: #fee2e2; border-radius: 10px; padding: 16px; margin: 24px 0; border-left: 4px solid #ef4444;">
                      <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.5;"><strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged and your account is secure.</p>
                    </div>

                    <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.6;">For security reasons, this link can only be used once. If you need to reset your password again, please request a new link from the login page.</p>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 0 0 16px 16px; border-top: 1px solid #f1f5f9;">
                <tr>
                  <td align="center" style="padding: 24px;">
                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; line-height: 1.5;">Goal Achiever Pro — Achieve your goals with clarity and focus</p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">© 2025 Goal Achiever Pro. All rights reserved.</p>
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
</html>
```

---

## 4. Invite User

**Subject:** `You've Been Invited to Goal Achiever Pro`

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've Been Invited</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafaf9; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fafaf9;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px;">
          <tr>
            <td>
              <!-- Header -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 16px 16px 0 0; border-bottom: 1px solid #f1f5f9;">
                <tr>
                  <td align="center" style="padding: 32px 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" valign="middle">
                          <div style="display: inline-block; vertical-align: middle; width: 44px; height: 44px; background: linear-gradient(135deg, #00BEFF 0%, #0891B2 100%); border-radius: 12px; margin-right: 12px;">
                            <table role="presentation" width="44" height="44" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td align="center" valign="middle" style="color: #ffffff; font-size: 22px; font-weight: bold;">&#10003;</td>
                              </tr>
                            </table>
                          </div>
                          <span style="display: inline-block; vertical-align: middle; color: #1e293b; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Goal Achiever Pro</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Main Content -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff;">
                <tr>
                  <td style="padding: 32px 40px;">
                    <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 22px; font-weight: 600;">You've Been Invited!</h2>

                    <p style="margin: 0 0 16px 0; color: #64748b; font-size: 16px; line-height: 1.6;">Hi there,</p>

                    <p style="margin: 0 0 16px 0; color: #64748b; font-size: 16px; line-height: 1.6;">You've been invited to join Goal Achiever Pro — the ultimate goal-setting and time-optimization platform.</p>

                    <p style="margin: 0 0 16px 0; color: #64748b; font-size: 16px; line-height: 1.6;">Click the button below to accept the invitation and create your account:</p>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
                      <tr>
                        <td align="center">
                          <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background-color: #00BEFF; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 10px;">Accept Invitation</a>
                        </td>
                      </tr>
                    </table>

                    <div style="background-color: #d1fae5; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #00BEFF;">
                      <p style="margin: 0 0 16px 0; color: #065f46; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">What you'll get:</p>
                      <ul style="margin: 0; padding-left: 20px; color: #64748b; font-size: 14px; line-height: 1.8;">
                        <li><strong style="color: #1e293b;">Vision & SMART Goals</strong> — AI-assisted goal setting</li>
                        <li><strong style="color: #1e293b;">Power Goals</strong> — 12 annual projects framework</li>
                        <li><strong style="color: #1e293b;">Time Tracking</strong> — DRIP matrix analysis</li>
                        <li><strong style="color: #1e293b;">Daily Reviews</strong> — Stay accountable and focused</li>
                      </ul>
                    </div>

                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">

                    <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.6;">If you didn't expect this invitation, you can safely ignore this email.</p>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 0 0 16px 16px; border-top: 1px solid #f1f5f9;">
                <tr>
                  <td align="center" style="padding: 24px;">
                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; line-height: 1.5;">Goal Achiever Pro — Achieve your goals with clarity and focus</p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">© 2025 Goal Achiever Pro. All rights reserved.</p>
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
</html>
```

---

## 5. Change Email Address

**Subject:** `Confirm Your Email Change - Goal Achiever Pro`

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Email Change</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafaf9; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fafaf9;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px;">
          <tr>
            <td>
              <!-- Header -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 16px 16px 0 0; border-bottom: 1px solid #f1f5f9;">
                <tr>
                  <td align="center" style="padding: 32px 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" valign="middle">
                          <div style="display: inline-block; vertical-align: middle; width: 44px; height: 44px; background: linear-gradient(135deg, #00BEFF 0%, #0891B2 100%); border-radius: 12px; margin-right: 12px;">
                            <table role="presentation" width="44" height="44" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td align="center" valign="middle" style="color: #ffffff; font-size: 22px; font-weight: bold;">&#10003;</td>
                              </tr>
                            </table>
                          </div>
                          <span style="display: inline-block; vertical-align: middle; color: #1e293b; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Goal Achiever Pro</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Main Content -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff;">
                <tr>
                  <td style="padding: 32px 40px;">
                    <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 22px; font-weight: 600;">Confirm Your Email Change</h2>

                    <p style="margin: 0 0 16px 0; color: #64748b; font-size: 16px; line-height: 1.6;">Hi there,</p>

                    <p style="margin: 0 0 16px 0; color: #64748b; font-size: 16px; line-height: 1.6;">We received a request to change the email address for your Goal Achiever Pro account to <strong style="color: #1e293b;">{{ .Email }}</strong>.</p>

                    <p style="margin: 0 0 16px 0; color: #64748b; font-size: 16px; line-height: 1.6;">Click the button below to confirm this change:</p>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
                      <tr>
                        <td align="center">
                          <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background-color: #00BEFF; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 10px;">Confirm Email Change</a>
                        </td>
                      </tr>
                    </table>

                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">

                    <div style="background-color: #fef3c7; border-radius: 10px; padding: 16px; margin: 24px 0; border-left: 4px solid #f59e0b;">
                      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;"><strong>Didn't request this?</strong> If you didn't request an email change, someone else may have access to your account. Please secure your account by changing your password immediately.</p>
                    </div>

                    <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.6;">This confirmation link will expire in 24 hours. If you need to make this change later, please request a new confirmation email from your account settings.</p>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 0 0 16px 16px; border-top: 1px solid #f1f5f9;">
                <tr>
                  <td align="center" style="padding: 24px;">
                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; line-height: 1.5;">Goal Achiever Pro — Achieve your goals with clarity and focus</p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">© 2025 Goal Achiever Pro. All rights reserved.</p>
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
</html>
```

---

## Setup Instructions

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. For each template type (Confirm signup, Magic Link, Reset Password, Invite user, Change Email Address):
   - Update the **Subject** line
   - Paste the corresponding **HTML** into the body
3. Click **Save** for each template

### Optional: Configure Resend as SMTP

For better deliverability, configure Resend as your SMTP provider:

1. Go to **Project Settings** → **Authentication** → **SMTP Settings**
2. Enable **Custom SMTP**
3. Configure:
   - **Host:** `smtp.resend.com`
   - **Port:** `465`
   - **Username:** `resend`
   - **Password:** Your Resend API key
   - **Sender email:** `noreply@goalachieverpro.com` (must be verified in Resend)
   - **Sender name:** `Goal Achiever Pro`
