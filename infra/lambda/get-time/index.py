import json
from datetime import datetime


def handler(event, context):
    try:
        agent = event.get("agent")
        actionGroup = event.get("actionGroup")
        function = event.get("function")
        parameters = event.get("parameters", [])

        current_time = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        responseBody = {"TEXT": {"body": f"The current time is {current_time}."}}

        action_response = {
            "actionGroup": actionGroup,
            "function": function,
            "functionResponse": {"responseBody": responseBody},
        }
        response = {
            "response": action_response,
            "messageVersion": event.get("messageVersion", "1.0"),
        }
        return response

    except Exception as e:
        error_response = {
            "response": {
                "actionGroup": event.get("actionGroup"),
                "function": event.get("function"),
                "functionResponse": {
                    "responseBody": {"TEXT": {"body": f"Error occurred: {str(e)}"}}
                },
            },
            "messageVersion": event.get("messageVersion", "1.0"),
        }

        print("Error Response:", json.dumps(error_response, indent=2))
        return error_response
