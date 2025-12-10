// src/components/Chat.tsx
import { useState, useEffect } from 'react';

const Chat = ({ socket, roomId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    socket.on('chatMessage', (msg) => setMessages((prev) => [...prev, msg]));
    return () => socket.off('chatMessage');
  }, [socket]);

  const sendMessage = () => {
    socket.emit('chatMessage', { message: input, roomId });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {messages.map((msg, i) => <div key={i}>{msg.from}: {msg.message}</div>)}
      </div>
      <input value={input} onChange={(e) => setInput(e.target.value)} className="bg-gray-700 p-2" />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;
