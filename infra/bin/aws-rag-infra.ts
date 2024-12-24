import * as cdk from 'aws-cdk-lib';
import { ApiGatewayStack } from '../lib/api-gateway-stack';
import { BedrockAgentStack } from '../lib/bedrock-agent-stack';
import { StaticWebsiteStack } from '../lib/static-website-stack';

const app = new cdk.App();

new ApiGatewayStack(app, 'RAGChatBotApiGateway');
new BedrockAgentStack(app, 'RAGBedrockAgentStack');
new StaticWebsiteStack(app, 'RAGChatBotWebsite')