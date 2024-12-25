import json
import requests
import os


def handler(event, context):
    try:
        parameters = {
            param["name"]: param["value"] for param in event.get("parameters", [])
        }
        origin = parameters.get("origin")
        destination = parameters.get("destination")
        departure_date = parameters.get("departureDate")
        return_date = parameters.get("returnDate")

        # Validate required parameters
        if not origin or not destination:
            raise ValueError("Missing required parameters: 'origin' or 'destination'")
        if not departure_date or not return_date:
            raise ValueError("Both 'departureDate' and 'returnDate' must be provided")
        if not all([origin, destination, departure_date, return_date]):
            raise ValueError(
                "Missing one or more required parameters: 'origin', 'destination', 'departureDate', 'returnDate'"
            )

        # Set API key and URL
        api_key = os.getenv("API_KEY")  # Replace with your API key if hardcoded
        if not api_key:
            error_message = "Error: API key is missing. Please set the API_KEY environment variable."
            print(error_message)
            return {"statusCode": 500, "body": {"error": error_message}}
        url = "https://sky-scanner3.p.rapidapi.com/flights/search-roundtrip"

        querystring = {
            "fromEntityId": origin,
            "toEntityId": destination,
            "departDate": departure_date,
            "returnDate": return_date,
            "adults": "1",
            "currency": "USD",
            "market": "US",
        }

        headers = {
            "x-rapidapi-key": api_key,
            "x-rapidapi-host": "sky-scanner3.p.rapidapi.com",
            "Accept": "application/json",
            "Content-Type": "application/json",
            "x-rapidapi-ua": "RapidAPI-Playground",
        }

        response = requests.get(url, headers=headers, params=querystring)

        if response.status_code != 200:
            raise ValueError(
                f"API call failed with status code {response.status_code}: {response.text}"
            )

        response_data = response.json()

        # Extract itineraries (or any relevant data)
        itineraries = response_data.get("data", {}).get("itineraries", [])

        if not itineraries:
            raise ValueError(response_data.get("errors", "No itineraries found"))

        # Minimize response to avoid exceeding size limit
        MAX_RESULTS = 10
        itineraries = itineraries[:MAX_RESULTS]
        reduced_itineraries = [
            {
                "price": it.get("price"),
                "departureTime": it.get("departureTime"),
                "arrivalTime": it.get("arrivalTime"),
                "carrier": it.get("carrier"),
            }
            for it in itineraries
        ]

        # Construct the response for the Bedrock Agent
        action_response = {
            "actionGroup": "FlightPriceActionGroup",
            "function": "fetch-flight-prices",
            "functionResponse": {
                "responseBody": {
                    "TEXT": {
                        "body": f"Matching flights: {json.dumps(reduced_itineraries)}."
                    }
                }
            },
        }

        formatted_response = {"response": action_response, "messageVersion": "1.0"}
        return formatted_response

    except Exception as e:
        error_response = {
            "messageVersion": "1.0",
            "responses": [
                {
                    "actionGroup": "FlightPriceActionGroup",
                    "function": "fetch-flight-prices",
                    "functionResponse": {
                        "responseBody": {"TEXT": {"body": f"Error: {str(e)}"}}
                    },
                }
            ],
        }
        print("Error Response:", json.dumps(error_response, indent=2))
        return error_response
