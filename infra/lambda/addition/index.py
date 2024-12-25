import json


def handler(event, context):
    try:
        agent = event.get("agent")
        actionGroup = event.get("actionGroup")
        function = event.get("function")
        parameters = event.get("parameters", [])

        number1 = next(
            (param["value"] for param in parameters if param["name"] == "number1"), None
        )
        number2 = next(
            (param["value"] for param in parameters if param["name"] == "number2"), None
        )

        if number1 is None or number2 is None:
            raise ValueError("Both 'number1' and 'number2' parameters are required.")

        result = float(number1) + float(number2)

        responseBody = {
            "TEXT": {"body": f"The sum of {number1} and {number2} is {result}."}
        }

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
