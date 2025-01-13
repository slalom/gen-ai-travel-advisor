# AI-Assisted Travel Advisor

## Overview

This repository contains a Proof of Concept (POC) for building a Retrieval-Augmented Generation (RAG)-based Conversational AI System using AWS services to provide personalized travel recommendations. The goal is to demonstrate how companies can leverage AWS Bedrock, OpenSearch, and Lambda functions to create scalable, context-aware, and intelligent chatbots.

## Prerequisites
- An AWS account with Lambda and Bedrock Agent access.
- A RapidAPI account and an active subscription to the SkyScanner API (Signup for free account).
- Python 3.8 or higher installed locally.
- AWS CLI installed
- AWS CDK installed

## Architecture

This POC showcases a RAG-based chatbot architecture, integrating multiple AWS services:

![Architecture Diagram](/RAG-chat-bot.jpeg)

## Deployment

Follow the steps to deploy the chatbot on your personal AWS Account:

- Provide the `AWS_ACCOUNT_ID` in `.env` file
- Obtain your SkyScanner API Key from [RapidAPI](https://rapidapi.com/) and add it to the environment [variable](https://github.com/slalom/gen-ai-travel-advisor/blob/main/infra/lib/bedrock-agent-stack.ts#L41)
- Bootstrap your AWS Account `cdk bootsrap aws://<ACCOUNT_ID>/<REGION>`
- Deploy all stacks `cdk deploy --all`  

## Example Prompts
- Find me a roundtrip flight from Los Angeles (LAX) to New York (JFK), departing on 2025-02-14 and returning on 2025-02-18. Show prices in USD for 1 adult.
- How can I ensure safety while traveling abroad?

## Invoking via cURL

You can also invoke the chatbot using `cURL`. Replace `{API_GATEWAY_INVOKE_URL}` with the actual API Gateway endpoint:
```
curl -X POST "https://{API_GATEWAY_INVOKE_URL}/query" \
-H "Content-Type: application/json" \
-d '{
  "inputText": "Find me a roundtrip flight from Los Angeles (LAX) to New York (JFK), departing on 2025-02-14 and returning on 2025-02-18. Show prices in USD for 1 adult."
}'
```
