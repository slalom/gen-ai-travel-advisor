'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChatMessage from './components/Message';

const apiEndpoint = 'https://1qmtcxss20.execute-api.us-west-2.amazonaws.com/prod/';

interface Message {
  user: string,
  message: string,
  key: string,
}

export default function Home() {

  const sessionId = uuidv4();

  const initialMessageArray: Message[] = [];

  const [chatHistory, setChatHistory] = useState(initialMessageArray);

  const makeMessage: (a: string, b: string) => Message = (user: string, message: string) => ({
    user, message, key: uuidv4(),
  })

  const addMessage = (chatMessage: {user: 'ai'|'human', message: string }, history: Message[]) => {
    const newHistory: Message[] = [...history, makeMessage(chatMessage.user, chatMessage.message)];
    setChatHistory(newHistory);
    return newHistory;
  }

  // Call the api with the user prompt
  // Return the llm response
  const apiCall = async (message: string, history: Message[]) => {
    const response = await fetch(`${apiEndpoint}query`, {
      method: 'POST',
      headers: new Headers({
        "Access-Control-Allow-Origin": '*',
        "Content-Type": 'application/json',
        'Access-Control-Allow-Methods':'POST,GET,OPTIONS',
      }),
      body: JSON.stringify({
        inputText: message,
        sessionId,
      }),
    });
    if(response.ok) {
      addMessage({user: 'ai', message: (await response.json()).agentResponse}, history);
    }
  }

  const handleSubmit = async (formData: FormData) => {
    const message = formData.get('chatInput')?.toString() || '';
    if(message != '') {
      const newHistory = addMessage({user: 'human', message}, chatHistory);
      apiCall(message, newHistory);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-screen min-h-screen bg-gray-100 text-gray-800 p-10">
      <div className="flex flex-col flex-grow w-full max-w-xl bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="flex flex-col flex-grow h-0 p-4 overflow-auto">
          {chatHistory.map(({user, message, key}) => 
            <ChatMessage sentByMe={user=='human'} message={message} key={key}/>
          )}
        </div>
        <div className="bg-gray-300 p-4">
          <form action={handleSubmit}>
          <input name="chatInput" className="flex items-center h-10 w-full rounded px-3 text-sm" 
          type="text" placeholder="Type your message…"/>
          </form>
        </div>
      </div>
    </div>
  );
}