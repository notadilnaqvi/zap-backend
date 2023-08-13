import { z } from "zod";

// Payload: https://docs.commercetools.com/api/projects/subscriptions#messagedeliverypayload
const payloadSchema = z.object({
  customer: z.object({
    id: z.string(),
    version: z.number(),
    email: z.string().email(),
    firstName: z.string(),
    // We're going to be sending email verification email, so we expect the
    // email to be unverified at this point
    isEmailVerified: z.literal(false),
  }),
});

export function validatePayload(payload: string) {
  try {
    const data = JSON.parse(payload);
    const validatedData = payloadSchema.parse(data);
    return validatedData;
  } catch (error: any) {
    throw new Error("Payload validation failed: " + error.message);
  }
}
