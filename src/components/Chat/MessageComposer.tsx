import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface MessageComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({ onSend, disabled }) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSend(text);
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-white/[0.04]">
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1 px-4 py-3 bg-transparent border border-white/[0.04] rounded-full text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#4f46e5]"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="px-4 py-3 bg-[#4f46e5] text-white rounded-full hover:bg-[#4338ca] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send size={18} />
          Send
        </button>
      </div>
    </div>
  );
};
