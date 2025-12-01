// Notification system

const notifications = {
  show(message, type = 'info', duration = 3000) {
    // Remove existing notification
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();

    // Create notification
    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    
    const colors = {
      info: 'linear-gradient(135deg, var(--accent), #3b82f6)',
      success: 'linear-gradient(135deg, var(--success), #059669)',
      error: 'linear-gradient(135deg, var(--error), #dc2626)',
      warning: 'linear-gradient(135deg, #f59e0b, #d97706)'
    };

    const icons = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };

    toast.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      padding: 16px 24px;
      background: ${colors[type] || colors.info};
      color: white;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      animation: slideInRight 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      max-width: 400px;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 12px;
    `;

    toast.innerHTML = `
      <span style="font-size: 20px;">${icons[type]}</span>
      <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Auto remove
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success(message) {
    this.show(message, 'success');
  },

  error(message) {
    this.show(message, 'error');
  },

  warning(message) {
    this.show(message, 'warning');
  },

  info(message) {
    this.show(message, 'info');
  }
};

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideOutRight {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100px);
    }
  }
`;
document.head.appendChild(style);

// Notifications page functionality
const notificationsPage = {
  render(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const currentUser = DB.load(STORAGE_KEYS.CURRENT_USER);
    if (!currentUser) {
      element.innerHTML = '<li class="empty-notifications">Please login to see notifications</li>';
      return;
    }

    const allRequests = DB.load(STORAGE_KEYS.REQUESTS, []);
    const myRequests = allRequests.filter(r => r.to === currentUser.id);
    const allUsers = DB.load(STORAGE_KEYS.USERS, []);

    if (myRequests.length === 0) {
      element.innerHTML = `
        <li class="empty-notifications">
          <div class="empty-notifications-icon">🔔</div>
          <p>No new notifications</p>
          <p style="font-size:14px">You're all caught up!</p>
        </li>
      `;
      return;
    }

    element.innerHTML = myRequests.map(request => {
      const sender = allUsers.find(u => u.id === request.from);
      if (!sender) return '';

      return `
        <li class="notif-item unread" data-request-id="${request.from}">
          <div class="avatar" style="background:${sender.avatarColor}">
            ${sender.name.slice(0, 2).toUpperCase()}
          </div>
          <div class="content">
            <div class="message">
              <strong>${this.escapeHtml(sender.name)}</strong> sent you a friend request
            </div>
            <div class="time">${this.formatTime(request.time)}</div>
          </div>
          <div class="actions">
            <button class="btn-accept" onclick="notificationsPage.acceptRequest('${sender.id}')">
              Accept
            </button>
            <button class="btn-reject" onclick="notificationsPage.rejectRequest('${sender.id}')">
              Decline
            </button>
          </div>
        </li>
      `;
    }).join('');
  },

  acceptRequest(fromId) {
    const currentUser = DB.load(STORAGE_KEYS.CURRENT_USER);
    if (!currentUser) return;

    const allUsers = DB.load(STORAGE_KEYS.USERS, []);
    const fromUser = allUsers.find(u => u.id === fromId);
    const currentUserData = allUsers.find(u => u.id === currentUser.id);

    if (!fromUser || !currentUserData) return;

    // Add to friends
    if (!fromUser.friends) fromUser.friends = [];
    if (!currentUserData.friends) currentUserData.friends = [];

    if (!fromUser.friends.includes(currentUser.id)) {
      fromUser.friends.push(currentUser.id);
    }
    if (!currentUserData.friends.includes(fromId)) {
      currentUserData.friends.push(fromId);
    }

    // Update users
    const updatedUsers = allUsers.map(u => 
      u.id === fromUser.id ? fromUser : 
      u.id === currentUserData.id ? currentUserData : u
    );
    DB.save(STORAGE_KEYS.USERS, updatedUsers);
    DB.save(STORAGE_KEYS.CURRENT_USER, currentUserData);

    // Remove request
    const allRequests = DB.load(STORAGE_KEYS.REQUESTS, []);
    const filteredRequests = allRequests.filter(r => 
      !(r.from === fromId && r.to === currentUser.id)
    );
    DB.save(STORAGE_KEYS.REQUESTS, filteredRequests);

    notifications.success(`You are now friends with ${fromUser.name}!`);
    this.render('notifList');
  },

  rejectRequest(fromId) {
    const currentUser = DB.load(STORAGE_KEYS.CURRENT_USER);
    if (!currentUser) return;

    const allRequests = DB.load(STORAGE_KEYS.REQUESTS, []);
    const filteredRequests = allRequests.filter(r => 
      !(r.from === fromId && r.to === currentUser.id)
    );
    DB.save(STORAGE_KEYS.REQUESTS, filteredRequests);

    notifications.info('Friend request declined');
    this.render('notifList');
  },

  formatTime(isoString) {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diff = now - date;

      if (diff < 60000) return 'Just now';
      if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        return `${mins} minute${mins > 1 ? 's' : ''} ago`;
      }
      if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      }
      if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days} day${days > 1 ? 's' : ''} ago`;
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Export
window.notifications = notifications;
window.notificationsPage = notificationsPage;
