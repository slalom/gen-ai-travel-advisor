import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_opensearchserverless as opensearchserverless } from 'aws-cdk-lib';

export class OpenSearchStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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


    // OpenSearch Serverless Collection for Vector Search
    const vectorSearchCollection = new opensearchserverless.CfnCollection(this, 'VectorSearchCollection', {
      name: 'vector-search-collection', // Name of the collection
      type: 'VECTORSEARCH',             // Specifies this is a vector search collection
      description: 'OpenSearch collection for vector embeddings in POC',
    });

    // Dependencies
     vectorSearchCollection.node.addDependency(encryptionPolicy);
    
    // Output OpenSearch Collection ARN
    new cdk.CfnOutput(this, 'OpenSearchCollectionArn', {
      value: vectorSearchCollection.attrArn,
      description: 'OpenSearch Collection ARN',
      exportName: 'OpenSearchCollectionArn'
    });
  }
}
