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
  
  export default ChatMessage;