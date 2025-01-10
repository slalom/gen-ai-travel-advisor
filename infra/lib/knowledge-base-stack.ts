import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as opensearchserverless from 'aws-cdk-lib/aws-opensearchserverless';
import { collectionName, openSearchIndex } from './constants'
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cr from 'aws-cdk-lib/custom-resources';
import { aws_s3 as s3, aws_s3_deployment as s3deploy } from 'aws-cdk-lib';
import * as path from 'path';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';

export class KnowledgeBaseStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create an Encryption Security Policy
    const encryptionPolicy = new opensearchserverless.CfnSecurityPolicy(this, 'EncryptionPolicy', {
      name: `${collectionName}-encryption`,
      type: 'encryption',
      description: 'Encryption policy for OpenSearch Serverless vector search',
      policy: JSON.stringify({
        Rules: [
          {
            ResourceType: 'collection',
            Resource: [`collection/${collectionName}`],
          },
        ],
        AWSOwnedKey: true,
      }),
    });

    // Create Network Policy
    const networkPolicy = new opensearchserverless.CfnSecurityPolicy(this, 'NetworkPolicy', {
        name: `${collectionName}-network`,
        type: 'network',
        description: 'Network policy for OpenSearch Serverless vector search',
        policy: JSON.stringify([
            {
                Rules: [
                    {
                        ResourceType: "collection", 
                        Resource: [`collection/${collectionName}`],
                    },
                ],
                AllowFromPublic: true, 
            },
        ]),
    });

      const openSearchIndexLayer = new lambda.LayerVersion(this, 'RequestsLayer', {
        code: lambda.Code.fromAsset('lambda/common-layer/open-search-lambda.zip'),
        compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
        description: 'A layer containing the requests library',
      });

    // Create an OpenSearch Serverless Collection for Vector Search
    const vectorSearchCollection = new opensearchserverless.CfnCollection(this, 'VectorSearchCollection', {
      name: collectionName,
      type: 'VECTORSEARCH',
      description: 'OpenSearch collection for vector embeddings in POC',
    });

    const createIndexLambdaRole = new iam.Role(this, 'CreateIndexLambdaRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        description: 'Role for createIndexLambda to interact with OpenSearch Serverless',
        inlinePolicies: {
          OpenSearchAccess: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                actions: ['aoss:*'],
                resources: ['*'],
              }),
            ],
          }),
        },
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
        ],
      });
      

    // Lambda Function for creating OpenSearch index
    const createIndexLambda = new lambda.Function(this, 'CreateIndexLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      layers: [openSearchIndexLayer],
      code: lambda.Code.fromAsset('lambda/open-search'),
      role: createIndexLambdaRole,
      timeout: cdk.Duration.minutes(5),
      environment: {
        OPENSEARCH_ENDPOINT: vectorSearchCollection.attrCollectionEndpoint,
        REGION: this.region
      },
    });

    createIndexLambda.node.addDependency(vectorSearchCollection)


      // S3 bucket for knowledge base data
      const knowledgeBaseBucket = new s3.Bucket(this, 'KnowledgeBaseBucket', {
        bucketName: 'gen-ai-travel-advisor-kb-bucket',
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        versioned: false,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
  
      // Deploy the knowledge base data to the bucket
      new s3deploy.BucketDeployment(this, 'DeployKnowledgeBaseData', {
        sources: [s3deploy.Source.asset(path.join(__dirname, '../knowledge-base'))],
        destinationBucket: knowledgeBaseBucket,
        destinationKeyPrefix: '', // Optional: Add a prefix if required
      });
  
      // Create the IAM Role for Knowledge Base
    const knowledgeBaseRole = new iam.Role(this, 'KnowledgeBaseRole', {
        assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com', {
          conditions: {
            'StringEquals': { 'aws:SourceAccount': this.account },
            'ArnLike': { 'aws:SourceArn': `arn:aws:bedrock:${this.region}:${this.account}:knowledge-base/*` },
          },
        }),
        roleName: 'KnowledgeBaseRole',
        description: 'Role for Bedrock Knowledge Base with required permissions',
      });
  
      // Add the Bedrock:InvokeModel permission
      knowledgeBaseRole.addToPolicy(
        new iam.PolicyStatement({
          sid: 'BedrockInvokeModelStatement',
          effect: iam.Effect.ALLOW,
          actions: ['bedrock:InvokeModel'],
          resources: [`arn:aws:bedrock:${this.region}::foundation-model/amazon.titan-embed-text-v2:0`],
        }),
      );
  
      // Add the OpenSearch Serverless API Access permission
      knowledgeBaseRole.addToPolicy(
        new iam.PolicyStatement({
          sid: 'OpenSearchServerlessAPIAccessAllStatement',
          effect: iam.Effect.ALLOW,
          actions: ['aoss:APIAccessAll'],
          resources: [`arn:aws:aoss:${this.region}:${this.account}:collection/*`],
        }),
      );
  
      // Add the S3 permissions
      knowledgeBaseRole.addToPolicy(
        new iam.PolicyStatement({
          sid: 'S3ListBucketStatement',
          effect: iam.Effect.ALLOW,
          actions: ['s3:ListBucket'],
          resources: [`arn:aws:s3:::${knowledgeBaseBucket.bucketName}`],
          conditions: {
            StringEquals: {
              'aws:ResourceAccount': [`${this.account}`],
            },
          },
        }),
      );
  
      knowledgeBaseRole.addToPolicy(
        new iam.PolicyStatement({
          sid: 'S3GetObjectStatement',
          effect: iam.Effect.ALLOW,
          actions: ['s3:GetObject'],
          resources: [`arn:aws:s3:::${knowledgeBaseBucket.bucketName}/*`],
          conditions: {
            StringEquals: {
              'aws:ResourceAccount': [`${this.account}`],
            },
          },
        }),
      );
      
    // Grant necessary permissions to Lambda
    createIndexLambda.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['aoss:*'],
      resources: ['*'],
    }));
    knowledgeBaseRole.addToPolicy(
        new iam.PolicyStatement({
          actions: [
            'aoss:CreateIndex',
            'aoss:DeleteIndex',
            'aoss:DescribeIndex',
            'aoss:ReadDocument',
            'aoss:WriteDocument',
            'aoss:UpdateIndex',
            'aoss:ListCollections',
          ],
          resources: [
            // Replace with your OpenSearch resource ARNs
            `arn:aws:aoss:${this.region}:${this.account}:collection/${collectionName}`,
            `arn:aws:aoss:${this.region}:${this.account}:index/${openSearchIndex}`,
          ],
        })
      );
    const dataPolicy = new opensearchserverless.CfnAccessPolicy(this, 'DataAccessPolicy', {
        name: `${collectionName}-data`,
        type: 'data',
        policy: JSON.stringify([
            {
                Description: 'Data access policy for Lambda function to interact with OpenSearch Serverless',
                Rules: [
                    {
                        ResourceType: "collection", 
                        Resource: [`collection/${collectionName}`],
                        Permission: ['aoss:*'],
                    },
                    {
                        ResourceType: "index", 
                        Resource: [`index/${collectionName}/*`],
                        Permission: ['aoss:*'],
                    },
                ],
                Principal: [knowledgeBaseRole.roleArn, createIndexLambdaRole.roleArn]
            },
        ]),
      });

    // Ensure the collection depends on the encryption policy
    vectorSearchCollection.node.addDependency(encryptionPolicy);
    vectorSearchCollection.node.addDependency(networkPolicy);
    vectorSearchCollection.node.addDependency(dataPolicy);


    // Define a custom resource provider
    const provider = new cr.Provider(this, 'OpenSearchIndexProvider', {
        onEventHandler: createIndexLambda,
      });
  
      // Define the custom resource
     const crs =  new cdk.CustomResource(this, 'OpenSearchIndexResource', {
        serviceToken: provider.serviceToken,
        properties: {
          IndexName: openSearchIndex,
        },
      });
    
      // Create Knowledge Base
    const kb = new bedrock.CfnKnowledgeBase(this, 'KnowledgeBase', {
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
            collectionArn: vectorSearchCollection.attrArn,
            fieldMapping: {
                metadataField: 'metadata',
                textField: 'text',
                vectorField: 'embeddings',
              },
            vectorIndexName: openSearchIndex,
            },
        },
    });
    kb.node.addDependency(crs)

    const dataSource = new bedrock.CfnDataSource(this, 'TravelAdvisorDataSource', {
       dataSourceConfiguration: {
        type: 'S3',
        s3Configuration: {
            bucketArn: knowledgeBaseBucket.bucketArn
        }
       },
       knowledgeBaseId: kb.attrKnowledgeBaseId,
       name: 'TravelAdvisorDataSource'
      });

      dataSource.addDependency(kb)

    new cdk.CfnOutput(this, 'OpenSearchCollectionArn', {
      value: vectorSearchCollection.attrArn,
      description: 'OpenSearch Collection ARN',
      exportName: 'OpenSearchCollectionArn',
    });

    new cdk.CfnOutput(this, 'OpenSearchEndpoint', {
        value: vectorSearchCollection.attrCollectionEndpoint,
        description: 'OpenSearch Collection ARN',
        exportName: 'OpenSearchEndpoint',
      });
  }
}
