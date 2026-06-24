import nodemailer from 'nodemailer';

const OTP_EXPIRY_MINUTES = 10;

let transporter;

function hasPlaceholderCredential(value) {
  if (!value) return true;
  const normalized = value.toLowerCase();
  return (
    normalized.includes('your_email') ||
    normalized.includes('your_twilio') ||
    normalized.includes('app_password') ||
    normalized.includes('change_me')
  );
}

function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.FROM_EMAIL &&
      !hasPlaceholderCredential(process.env.SMTP_USER) &&
      !hasPlaceholderCredential(process.env.SMTP_PASS)
  );
}

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

export async function sendOtpEmail({ recipientEmail, recipientName, otpCode }) {
  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n======================================================`);
      console.log(`[Email OTP Dev] To: ${recipientEmail}`);
      console.log(`Verification Code: ${otpCode}`);
      console.log(`======================================================\n`);
      return;
    }

    throw new Error(
      'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and FROM_EMAIL.'
    );
  }

  const client = getTransporter();

  await client.sendMail({
    from: process.env.FROM_EMAIL,
    to: recipientEmail,
    subject: 'Your Jatayu verification code',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2 style="margin-bottom: 12px;">Verify your email</h2>
        <p>Hello ${recipientName || 'there'},</p>
        <p>Your one-time verification code is:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 14px 0;">${otpCode}</p>
        <p>This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
    text: `Your Jatayu verification code is ${otpCode}. This code expires in ${OTP_EXPIRY_MINUTES} minutes.`,
  });
}
