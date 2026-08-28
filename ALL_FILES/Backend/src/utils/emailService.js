import nodemailer from "nodemailer";
import fetch from "node-fetch";

/**
 * Universal email dispatcher
 * Supports Brevo HTTP REST API (port 443 HTTPS - immune to Render SMTP block),
 * Resend HTTP API, and fallback SMTP.
 */
export const dispatchEmail = async ({ to, subject, html }) => {
  const service = (process.env.EMAIL_SERVICE || "").toLowerCase();
  const brevoKey = process.env.BREVO_API_KEY || (service === "brevo" ? process.env.EMAIL_PASSWORD : null);
  const fromEmail = process.env.EMAIL_FROM || "ramitgoyal1987@gmail.com";

  // 1. PRIORITY: Brevo HTTP REST API (Over HTTPS Port 443 - Bypasses Render's outbound SMTP block)
  if (brevoKey && (service === "brevo" || brevoKey.startsWith("xkeysib-") || process.env.BREVO_API_KEY)) {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoKey.trim(),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: "RemedyEase",
            email: fromEmail,
          },
          to: [
            {
              email: to,
            },
          ],
          subject: subject,
          htmlContent: html,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("[EmailService] Brevo API Error:", data);
        throw new Error(data.message || JSON.stringify(data));
      }
      return data;
    } catch (err) {
      console.error("[EmailService] Brevo API dispatch error:", err.message);
      throw err;
    }
  }

  // 2. Resend HTTP API (Over HTTPS Port 443)
  if (process.env.RESEND_API_KEY) {
    const fromAddress = process.env.RESEND_FROM || "RemedyEase <onboarding@resend.dev>";
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          subject: subject,
          html: html,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("[EmailService] Resend API Error:", data);
        throw new Error(data.message || "Failed to send email via Resend");
      }
      return data;
    } catch (err) {
      console.error("[EmailService] Resend dispatch error:", err.message);
      throw err;
    }
  }

  // 3. Fallback Nodemailer SMTP
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.replace(/\s+/g, "") : "";

  if (!user || !pass) {
    throw new Error("Email configuration missing: Set BREVO_API_KEY, RESEND_API_KEY, or EMAIL_USER & EMAIL_PASSWORD.");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    family: 4,
    connectionTimeout: 8000,
    socketTimeout: 10000,
  });

  return await transporter.sendMail({
    from: `"RemedyEase" <${fromEmail}>`,
    to,
    subject,
    html,
  });
};

/**
 * Sends a branded 6-digit OTP verification email for account signup
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP string
 * @param {string} name - Optional recipient's name
 */
export const sendSignupOtpEmail = async (email, otp, name = "") => {
  const displayName = name ? ` ${name}` : "";
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your RemedyEase Account</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f8; padding: 36px 16px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #15803d 0%, #16a34a 100%); padding: 28px 32px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">RemedyEase</h1>
                  <p style="margin: 4px 0 0; color: #dcfce7; font-size: 12px; letter-spacing: 0.8px; text-transform: uppercase; font-weight: 600;">Healthcare Made Simpler</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 32px 32px 24px;">
                  <h2 style="margin: 0 0 12px; color: #0f172a; font-size: 20px; font-weight: 700;">Account Verification</h2>
                  <p style="margin: 0 0 20px; font-size: 15px; color: #475569; line-height: 1.6;">
                    Hello${displayName}, thank you for registering with RemedyEase. Please enter the verification code below to verify your email and complete your account setup:
                  </p>

                  <!-- OTP Box -->
                  <div style="text-align: center; margin: 28px 0;">
                    <div style="display: inline-block; background-color: #f0fdf4; border: 2px dashed #86efac; border-radius: 12px; padding: 14px 28px;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #15803d; display: inline-block; margin-left: 10px;">
                        ${otp}
                      </span>
                    </div>
                  </div>

                  <!-- Security Alert -->
                  <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 12px 16px; margin: 24px 0;">
                    <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                      ⏱️ <strong>This code is valid for 5 minutes.</strong> For your security, never share this One-Time Password with anyone.
                    </p>
                  </div>

                  <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                    If you did not request to create an account on RemedyEase, you can safely ignore this message.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                    © ${new Date().getFullYear()} RemedyEase Healthcare Platform. All rights reserved.
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

  return await dispatchEmail({
    to: email,
    subject: `🔐 Verify your RemedyEase account: ${otp}`,
    html,
  });
};

/**
 * Sends a branded 6-digit OTP verification email for account login
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP string
 */
export const sendLoginOtpEmail = async (email, otp) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your RemedyEase Login Code</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f8; padding: 36px 16px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
              <tr>
                <td style="background: linear-gradient(135deg, #15803d 0%, #16a34a 100%); padding: 28px 32px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">RemedyEase</h1>
                  <p style="margin: 4px 0 0; color: #dcfce7; font-size: 12px; letter-spacing: 0.8px; text-transform: uppercase; font-weight: 600;">Secure Login</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px 32px 24px;">
                  <h2 style="margin: 0 0 12px; color: #0f172a; font-size: 20px; font-weight: 700;">One-Time Login Code</h2>
                  <p style="margin: 0 0 20px; font-size: 15px; color: #475569; line-height: 1.6;">
                    Use the following One-Time Password to sign in to your RemedyEase account:
                  </p>

                  <div style="text-align: center; margin: 28px 0;">
                    <div style="display: inline-block; background-color: #f0fdf4; border: 2px dashed #86efac; border-radius: 12px; padding: 14px 28px;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #15803d; display: inline-block; margin-left: 10px;">
                        ${otp}
                      </span>
                    </div>
                  </div>

                  <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 12px 16px; margin: 24px 0;">
                    <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                      ⏱️ <strong>This code expires in 5 minutes.</strong> Do not share this code with anyone.
                    </p>
                  </div>

                  <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                    If you did not attempt to log in, please secure your account immediately or contact support.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                    © ${new Date().getFullYear()} RemedyEase Healthcare Platform. All rights reserved.
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

  return await dispatchEmail({
    to: email,
    subject: `🔐 Your RemedyEase Login Code: ${otp}`,
    html,
  });
};
