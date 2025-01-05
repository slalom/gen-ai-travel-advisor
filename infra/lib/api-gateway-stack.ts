import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class ApiGatewayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bedrockAgentId = cdk.Fn.importValue('BedrockAgentID');
    const agentAlias = '' // TODO: hard-coding the agent alias
    // TODO: need a way to prepare the agent once it's deployed and create an alias programmatically and use that alias here

    const awsSdkLayer = new lambda.LayerVersion(this, 'AWSSDKLayer', {
        code: lambda.Code.fromAsset('lambda/common-layer/common-layer.zip'),
        compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
        description: 'A layer containing the AWS SDK library',
      });


    // Agent Query Lambda
    const agentQueryLambda = new lambda.Function(this, 'AgentQueryLambda', {
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lambda/agent-query-lambda'),
        layers: [awsSdkLayer],
        timeout: cdk.Duration.minutes(8),
        environment: {
        BEDROCK_AGENT_ID: bedrockAgentId,
        BEDROCK_AGENT_ALIAS: agentAlias, // Replace with your agent alias
        REGION: this.region,
        },
    });

    agentQueryLambda.addToRolePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['bedrock:InvokeAgent'],
          resources: [`arn:aws:bedrock:${this.region}:${this.account}:agent-alias/${bedrockAgentId}/${agentAlias}`],
        })
      );

    // API Gateway
    const api = new apigateway.RestApi(this, 'TravelAdvisorApi', {
      restApiName: 'Travel Advisor Service',
      description: 'API to Query Bedrock Agent',
    });

    const queryResource = api.root.addResource('query');
    queryResource.addMethod('POST', new apigateway.LambdaIntegration(agentQueryLambda));

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });
  }
}
