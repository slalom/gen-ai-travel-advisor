'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChatMessage from './components/Message';

export default function Home() { 

  const [chatHistory, setChatHistory] = useState([{user:'ai', message:'Hi! Is there anything I can help you with?', key: uuidv4()}]);

  const addMessage = (chatMessage: {user: 'ai'|'human', message: string }, history: any[]) => {
    const newHistory = [...history, {...chatMessage, key: uuidv4()}];
    setChatHistory(newHistory);
    return newHistory;
  }

  // Call the api with the user prompt
  // Return the llm response
  const apiCall = async (message: string, history: any[]) => {
    // Stub, waits a moment, then replies with a default message
    await new Promise(resolve => setTimeout(resolve, 2));
    addMessage({user: 'ai', message:`You said: "${message}"`}, history)

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
