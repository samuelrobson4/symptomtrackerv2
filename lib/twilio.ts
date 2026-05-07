import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const fromNumber = process.env.TWILIO_PHONE_NUMBER!;

export function getTwilioClient() {
  return twilio(accountSid, authToken);
}

export async function sendSMS(to: string, body: string) {
  const client = getTwilioClient();
  return client.messages.create({ from: fromNumber, to, body });
}

export function validateTwilioRequest(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  if (process.env.NODE_ENV === "development") return true;
  return twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    params
  );
}
