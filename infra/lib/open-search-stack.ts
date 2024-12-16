import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_opensearchserverless as opensearchserverless } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class OpenSearchStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const embeddingsLambdaRole = new iam.Role(this, 'EmbeddingsLambdaRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        ],
        inlinePolicies: {
          OpenSearchAccess: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                actions: ["aoss:WriteDocument", "aoss:ReadDocument"],
                resources: [
                  `arn:aws:aoss:${this.region}:${this.account}:collection/vector-search-collection`
                ],
                effect: iam.Effect.ALLOW,
              }),
              new iam.PolicyStatement({
                actions: ["aoss:DescribeCollection"],
                resources: ["*"],
                effect: iam.Effect.ALLOW,
              }),
            ],
          }),
        },
      });
    

    // Embeddings Lambda
    new lambda.Function(this, 'EmbeddingsLambda', {
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lambda/embeddings-lambda'),
        role: embeddingsLambdaRole
      });

      // Data Access Policy: Allows the Lambda role to write embeddings
      const dataAccessPolicy = new opensearchserverless.CfnAccessPolicy(this, 'DataAccessPolicy', {
        name: 'vector-search-access-policy',
        type: 'data',
        description: 'Data access policy for Lambda to write embeddings',
        policy: JSON.stringify([
          {
            Description: "Data access policy for vector search collection",
            Principal: [
              `${embeddingsLambdaRole.roleArn}` 
            ],
            Rules: [
              {
                Resource: ["collection/vector-search-collection"], 
                ResourceType: "collection",
                Permission: [
                  "aoss:CreateCollectionItems",
                  "aoss:UpdateCollectionItems",
                  "aoss:DeleteCollectionItems",
                  "aoss:DescribeCollectionItems"
                ]
              }
            ]
          }
        ]),
      });
      

    // Create an Encryption Security Policy
    const encryptionPolicy = new opensearchserverless.CfnSecurityPolicy(this, 'EncryptionPolicy', {
        name: 'vector-search-encryption-policy',
        type: 'encryption',
        description: 'Encryption policy for OpenSearch Serverless vector search',
        policy: JSON.stringify({
          Rules: [
            {
              ResourceType: "collection",
              Resource: ["collection/vector-search-collection"]
            }
          ],
          AWSOwnedKey: true
        }),
      });

    const opensearchAccessRole = new iam.Role(this, 'OpenSearchAccessRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'), // Adjust principal if needed
      });
      
      // Attach specific OpenSearch Serverless permissions
      opensearchAccessRole.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "aoss:CreateCollectionItems",
          "aoss:DeleteCollectionItems",
          "aoss:UpdateCollectionItems",
          "aoss:DescribeCollectionItems",
          "aoss:CreateIndex",
          "aoss:DeleteIndex",
          "aoss:UpdateIndex",
          "aoss:DescribeIndex",
          "aoss:ReadDocument",
          "aoss:WriteDocument"
        ],
        resources: ["*"], // Replace with specific resource ARNs in production
      }));

    // OpenSearch Serverless Collection for Vector Search
    const vectorSearchCollection = new opensearchserverless.CfnCollection(this, 'VectorSearchCollection', {
      name: 'vector-search-collection', // Name of the collection
      type: 'VECTORSEARCH',             // Specifies this is a vector search collection
      description: 'OpenSearch collection for vector embeddings in POC',
    });

    // Dependencies
     vectorSearchCollection.node.addDependency(encryptionPolicy);
     vectorSearchCollection.node.addDependency(dataAccessPolicy);
    
    // Output OpenSearch Collection ARN
    new cdk.CfnOutput(this, 'OpenSearchCollectionArn', {
      value: vectorSearchCollection.attrArn,
      description: 'OpenSearch Collection ARN',
    });

    new cdk.CfnOutput(this, 'OpenSearchRoleArn', {
      value: opensearchAccessRole.roleArn,
      description: 'IAM Role ARN for OpenSearch access',
    });
  }
}
