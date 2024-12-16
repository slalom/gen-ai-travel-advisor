import * as cdk from 'aws-cdk-lib';
import { ApiGatewayStack } from '../lib/api-gateway-stack';


const app = new cdk.App();

new ApiGatewayStack(app, 'RAGChatBotApiGateway');
