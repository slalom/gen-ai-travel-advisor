import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class ApiGatewayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bedrockAgentId = cdk.Fn.importValue('BedrockAgentID');
    const agentAlias = cdk.Fn.importValue('BedrockAgentAliasID');

    /*
    * Amazon Bedrock Agent Lifecycle:
    * - When an agent is first created, it starts with a draft version (DRAFT) and a test alias (TSTALIASID) pointing to the draft.
    * - Changes to the agent apply to the draft version. Iterate and test until satisfied with the agent's behavior.
    * - For deployment, create an alias. This creates a new agent version and points the alias to it.
    *   Alternatively, you can assign the alias to an existing version.
    * - Applications interact with the deployed agent by making API calls to the alias.
    */

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
        BEDROCK_AGENT_ALIAS: agentAlias,
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
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowCredentials: true,
        allowHeaders: [...apigateway.Cors.DEFAULT_HEADERS, 'Access-Control-Allow-Origin', 'Access-Control-Allow-Methods'],
        allowMethods: [... apigateway.Cors.ALL_METHODS, 'OPTIONS']
      }
    });

    const queryResource = api.root.addResource('query');
    queryResource.addMethod('POST', new apigateway.LambdaIntegration(agentQueryLambda));

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: 'ApiUrl'
    });
  }
}
