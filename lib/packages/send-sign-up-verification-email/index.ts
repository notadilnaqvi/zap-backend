import { type SQSHandler } from "aws-lambda";

import { commercetoolsFetch, validatePayload } from "./utils";
import { type EmailVerificationToken } from "./types";

export const handler: SQSHandler = async (event) => {
  try {
    const payload = validatePayload(event?.Records?.[0]?.body);

    const customer = payload.customer;

    const url = new URL(
      process.env.CTP_PROJECT_KEY + "/customers/email-token",
      process.env.CTP_API_URL,
    );

    const emailVerificationToken =
      await commercetoolsFetch<EmailVerificationToken>(url, {
        method: "POST",
        body: JSON.stringify({
          id: customer.id,
          ttlMinutes: 24 * 60 * 3, // Make the token valid for 3 days
        }),
      });

    const tokenExpiry = new Date(emailVerificationToken.expiresAt).toLocaleString('en-PK') + ' (PKT)';

    const sendEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.RESEND_API_KEY,
      },
      body: JSON.stringify({
        // TODO: Using Resend's testing email for now. Update this to use a
        // dedicated email address
        from: "onboarding@resend.dev",
        to: [customer.email],
        subject: "Verify you email for ZAP",
        html: `<section>
          <p>Hey ${customer.firstName},</p>
          <p>Welcome to ZAP!</p>
          <p>Click the following link to verify your email</p>
          <a
            href="https://the-zap-store.vercel.app/verify?tokenValue=${emailVerificationToken.value}"
          >
            Verify email
          </a>
          <i>This token will expire on ${tokenExpiry}</i>
        </section>`,
      }),
    });

    if (!sendEmailResponse.ok) {
      const error = await sendEmailResponse.json();
      throw new Error(JSON.stringify(error));
    }
  } catch (error: any) {
    console.error("Failed to send verification email", JSON.stringify(error));
  }
};
