import twilio from 'twilio';

const OTP_EXPIRY_MINUTES = 10;

function isSmsConfigured() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

  return Boolean(
    TWILIO_ACCOUNT_SID &&
      TWILIO_AUTH_TOKEN &&
      TWILIO_PHONE_NUMBER &&
      !TWILIO_ACCOUNT_SID.includes('your_twilio') &&
      !TWILIO_AUTH_TOKEN.includes('your_twilio')
  );
}

function getTwilioClient() {
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

export async function sendOtpSms({ recipientPhone, otpCode }) {
  if (!recipientPhone) {
    throw new Error('Phone number is required to send SMS OTP.');
  }

  const message = `Your Jatayu verification code is ${otpCode}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`;

  if (!isSmsConfigured()) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n======================================================`);
      console.log(`[SMS OTP Dev] To: ${recipientPhone}`);
      console.log(`Verification Code: ${otpCode}`);
      console.log(`======================================================\n`);
      return;
    }

    throw new Error(
      'Twilio SMS is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.'
    );
  }

  const client = getTwilioClient();

  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: recipientPhone,
  });
}
