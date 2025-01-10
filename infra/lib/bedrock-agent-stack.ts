import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class BedrockAgentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const knowledgeBaseId = cdk.Fn.importValue('KnowledgeBaseId');

    const getTimeLambda = new lambda.Function(this, 'GetTimeLambda', {
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lambda/get-time'),
        description: 'Lambda function to return the current time.',
      });
    
  
    const additionLambda = new lambda.Function(this, 'AdditionLambda', {
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lambda/addition'),
        description: 'Lambda function to add two numbers.',
    });

    const requestsLayer = new lambda.LayerVersion(this, 'RequestsLayer', {
        code: lambda.Code.fromAsset('lambda/common-layer/common-layer.zip'),
        compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
        description: 'A layer containing the requests library',
      });
  
    const flightLambda = new lambda.Function(this, 'FlightLambda', {
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lambda/flight'),
        layers: [requestsLayer],
        timeout: cdk.Duration.minutes(5),
        environment: {
        API_KEY: '', // add API KEY from https://rapidapi.com/hub to call SkyScanner APIs
        },
    });

   
    const agentRole = new iam.Role(this, 'BedrockAgentRole', {
      assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com'), // Bedrock service principal
      description: 'IAM Role for Amazon Bedrock Agent',
    });

    agentRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonBedrockFullAccess'));
    agentRole.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['lambda:InvokeFunction'],
        resources: [
          getTimeLambda.functionArn,
          additionLambda.functionArn,
          flightLambda.functionArn,
        ],
      }));

    
    const bedrockAgent = new bedrock.CfnAgent(this, 'BedrockAgentStack', {
      agentName: 'gen-ai-travel-advisor',
      description: `AI-powered travel advisor agent stack providing real-time flight prices, current time retrieval, and basic arithmetic functions for seamless user travel assistance.`,
      agentResourceRoleArn: agentRole.roleArn,
      foundationModel: 'anthropic.claude-3-sonnet-20240229-v1:0',
      knowledgeBases: [{
        description: 'knowledge base for travel advisor agent',
        knowledgeBaseId: knowledgeBaseId
      }],
      instruction: `You are a helpful AI-powered travel advisor. Your role is to assist users by answering travel-related questions, providing recommendations, and retrieving real-time information when needed. 
        You have access to the following functions:

        1. GetTimeActionGroup::time-function - Retrieve the current time.
        2. AdditionActionGroup::addition-function - Add two numbers.
        3. FlightPriceActionGroup::flight-function - Retrieve real-time flight prices for a specified origin and destination.

        When interacting with the user, always adhere to the following guidelines:
        - For any question or request, first try to understand the user's intent.
        - Before invoking the flight-function, check the departure and return dates to ensure they are not in the past:
        - Use the time-function to retrieve the current date and time.
        - If either the departure date or return date is in the past, inform the user with a friendly message like: 
            "The specified departure/return date is in the past. Please provide valid future dates for your travel."
        - Do not call the flight-function if the dates are invalid.
        - When invoking a function, ensure all required parameters are included. Ask follow-up questions to gather missing parameters.
        - Always return the results to the user in an easy-to-understand format.
        - Never make assumptions about parameter values unless explicitly provided by the user.
        - Maintain a professional and friendly tone in all responses.
        - Always organize the response into clear, easy-to-read sections or bullet points.
        - Include essential details like dates, prices, or other key data.
        
        Important Notes:
        Airport Codes Usage:

        The knowledge base contains a comprehensive list of airport codes for cities worldwide.
        If a user provides a city name instead of an airport code, attempt to match it using the knowledge base. For example, if the user mentions "Los Angeles," suggest "LAX" as the airport code.
        Respond with: "I noticed you mentioned [city]. Did you mean [airport code]? If not, please provide the airport code for better accuracy."`,
      actionGroups: [
        {
          actionGroupName: 'GetTimeActionGroup',
          description: 'Action group to get the current time from a Lambda function.',
          actionGroupExecutor: {
              lambda: getTimeLambda.functionArn,
            }, 
          functionSchema: {
            functions: [
                {
                    name: 'time-function',
                    parameters: {},
                }
            ]
          },  
        },
        {
          actionGroupName: 'AdditionActionGroup',
          description: 'Action group to add two numbers via a Lambda function.',
          actionGroupExecutor: {
            lambda: additionLambda.functionArn,
          },
          functionSchema: {
            functions: [
                {

                    name: 'addition-function',
                    parameters: {
                        number1: {
                            type: 'number',
                            description: 'first number to be added',
                            required: true,
                        },
                        number2: {
                            type: 'number',
                            description: 'second number to be added',
                            required: true
                        }
                    }
                }
            ]
          }
        },
        {
            actionGroupName: 'FlightPriceActionGroup',
            description: 'Fetch real-time flight prices using Skyscanner API via RapidAPI.',
            actionGroupExecutor: {
              lambda: flightLambda.functionArn,
            },
            functionSchema: {
                functions: [
                  {
                    name: 'fetch-flight-prices',
                    parameters: {
                      origin: {
                        type: 'string',
                        description: 'Origin airport code (e.g., LAX for Los Angeles). Must be a valid IATA code.',
                        required: true,
                      },
                      destination: {
                        type: 'string',
                        description: 'Destination airport code (e.g., JFK for New York). Must be a valid IATA code.',
                        required: true,
                      },
                      departureDate: {
                        type: 'string',
                        description: 'Departure date in YYYY-MM-DD format.',
                        required: true,
                      },
                      returnDate: {
                        type: 'string',
                        description: 'Return date in YYYY-MM-DD format (if applicable). Optional for one-way trips.',
                        required: false,
                      },
                    },
                  },
                ],
            },              
        }  
      ],
    });
      
    const lambdas = [getTimeLambda, additionLambda, flightLambda];
    lambdas.forEach((lambda) => {
        lambda.addPermission(`${lambda}-AllowBedrockInvocation`, {
            principal: new iam.ServicePrincipal('bedrock.amazonaws.com'),
            action: 'lambda:InvokeFunction',
            sourceArn: `arn:aws:bedrock:${this.region}:${this.account}:agent/${bedrockAgent.ref}`,
        });
    })

    // Output the Bedrock Agent ARN
    new cdk.CfnOutput(this, 'BedrockAgentID', {
      value: bedrockAgent.attrAgentId,
      description: 'The ID of the Bedrock Agent',
      exportName: 'BedrockAgentID'
    });
  }
}
