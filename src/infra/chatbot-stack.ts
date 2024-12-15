import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';


class ChatBotStck extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

  }
}

const app = new cdk.App();
new ChatBotStck(app, 'ChatBotStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});