import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export class ApiGatewayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // RAG Orchestrator Lambda
    const ragOrchestratorLambda = new lambda.Function(this, 'RagOrchestratorLambda', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/orchestrator-lambda'),
    });

    // Support Agent Lambda
    new lambda.Function(this, 'SupportAgentLambda', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/support-agent-lambda'),
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'RAGChatBotApi', {
      restApiName: 'RAG ChatBot API',
      description: 'API Gateway for RAG-based Chatbot.',
    });

    // POST method to trigger RAG Orchestrator Lambda
    const queryResource = api.root.addResource('query');
    queryResource.addMethod('POST', new apigateway.LambdaIntegration(ragOrchestratorLambda));

    // Output API Gateway URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });
  }
}
