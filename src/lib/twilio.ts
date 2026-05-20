import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER!;

// Twilio REST client for server-side operations
export const twilioClient = twilio(accountSid, authToken);

// Export phone number for use in components
export const twilioPhoneNumber = phoneNumber;

// Generate capability token for browser-based calling
export function generateVoiceToken(identity: string): string {
  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;

  const token = new AccessToken(
    accountSid,
    process.env.TWILIO_API_KEY_SID || accountSid,
    process.env.TWILIO_API_KEY_SECRET || authToken,
    { identity }
  );

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
    incomingAllow: true,
  });

  token.addGrant(voiceGrant);
  return token.toJwt();
}

// TwiML response helpers
export const VoiceResponse = twilio.twiml.VoiceResponse;

// Format phone number to E.164
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  if (!phone.startsWith('+')) {
    return `+${cleaned}`;
  }
  return phone;
}

// Parse caller ID for display
export function formatCallerIdDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}
