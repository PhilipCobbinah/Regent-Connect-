import React, { useEffect, useRef } from 'react';

interface Message {
  id: string;
  convId: string;
  from: string;
  text: string;
  time: string;
}

interface ChatAreaProps {
  activeConv: any;
  messages: Message[];
  users: any[];
  currentUser: any;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  activeConv,
  messages,
  users,
  currentUser,
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeConv || !currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#94a3b8]">
        Select a conversation to start chatting
      </div>
    );
  }

  const conversationMessages = messages
    .filter(m => m.convId === activeConv.id)
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {conversationMessages.map((msg) => {
        const isMine = msg.from === currentUser.id;
        const sender = users.find(u => u.id === msg.from);

        return (
          <div
            key={msg.id}
            className={`flex items-end gap-3 ${isMine ? 'justify-end' : ''}`}
          >
            <div
              className={`max-w-[66%] p-3 rounded-2xl shadow-lg ${
                isMine
                  ? 'bg-gradient-to-b from-[#4f46e5] to-[#3b82f6] text-white'
                  : 'bg-gradient-to-b from-white/[0.02] to-white/[0.01] text-white'
              }`}
              style={{ animation: 'pop 0.28s cubic-bezier(0.2, 0.9, 0.2, 1)' }}
            >
              <div className="leading-relaxed">{msg.text}</div>
              <div className={`text-xs mt-2 ${isMine ? 'text-white/70' : 'text-[#94a3b8]'}`}>
                {sender?.name} • {new Date(msg.time).toLocaleTimeString()}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={chatEndRef} />
    </div>
  );
};
