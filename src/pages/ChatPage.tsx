import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Users as UsersIcon, Send } from 'lucide-react';
import { ChatSidebar } from '../components/Chat/ChatSidebar';
import { ChatArea } from '../components/Chat/ChatArea';
import { ChatHeader } from '../components/Chat/ChatHeader';
import { MessageComposer } from '../components/Chat/MessageComposer';

interface User {
  id: string;
  name: string;
  phone: string;
  about: string;
  avatarColor: string;
  friends?: string[];
}

interface Message {
  id: string;
  convId: string;
  from: string;
  text: string;
  time: string;
}

interface Conversation {
  type: 'private' | 'group';
  id: string;
  other?: string;
  groupId?: string;
}

export const ChatPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiEnabled, setAiEnabled] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const storedUsers = localStorage.getItem('rc_users');
    const storedMessages = localStorage.getItem('rc_msgs');
    const storedCurrent = localStorage.getItem('rc_currentUser');

    if (storedUsers) setUsers(JSON.parse(storedUsers));
    if (storedMessages) setMessages(JSON.parse(storedMessages));
    if (storedCurrent) setCurrentUser(JSON.parse(storedCurrent));
  };

  const startPrivateChat = (otherId: string) => {
    if (!currentUser) return;
    const convId = generateConvId(currentUser.id, otherId);
    setActiveConv({ type: 'private', id: convId, other: otherId });
  };

  const generateConvId = (u1: string, u2: string) => {
    const sorted = [u1, u2].sort();
    return `p_${sorted[0]}_${sorted[1]}`;
  };

  const sendMessage = (text: string) => {
    if (!currentUser || !activeConv || !text.trim()) return;

    const newMessage: Message = {
      id: `m${Date.now()}${Math.random()}`,
      convId: activeConv.id,
      from: currentUser.id,
      text: text.trim(),
      time: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    localStorage.setItem('rc_msgs', JSON.stringify(updatedMessages));

    if (aiEnabled) {
      setTimeout(() => simulateReply(activeConv, newMessage), 1000 + Math.random() * 1200);
    }
  };

  const simulateReply = (conv: Conversation, userMsg: Message) => {
    const replyText = generateBotReply(userMsg.text);
    const otherId = conv.type === 'private' ? conv.other : conv.groupId;

    const reply: Message = {
      id: `m${Date.now()}${Math.random()}`,
      convId: conv.id,
      from: otherId || 'bot_ai',
      text: replyText,
      time: new Date().toISOString(),
    };

    const updatedMessages = [...messages, reply];
    setMessages(updatedMessages);
    localStorage.setItem('rc_msgs', JSON.stringify(updatedMessages));
  };

  const generateBotReply = (text: string): string => {
    const low = text.toLowerCase();
    if (low.includes('hi') || low.includes('hello')) return 'Hello! How can I help you today?';
    if (low.includes('help')) return 'Try asking about campus events, robotics, or project ideas.';
    if (low.includes('project')) return 'I suggest building a small web frontend chat—use LocalStorage to store messages.';
    return `I read: "${text.length > 120 ? text.slice(0, 117) + '...' : text}" — tell me more.`;
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gradient-to-b from-[#071126] to-[#071b2a]">
      <ChatSidebar
        users={filteredUsers}
        currentUser={currentUser}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onUserClick={startPrivateChat}
        onCurrentUserChange={setCurrentUser}
      />

      <main className="flex-1 flex flex-col gap-4 p-4">
        <div className="bg-gradient-to-b from-white/[0.02] to-white/[0.01] rounded-xl p-4 shadow-lg">
          <ChatHeader
            activeConv={activeConv}
            users={users}
            currentUser={currentUser}
            aiEnabled={aiEnabled}
            onAiToggle={setAiEnabled}
          />
        </div>

        <div className="flex-1 bg-gradient-to-b from-white/[0.02] to-white/[0.01] rounded-xl shadow-lg overflow-hidden flex flex-col">
          <ChatArea
            activeConv={activeConv}
            messages={messages}
            users={users}
            currentUser={currentUser}
          />

          <MessageComposer onSend={sendMessage} disabled={!activeConv || !currentUser} />
        </div>
      </main>
    </div>
  );
};
