import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket, BucketAccessControl } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import path from 'path';
import { PolicyStatement, Effect, AnyPrincipal } from 'aws-cdk-lib/aws-iam';

class ChatBotStck extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const webisteBucket = new Bucket(this, `${id}WebisteBucket`, {
      websiteIndexDocument: 'index.html',
      blockPublicAccess: {
        blockPublicAcls: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
        blockPublicPolicy: false,
      },
    });

    webisteBucket.addToResourcePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      principals: [
        new AnyPrincipal,
      ],
      actions: [
        's3:GetObject',
      ],
      resources: [
        `${webisteBucket.bucketArn}/*`,
      ]
    }));

    const websiteAssets = new BucketDeployment(this, `${id}WebsiteAssets`, {
      destinationBucket: webisteBucket,
      sources: [Source.asset(path.join(__dirname, '../client/', 'dist'))],
    });
  }
}

const app = new cdk.App();
new ChatBotStck(app, 'ChatBotStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});