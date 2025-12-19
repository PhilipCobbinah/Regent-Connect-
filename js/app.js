// Main application initialization

const app = {
  // Load header and sidebar components
  async loadComponents() {
    await this.loadHeader();
    await this.loadSidebar();
    this.initRegentAI();
    this.updateNotificationBadge();
  },

  // Load header
  async loadHeader() {
    const header = document.getElementById('appHeader');
    if (!header) return;

    try {
      const response = await fetch('./components/header.html');
      if (response.ok) {
        const html = await response.text();
        header.innerHTML = html;
        this.updateNotificationBadge();
      } else {
        // Fallback if component file doesn't exist
        this.loadHeaderFallback();
      }
    } catch (error) {
      console.error('Error loading header:', error);
      this.loadHeaderFallback();
    }
  },

  loadHeaderFallback() {
    const header = document.getElementById('appHeader');
    if (!header) return;

    const currentUser = DB.load(STORAGE_KEYS.CURRENT_USER);
    
    header.innerHTML = `
      <header class="site-header">
        <div class="header-left">
          <a href="dashboard.html" class="brand">
            <div class="logo-small" style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,var(--accent),#06b6d4);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px">RC</div>
            <span>Regent Connect</span>
          </a>
        </div>
        <div class="header-right">
          <a href="notifications.html" class="icon-btn" title="Notifications">🔔<span id="notifBadge" class="badge hidden">0</span></a>
          <a href="profile.html" title="Profile">Profile</a>
          <a href="settings.html" title="Settings">Settings</a>
        </div>
      </header>
    `;

    this.updateNotificationBadge();
  },

  updateNotificationBadge() {
    const badge = document.getElementById('notifBadge');
    if (!badge) return;

    const currentUser = DB.load(STORAGE_KEYS.CURRENT_USER);
    if (!currentUser) return;

    const allRequests = DB.load(STORAGE_KEYS.REQUESTS, []);
    const myRequests = allRequests.filter(r => r.to === currentUser.id);
    const count = myRequests.length;

    if (count > 0) {
      badge.textContent = count > 9 ? '9+' : count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  },

  // Load sidebar
  async loadSidebar() {
    const sidebar = document.getElementById('appSidebar');
    if (!sidebar) return;

    const currentPage = window.location.pathname.split('/').pop();

    try {
      const response = await fetch('components/sidebar.html');
      if (response.ok) {
        const html = await response.text();
        sidebar.innerHTML = html;
        
        // Add click handlers and active state
        sidebar.querySelectorAll('.nav-item').forEach(item => {
          const page = item.getAttribute('data-page');
          if (page === currentPage || 
              (page === 'chat.html' && currentPage === 'chat-page.html') ||
              (page === 'groups.html' && currentPage === 'group-chat.html')) {
            item.classList.add('active');
          }
          
          item.addEventListener('click', () => {
            window.location.href = page;
          });
        });
      } else {
        this.loadSidebarFallback();
      }
    } catch (error) {
      console.error('Error loading sidebar:', error);
      this.loadSidebarFallback();
    }
  },

  loadSidebarFallback() {
    const sidebar = document.getElementById('appSidebar');
    if (!sidebar) return;

    const currentPage = window.location.pathname.split('/').pop();

    sidebar.innerHTML = `
      <div class="nav-item ${currentPage === 'dashboard.html' ? 'active' : ''}" onclick="window.location.href='dashboard.html'">
        <span>📊</span> Dashboard
      </div>
      <div class="nav-item ${currentPage === 'chat.html' || currentPage === 'chat-page.html' ? 'active' : ''}" onclick="window.location.href='chat.html'">
        <span>💬</span> Chat
      </div>
      <div class="nav-item ${currentPage === 'friends.html' ? 'active' : ''}" onclick="window.location.href='friends.html'">
        <span>👥</span> Friends
      </div>
      <div class="nav-item ${currentPage === 'groups.html' ? 'active' : ''}" onclick="window.location.href='groups.html'">
        <span>🔗</span> Groups
      </div>
      <div class="nav-item ${currentPage === 'notifications.html' ? 'active' : ''}" onclick="window.location.href='notifications.html'">
        <span>🔔</span> Notifications
      </div>
      <div class="nav-item ${currentPage === 'profile.html' ? 'active' : ''}" onclick="window.location.href='profile.html'">
        <span>👤</span> Profile
      </div>
      <div class="nav-item" onclick="window.location.href='settings.html'">
        <span>⚙️</span> Settings
      </div>
    `;
  },

  // Initialize RegentAI
  initRegentAI() {
    const aiForm = document.getElementById('aiForm');
    const aiInput = document.getElementById('aiInput');
    const aiConversation = document.getElementById('aiConversation');
    const closeBtn = document.getElementById('closeRegentAI');
    const widget = document.getElementById('regentAI');

    if (!aiForm || !widget) return;

    // Handle close
    closeBtn?.addEventListener('click', () => {
      widget.setAttribute('aria-hidden', 'true');
    });

    // Handle form submit
    aiForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const message = aiInput.value.trim();
      if (!message) return;

      this.handleAIMessage(message, aiConversation);
      aiInput.value = '';
    });
  },

  // Handle AI messages
  handleAIMessage(message, container) {
    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'ai-message user';
    userMsg.textContent = message;
    container.appendChild(userMsg);

    // Generate AI response
    setTimeout(() => {
      const botMsg = document.createElement('div');
      botMsg.className = 'ai-message bot';
      botMsg.textContent = this.generateAIResponse(message);
      container.appendChild(botMsg);
      container.scrollTop = container.scrollHeight;
    }, 500);

    container.scrollTop = container.scrollHeight;
  },

  // Generate AI response
  generateAIResponse(message) {
    const lower = message.toLowerCase();
    
    if (lower.includes('hello') || lower.includes('hi')) {
      return '👋 Hello! How can I help you today?';
    }
    
    if (lower.includes('find') || lower.includes('search')) {
      return '🔍 You can search for users in the chat page. Use the search bar at the top!';
    }
    
    if (lower.includes('group') && lower.includes('create')) {
      return '👥 To create a group, go to the Groups page and click "Create Group" button!';
    }
    
    if (lower.includes('friend')) {
      return '👫 You can add friends by clicking on users and sending them a friend request!';
    }
    
    if (lower.includes('help')) {
      return '💡 I can help you with:\n- Finding users\n- Creating groups\n- Adding friends\n- Navigating the app\nWhat would you like to know?';
    }

    return `🤔 I understand you said: "${message}". Try asking about finding users, creating groups, or getting help!`;
  },

  // Logout
  logout() {
    if (confirm('Are you sure you want to logout?')) {
      DB.remove(STORAGE_KEYS.AUTH);
      DB.remove(STORAGE_KEYS.CURRENT_USER);
      window.location.href = 'auth.html';
    }
  }
};

// Check auth on load
document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop();
  
  if (currentPage !== 'auth.html' && currentPage !== '' && currentPage !== 'index.html') {
    const auth = DB.load(STORAGE_KEYS.AUTH);
    if (!auth) {
      window.location.href = 'auth.html';
    }
  }
});

// Export
window.app = app;
