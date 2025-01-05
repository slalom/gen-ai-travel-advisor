import json
import boto3
import os
import uuid

bedrock_client = boto3.client('bedrock-agent-runtime')

def handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
        input_text = body.get("inputText")
        if not input_text:
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "inputText is required in the request body."})
            }
        
        agent_id = os.environ.get('BEDROCK_AGENT_ID')  
        agent_alias_id = os.environ.get('BEDROCK_AGENT_ALIAS')
        if not agent_id or not agent_alias_id:
            raise ValueError("Environment variables 'BEDROCK_AGENT_ID' or 'BEDROCK_AGENT_ALIAS_ID' are not set.")
        
        # Generate a unique session ID
        # FYI - Use the same value across requests to continue the same conversation.
        session_id = str(uuid.uuid4())

        response = bedrock_client.invoke_agent(
            agentId=agent_id,
            agentAliasId=agent_alias_id,
            sessionId=session_id,
            inputText=input_text
        )
     
        completion = ""

        for event in response.get("completion"):
            chunk = event["chunk"]
            completion = completion + chunk["bytes"].decode()
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps({
                "message": "Agent response retrieved successfully.",
                "agentResponse": completion
            })
        }

    except Exception as e:
        print(f"Error: {str(e)}")

        # Return an error response
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps({
                "message": "An error occurred while invoking the agent.",
                "error": str(e)
            })
        }
