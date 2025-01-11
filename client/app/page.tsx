import { v4 as uuidv4 } from 'uuid';

export default function Home() { 

  const LeftMessage = (props: {message: string}) =>
    <div className="flex w-full mt-2 space-x-3 max-w-xs">
      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300"></div>
      <div>
        <div className="bg-gray-300 p-3 rounded-r-lg rounded-bl-lg">
          <p className="text-sm">{props.message}</p>
        </div>
      </div>
    </div>
  
  const RightMessage = (props: {message: string}) =>
    <div className="flex w-full mt-2 space-x-3 max-w-xs ml-auto justify-end">
      <div>
        <div className="bg-blue-600 text-white p-3 rounded-l-lg rounded-br-lg">
          <p className="text-sm">{props.message}</p>
        </div>
      </div>
      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300"></div>
    </div>

  const ChatMessage = (props: {sentByMe: boolean, message: string}) => <>{
    props.sentByMe 
      ? <RightMessage message={props.message}/> 
      : <LeftMessage message={props.message}/>
  }</>

  const chatHistory = [
    {user:'human', message:'hello'},
    {user:'ai', message:'Hi! Is there anything I can help you with?'},
    {user:'human', message:'can you do my homework for me'},
    {user:'ai', message:'Yes! What do you need help with?'},
    {user:'human', message:'whats 2+2'},
    {user:'ai', message:'6'},
  ].map(o => ({...o, key: uuidv4()}));

  const window = <div className="flex flex-col items-center justify-center w-screen min-h-screen bg-gray-100 text-gray-800 p-10">
    <div className="flex flex-col flex-grow w-full max-w-xl bg-white shadow-xl rounded-lg overflow-hidden">
      <div className="flex flex-col flex-grow h-0 p-4 overflow-auto">
        {chatHistory.map(({user, message, key}) => 
          <ChatMessage sentByMe={user=='human'} message={message} key={key}/>
        )}
      </div>
      
      <div className="bg-gray-300 p-4">
        <input className="flex items-center h-10 w-full rounded px-3 text-sm" type="text" placeholder="Type your message…"/>
      </div>
    </div>
  </div>
  return window;
}
