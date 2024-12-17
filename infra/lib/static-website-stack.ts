import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import path from 'path';
import { PolicyStatement, Effect, AnyPrincipal } from 'aws-cdk-lib/aws-iam';

import dotenv from 'dotenv';
dotenv.config()


const awsAccountId = process.env.AWS_ACCOUNT_ID;

export class StaticWebsiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const webisteBucket = new Bucket(this, `${id}Websitebucket`, {
      bucketName: `${id.toLowerCase()}-website-bucket-${awsAccountId}`,
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

    new BucketDeployment(this, `${id}WebsiteAssets`, {
      destinationBucket: webisteBucket,
      sources: [Source.asset(path.join(__dirname, '../../client/', 'dist'))],
    });
  }
}