import React from 'react';
import { Search, Users, UserPlus } from 'lucide-react';

interface User {
  id: string;
  name: string;
  phone: string;
  about: string;
  avatarColor: string;
}

interface ChatSidebarProps {
  users: User[];
  currentUser: User | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onUserClick: (userId: string) => void;
  onCurrentUserChange: (user: User | null) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  users,
  currentUser,
  searchQuery,
  onSearchChange,
  onUserClick,
}) => {
  return (
    <aside className="w-80 flex flex-col gap-3 p-4 bg-gradient-to-b from-white/[0.02] to-white/[0.01] rounded-xl shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#4f46e5] to-[#06b6d4] flex items-center justify-center text-white font-bold text-lg">
          RC
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Regent Connect</h1>
          <div className="text-sm text-[#94a3b8]">Campus chat</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-[#94a3b8]">
          Current: <span className="text-white">{currentUser?.name || '—'}</span>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-[#4f46e5] text-white rounded-lg text-sm hover:bg-[#4338ca]">
            Login
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-b from-white/[0.02] to-white/[0.01] rounded-xl p-2.5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={16} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-transparent border border-white/[0.04] rounded-lg text-white text-sm focus:outline-none focus:border-[#4f46e5]"
            />
          </div>
          <button
            onClick={() => onSearchChange('')}
            className="px-3 py-2 text-sm text-[#94a3b8] border border-white/[0.06] rounded-lg hover:bg-white/[0.02]"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-b from-white/[0.02] to-white/[0.01] rounded-xl p-3 flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-[#94a3b8]">Registered Users</div>
          <div className="px-2 py-1 bg-white/[0.06] rounded-full text-xs text-white">
            {users.length}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.02] cursor-pointer"
              onClick={() => onUserClick(user.id)}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ background: user.avatarColor }}
              >
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-sm truncate">
                  {user.name} {user.id === 'bot_ai' && <span className="text-xs text-[#94a3b8]">• bot</span>}
                </div>
                <div className="text-xs text-[#94a3b8] truncate">{user.about || user.phone || '—'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 px-3 py-2 bg-[#4f46e5] text-white rounded-lg text-sm hover:bg-[#4338ca] flex items-center justify-center gap-2">
          <UserPlus size={16} />
          Create Group
        </button>
        <button className="px-3 py-2 border border-white/[0.06] text-white rounded-lg text-sm hover:bg-white/[0.02] flex items-center gap-2">
          <Users size={16} />
          Groups
        </button>
      </div>
    </aside>
  );
};
