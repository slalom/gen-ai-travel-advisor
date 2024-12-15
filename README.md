# RAG-Based Conversational AI System on AWS

## Overview

This repository contains a Proof of Concept (POC) for building a Retrieval-Augmented Generation (RAG)-based Conversational AI System using AWS services. The goal is to demonstrate how companies can leverage AWS Bedrock, OpenSearch, and Lambda functions to create scalable, context-aware, and intelligent chatbots.

## Architecture

This POC showcases a RAG-based chatbot architecture, integrating multiple AWS services:

![Architecture Diagram](/RAG-Chat-bot.jpeg)

## Development Setup

1. [Install Node.js](https://nodejs.org/en/download/prebuilt-installer)

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx aws-cdk deploy`  deploy this stack to your default AWS account/region
* `npx aws-cdk diff`    compare deployed stack with current state
* `npx aws-cdk synth`   emits the synthesized CloudFormation template