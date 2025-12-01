const chat = {
  currentChatId: null,
  messagesContainer: null,
  formElement: null,
  inputElement: null,
  templateLoaded: false,
  isTyping: false,

  async init(chatId, messagesId, formId, inputId) {
    this.currentChatId = chatId;
    this.messagesContainer = document.getElementById(messagesId);
    this.formElement = document.getElementById(formId);
    this.inputElement = document.getElementById(inputId);

    if (!this.messagesContainer || !this.formElement || !this.inputElement) {
      console.error('Chat elements not found');
      return;
    }

    await this.loadTemplate();
    this.loadMessages();
    this.setupEventListeners();
  },

  async loadTemplate() {
    try {
      const response = await fetch('components/chat-bubble.html');
      if (response.ok) {
        const html = await response.text();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const template = tempDiv.querySelector('#tplMessage');
        
        if (template && !document.getElementById('tplMessage')) {
          document.body.appendChild(template);
          this.templateLoaded = true;
        }
      }
    } catch (error) {
      console.error('Error loading chat bubble template:', error);
    }
  },

  createMessageFromTemplate(text, time, role) {
    if (!this.templateLoaded) {
      return this.createMessageFallback(text, time, role);
    }

    const template = document.getElementById('tplMessage');
    if (!template) {
      return this.createMessageFallback(text, time, role);
    }

    const clone = template.content.cloneNode(true);
    const bubble = clone.querySelector('.chat-bubble');
    
    if (bubble) {
      bubble.classList.add(role);
      const textEl = bubble.querySelector('.text');
      const timeEl = bubble.querySelector('.time');
      
      if (textEl) textEl.textContent = text;
      if (timeEl) timeEl.textContent = time;
    }

    return clone;
  },

  createMessageFallback(text, time, role) {
    const div = document.createElement('div');
    div.className = `chat-bubble ${role}`;
    div.innerHTML = `
      <div class="bubble-content">
        <p class="text">${this.escapeHtml(text)}</p>
        <time class="time">${time}</time>
      </div>
    `;
    return div;
  },

  setupEventListeners() {
    this.formElement.addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    // Handle profile button
    document.getElementById('openProfile')?.addEventListener('click', () => {
      notifications.info('Profile view coming soon!');
    });

    // Handle voice button
    document.getElementById('startVoice')?.addEventListener('click', () => {
      notifications.info('Voice chat coming soon!');
    });
  },

  loadMessages() {
    const messages = this.getMessages();
    this.renderMessages(messages);
  },

  getMessages() {
    const allMessages = DB.load(STORAGE_KEYS.MESSAGES, []);
    return allMessages.filter(m => m.convId === this.currentChatId);
  },

  renderMessages(messages) {
    if (!this.messagesContainer) return;

    if (messages.length === 0) {
      this.messagesContainer.innerHTML = `
        <div style="text-align:center;padding:40px;color:var(--text-muted)">
          <p>👋 Start the conversation!</p>
          <p style="font-size:14px;margin-top:8px">Send a message below to get started</p>
        </div>
      `;
      return;
    }

    const currentUser = DB.load(STORAGE_KEYS.CURRENT_USER);
    const allUsers = DB.load(STORAGE_KEYS.USERS, []);

    this.messagesContainer.innerHTML = '';

    messages.forEach(msg => {
      const isMine = msg.from === (currentUser?.id);
      const sender = allUsers.find(u => u.id === msg.from) || { name: 'Unknown', avatarColor: '#666' };
      
      const messageRow = document.createElement('div');
      messageRow.className = `message ${isMine ? 'mine' : ''}`;
      
      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.style.background = sender.avatarColor;
      avatar.textContent = sender.name.slice(0, 2).toUpperCase();
      
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      if (isMine) bubble.classList.add('me');
      
      bubble.innerHTML = `
        <div class="text">${this.escapeHtml(msg.text)}</div>
        <div class="meta">
          <span>${sender.name}</span>
          <span>•</span>
          <span>${this.formatTime(msg.time)}</span>
        </div>
      `;
      
      messageRow.appendChild(avatar);
      messageRow.appendChild(bubble);
      this.messagesContainer.appendChild(messageRow);
    });

    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  },

  sendMessage() {
    const text = this.inputElement.value.trim();
    if (!text) return;

    const currentUser = DB.load(STORAGE_KEYS.CURRENT_USER);
    if (!currentUser) {
      notifications.error('Please login first');
      return;
    }

    const message = {
      id: this.generateId('m'),
      convId: this.currentChatId,
      from: currentUser.id,
      text: text,
      time: new Date().toISOString()
    };

    // Save message
    const allMessages = DB.load(STORAGE_KEYS.MESSAGES, []);
    allMessages.push(message);
    DB.save(STORAGE_KEYS.MESSAGES, allMessages);

    // Clear input with animation
    this.inputElement.value = '';
    this.inputElement.style.transform = 'scale(0.98)';
    setTimeout(() => {
      this.inputElement.style.transform = 'scale(1)';
    }, 100);

    // Reload messages
    this.loadMessages();

    // Show typing indicator before reply
    if (this.currentChatId.includes('bot_ai')) {
      this.showTypingIndicator();
      setTimeout(() => {
        this.hideTypingIndicator();
        this.simulateReply(text);
      }, 1000 + Math.random() * 1000);
    }
  },

  showTypingIndicator() {
    if (this.isTyping) return;
    this.isTyping = true;
    
    const indicator = document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.className = 'message';
    indicator.innerHTML = `
      <div class="avatar" style="background:#4f46e5">AI</div>
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    
    this.messagesContainer.appendChild(indicator);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  },

  hideTypingIndicator() {
    this.isTyping = false;
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
      indicator.style.animation = 'messageSlideOut 0.2s ease-out';
      setTimeout(() => indicator.remove(), 200);
    }
  },

  simulateReply(userText) {
    // Only simulate for bot_ai conversations
    if (!this.currentChatId.includes('bot_ai')) return;

    const replyText = this.generateBotReply(userText);
    const message = {
      id: this.generateId('m'),
      convId: this.currentChatId,
      from: 'bot_ai',
      text: replyText,
      time: new Date().toISOString()
    };

    const allMessages = DB.load(STORAGE_KEYS.MESSAGES, []);
    allMessages.push(message);
    DB.save(STORAGE_KEYS.MESSAGES, allMessages);

    this.loadMessages();
  },

  generateBotReply(text) {
    const lower = text.toLowerCase();
    
    if (lower.includes('hi') || lower.includes('hello')) {
      return '👋 Hello! How can I help you today?';
    }
    
    if (lower.includes('help')) {
      return '💡 I can help you with campus information, study tips, or just chat! What would you like to know?';
    }
    
    if (lower.includes('notes')) {
      return '📚 You can share notes in group chats or request them from friends. Would you like me to help you find a study group?';
    }
    
    if (lower.includes('exam') || lower.includes('test')) {
      return '📝 Good luck with your exam! Make sure to review your notes and get enough rest. You got this! 💪';
    }
    
    if (lower.includes('thanks') || lower.includes('thank you')) {
      return '😊 You\'re welcome! Let me know if you need anything else.';
    }

    return `I read: "${text.length > 100 ? text.slice(0, 97) + '...' : text}" — How can I help you with that?`;
  },

  formatTime(isoString) {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diff = now - date;
      
      // Less than 1 minute
      if (diff < 60000) return 'Just now';
      
      // Less than 1 hour
      if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        return `${mins}m ago`;
      }
      
      // Less than 24 hours
      if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours}h ago`;
      }
      
      // Same year
      if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      return date.toLocaleDateString();
    } catch (e) {
      return '';
    }
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  generateId(prefix = 'id') {
    return prefix + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
};

// Add slide out animation
const style = document.createElement('style');
style.textContent = `
  @keyframes messageSlideOut {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(10px);
    }
  }
`;
document.head.appendChild(style);

// Export
window.chat = chat;
