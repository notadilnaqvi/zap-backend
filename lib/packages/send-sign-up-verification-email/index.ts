import { validatePayload } from "./utils";
import { type SQSHandler } from "aws-lambda";
import * as AWS from "aws-sdk";

const ses = new AWS.SES();

export const handler: SQSHandler = async (event) => {
  try {
    const payload = validatePayload(event?.Records[0].body);

    await ses
      .sendEmail({
        Source: "noreply.the.zap.store@gmail.com",
        Destination: { ToAddresses: [payload.customer.email] },
        Message: {
          Subject: { Data: "Verify your email address for ZAP" },
          Body: {
            Text: {
              Data:
                "Hey there " +
                payload.customer.firstName +
                "\n\nWelcome to ZAP!" +
                "\nClick the link below to verify you email address" +
                "\nhttps://the-zap-store.vercel.app/not-implemented-yet",
            },
          },
        },
      })
      .promise();
  } catch (error: any) {
    console.error(
      "[Error] Failed to send email with the following error: ",
      error.message || error,
    );
  }

  return;
};
