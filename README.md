# AI-Assisted Travel Advisor

## Overview

This repository contains a Proof of Concept (POC) for building a Retrieval-Augmented Generation (RAG)-based Conversational AI System using AWS services to provide personalized travel recommendations. The goal is to demonstrate how companies can leverage AWS Bedrock, OpenSearch, and Lambda functions to create scalable, context-aware, and intelligent chatbots.

## Prerequisites
- An AWS account with Lambda and Bedrock Agent access.
- A RapidAPI account and an active subscription to the SkyScanner API.
- Python 3.8 or higher installed locally.

## Architecture

This POC showcases a RAG-based chatbot architecture, integrating multiple AWS services:

![Architecture Diagram](/RAG-chat-bot.jpeg)

## Development

Deploying this code requires the `AWS_ACCOUNT_ID` to be defined.

## Example Prompts
- Find me a roundtrip flight from Los Angeles (LAX) to New York (JFK), departing on 2025-02-14 and returning on 2025-02-18. Show prices in USD for 1 adult.