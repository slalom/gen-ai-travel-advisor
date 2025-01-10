import * as cdk from 'aws-cdk-lib';
import { ApiGatewayStack } from '../lib/api-gateway-stack';
import { BedrockAgentStack } from '../lib/bedrock-agent-stack';
import { StaticWebsiteStack } from '../lib/static-website-stack';
import { KnowledgeBaseStack } from '../lib/knowledge-base-stack';

const app = new cdk.App();

new StaticWebsiteStack(app, 'RAGChatBotWebsite');
const bedrockAgent = new BedrockAgentStack(app, 'RAGBedrockAgentStack');
new KnowledgeBaseStack(app, 'RAGKnowledgeBaseStack');
const apigateway = new ApiGatewayStack(app, 'RAGChatBotApiGateway');
apigateway.addDependency(bedrockAgent);