import * as cdk from 'aws-cdk-lib';
import { ApiGatewayStack } from '../lib/api-gateway-stack';
import { BedrockAgentStack } from '../lib/bedrock-agent-stack';
import { StaticWebsiteStack } from '../lib/static-website-stack';
import { KnowledgeBaseStack } from '../lib/knowledge-base-stack';

const app = new cdk.App();

new StaticWebsiteStack(app, 'RAGChatBotWebsite');
const kbStack = new KnowledgeBaseStack(app, 'RAGKnowledgeBaseStack');
const apigateway = new ApiGatewayStack(app, 'RAGChatBotApiGateway');
const bedrockAgent = new BedrockAgentStack(app, 'RAGBedrockAgentStack');
apigateway.addDependency(bedrockAgent);
bedrockAgent.addDependency(kbStack)