import { validatePayload } from "./utils";
import { type SQSHandler } from "aws-lambda";

export const handler: SQSHandler = async (event) => {
  try {
    const payload = validatePayload(event?.Records[0].body);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.RESEND_API_KEY,
      },
      body: JSON.stringify({
        // TODO: Using Resend's testing email for now. Update this to use a
        // dedicated email address
        from: "onboarding@resend.dev",
        to: [payload.customer.email],
        subject: "Verify you email for ZAP",
        html:
          `<p>Hey there ${payload.customer.firstName},</p>` +
          "<p>Welcome to ZAP!</p>" +
          "<p>Click the link below to verify you email address</p>" +
          '<a href="https://the-zap-store.vercel.app/">Verify your email</a>',
      }),
    });

    if (!res.ok) {
      throw new Error(res.statusText);
    }
  } catch (error: any) {
    console.error(
      "[Error] Failed to send email with the following error: ",
      error.message || error,
    );
  }

  return;
};
