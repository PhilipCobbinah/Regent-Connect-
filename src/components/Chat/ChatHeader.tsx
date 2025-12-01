import React from 'react';

interface ChatHeaderProps {
  activeConv: any;
  users: any[];
  currentUser: any;
  aiEnabled: boolean;
  onAiToggle: (enabled: boolean) => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeConv,
  users,
  aiEnabled,
  onAiToggle,
}) => {
  const getTitle = () => {
    if (!activeConv) return 'No conversation selected';
    if (activeConv.type === 'private') {
      const other = users.find(u => u.id === activeConv.other);
      return other?.name || 'Unknown';
    }
    return 'Group Chat';
  };

  const getSubtitle = () => {
    if (!activeConv) return 'Select a friend or group to start chatting';
    if (activeConv.type === 'private') {
      const other = users.find(u => u.id === activeConv.other);
      return other?.about || other?.phone || '';
    }
    return 'Group conversation';
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-lg font-semibold text-white">{getTitle()}</div>
        <div className="text-sm text-[#94a3b8]">{getSubtitle()}</div>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-[#94a3b8] cursor-pointer">
          Simulate AI replies
          <input
            type="checkbox"
            checked={aiEnabled}
            onChange={(e) => onAiToggle(e.target.checked)}
            className="ml-2"
          />
        </label>
        <div className="text-sm text-[#94a3b8]">Saved locally</div>
      </div>
    </div>
  );
};
