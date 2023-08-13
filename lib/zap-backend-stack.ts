import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import { type Construct } from "constructs";

// Refer to https://docs.commercetools.com/api/projects/subscriptions#sqsdestination
const COMMERCETOOLS_SUBSCRIPTIONS_USER_ARN =
  "arn:aws:iam::362576667341:user/subscriptions";
export class ZapBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a queue to receive messages from Commercetools
    const commercetoolsCustomerCreatedQueue = new sqs.Queue(
      this,
      "CommercetoolsCustomerCreatedQueue",
      {
        visibilityTimeout: cdk.Duration.minutes(1),
        receiveMessageWaitTime: cdk.Duration.seconds(10),
      }
    );

    // Allow Commercetools subscriptions user to send messages to our queue
    // Refer to https://docs.commercetools.com/api/projects/subscriptions#sqsdestination
    commercetoolsCustomerCreatedQueue.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["sqs:SendMessage"],
        principals: [
          new iam.ArnPrincipal(COMMERCETOOLS_SUBSCRIPTIONS_USER_ARN),
        ],
        resources: [commercetoolsCustomerCreatedQueue.queueArn],
      }),
    );

    // Create a lambda function to send verification emails to users who just
    // signed up
    const sendSignUpVerificationEmailLambda = new lambdaNodeJs.NodejsFunction(
      this,
      "SendSignUpVerificationEmail",
      {
        retryAttempts: 0,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "handler",
        entry: path.join(
          __dirname,
          "/packages/send-sign-up-verification-email/index.ts",
        ),
      },
    );

    // Allow the lambda to consume messages from the queue
    commercetoolsCustomerCreatedQueue.grantConsumeMessages(
      sendSignUpVerificationEmailLambda,
    );

    // Make the lambda run everytime the queue reveives a new message
    sendSignUpVerificationEmailLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(commercetoolsCustomerCreatedQueue),
    );

    // Allow the lambda to send emails
    sendSignUpVerificationEmailLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ses:SendEmail", "ses:SendRawEmail"],
        resources: ['*'],
      }),
    );
  }
}
