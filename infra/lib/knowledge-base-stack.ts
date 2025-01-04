import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';

export class KnowledgeBaseStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const collectionArn = cdk.Fn.importValue('OpenSearchCollectionArn');

    // Create a private S3 bucket
    const knowledgeBaseBucket = new s3.Bucket(this, 'KnowledgeBaseBucket', {
      bucketName: 'gen-ai-travel-advisor-kb-bucket',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // knowledge base data
    new s3deploy.BucketDeployment(this, 'DeployKnowledgeBaseData', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../knowledge-base'))],
      destinationBucket: knowledgeBaseBucket,
      destinationKeyPrefix: '',
    });

    const knowledgeBaseRole = new iam.Role(this, 'KnowledgeBaseRole', {
        assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com'),
      });
      
    knowledgeBaseRole.addToPolicy(new iam.PolicyStatement({
    actions: ['s3:GetObject', 's3:ListBucket'],
    resources: [knowledgeBaseBucket.bucketArn, `${knowledgeBaseBucket.bucketArn}/*`],
    }));
    
    knowledgeBaseRole.addToPolicy(new iam.PolicyStatement({
    actions: ['es:ESHttp*'], 
    resources: [collectionArn],
    }));

    // TODO: need to work on cdk code for KB
    /*new bedrock.CfnKnowledgeBase(this, 'MyCfnKnowledgeBase', {
        name: 'TravelAdvisorKnowledgeBase',
        roleArn: knowledgeBaseRole.roleArn,
        description: 'Knowledge base for AI Travel Advisor',
        knowledgeBaseConfiguration: {
          type: 'VECTOR',
          vectorKnowledgeBaseConfiguration: {
            embeddingModelArn: `arn:aws:bedrock:${this.region}::foundation-model/amazon.titan-embed-text-v2:0`,
          },
        },
        storageConfiguration: {
          type: 'OPENSEARCH_SERVERLESS',
          opensearchServerlessConfiguration: {
            collectionArn: collectionArn,
            fieldMapping: {
              metadataField: 'metadataField',
              textField: 'text',
              vectorField: 'embeddings',
            },
            vectorIndexName: 'travel-advisor-index',
          },
        },
      });*/

    // Output the bucket name
    new cdk.CfnOutput(this, 'KnowledgeBaseBucketName', {
      value: knowledgeBaseBucket.bucketName,
      description: 'The name of the Knowledge Base S3 bucket',
    });
  }
}
