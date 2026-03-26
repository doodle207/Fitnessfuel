import { Resend } from "resend";
import crypto from "crypto";

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export function generateOTP(): string {
  return String(crypto.randomInt(100000, 1000000));
}

export async function sendVerificationEmail(email: string, otp: string): Promise<void> {
  const resend = getResendClient();

  const year = new Date().getFullYear();

  const { error } = await resend.emails.send({
    from: "Caloforge <noreply@caloforge.com>",
    to: email,
    subject: "Your Verification Code",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="margin:0;padding:0;background-color:#080810;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#080810;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#0f0f1a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
                  <tr>
                    <td style="padding:32px 32px 24px;text-align:center;background:linear-gradient(135deg,rgba(124,58,237,0.15),rgba(6,182,212,0.08));">
                      <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                        Calo<span style="color:#7c3aed;">Forge</span><span style="color:#06b6d4;">X</span>
                      </h1>
                      <p style="margin:8px 0 0;color:rgba(255,255,255,0.45);font-size:14px;">Your elite fitness &amp; nutrition companion</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px;">
                      <p style="margin:0 0 8px;color:rgba(255,255,255,0.7);font-size:15px;">Your verification code is:</p>
                      <div style="background:rgba(124,58,237,0.12);border:1px solid rgba(124,58,237,0.3);border-radius:12px;padding:20px;text-align:center;margin:16px 0;">
                        <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#ffffff;font-family:'Courier New',monospace;">${otp}</span>
                      </div>
                      <p style="margin:16px 0 0;color:rgba(255,255,255,0.4);font-size:13px;text-align:center;">
                        This code expires in <strong style="color:rgba(255,255,255,0.6);">5 minutes</strong>.<br/>
                        If you didn't request this, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 32px 32px;text-align:center;">
                      <p style="margin:0;color:rgba(255,255,255,0.2);font-size:12px;">
                        &copy; ${year} CaloForgeX. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error("[email] Resend error:", JSON.stringify(error, null, 2));
    console.error("[email] Error details - message:", error.message, "name:", error.name);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}
