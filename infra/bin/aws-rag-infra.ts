import * as cdk from 'aws-cdk-lib';
import { ApiGatewayStack } from '../lib/api-gateway-stack';
import { OpenSearchStack } from '../lib/open-search-stack';
import { StaticWebsiteStack } from '../lib/static-website-stack';

const app = new cdk.App();

new ApiGatewayStack(app, 'RAGChatBotApiGateway');
new OpenSearchStack(app, 'RAGOpenSearchStack');
new StaticWebsiteStack(app, 'RAGChatBotWebsite')