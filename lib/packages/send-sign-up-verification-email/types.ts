declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CTP_PROJECT_KEY: string;
      CTP_CLIENT_SECRET: string;
      CTP_CLIENT_ID: string;
      CTP_AUTH_URL: string;
      CTP_API_URL: string;
      CTP_SCOPES: string;
      RESEND_API_KEY: string;
    }
  }
}

export type AuthToken = {
  scope: string;
  expires_in: number;
  expires_at: number;
  access_token: string;
  token_type: "Bearer";
  refresh_token: string;
};

export type EmailVerificationToken = {
  id: string;
  versionModifiedAt: string;
  lastMessageSequenceNumber: number;
  createdAt: string;
  lastModifiedAt: string;
  lastModifiedBy: {
    clientId: string;
    isPlatformClient: boolean;
  };
  createdBy: {
    clientId: string;
    isPlatformClient: boolean;
  };
  customerId: string;
  expiresAt: string;
  value: string;
};
