import { z } from "zod";
import { AuthToken } from "./types";

// Payload: https://docs.commercetools.com/api/projects/subscriptions#messagedeliverypayload
const payloadSchema = z.object({
  customer: z.object({
    id: z.string(),
    version: z.number().int(),
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
  } catch (error) {
    throw new Error("Failed to validate payload. " + JSON.stringify(error));
  }
}

/** Equivalent to `btoa` but works on the server */
export function toBase64(str: string) {
  return Buffer.from(str).toString("base64");
}

let authToken: AuthToken | null = null;

async function generateClientAuthToken(): Promise<AuthToken> {
  const url = new URL("/oauth/token", process.env.CTP_AUTH_URL);

  url.searchParams.append("grant_type", "client_credentials");
  url.searchParams.append("scope", process.env.CTP_SCOPES);

  const credentials = toBase64(
    process.env.CTP_CLIENT_ID + ":" + process.env.CTP_CLIENT_SECRET,
  );

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Basic " + credentials,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(JSON.stringify(error));
  }

  const data = (await response.json()) as Omit<AuthToken, "expires_at">;

  const now = new Date();
  const expiresAt = now.getTime() + (data.expires_in - 3600) * 1000;

  const authToken: AuthToken = {
    ...data,
    expires_at: expiresAt,
  };

  return authToken;
}

export async function commercetoolsFetch<TData>(
  url: URL | RequestInfo,
  options?: RequestInit,
): Promise<TData> {
  const now = new Date();
  const isExpired = authToken && authToken.expires_at < now.getTime();

  if (!authToken || isExpired) {
    authToken = await generateClientAuthToken();
  }

  const headers = new Headers(options?.headers);

  headers.set("Content-Type", "application/json");

  headers.set(
    "Authorization",
    authToken.token_type + " " + authToken.access_token,
  );

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(JSON.stringify(error));
  }

  const data = (await response.json()) as TData;

  return data;
}
