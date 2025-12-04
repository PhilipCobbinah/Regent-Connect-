const groups = {
  currentGroupId: null,
  messagesContainer: null,
  formElement: null,
  inputElement: null,

  initGroupChat(groupId, messagesId, formId, inputId) {
    this.currentGroupId = groupId;
    this.messagesContainer = document.getElementById(messagesId);
    this.formElement = document.getElementById(formId);
    this.inputElement = document.getElementById(inputId);

    if (!this.messagesContainer || !this.formElement || !this.inputElement) {
      console.error('Group chat elements not found');
      return;
    }

    this.loadGroupInfo();
    this.loadMessages();
    this.setupEventListeners();
    this.setupGroupAI();
  },

  setupEventListeners() {
    // Send message
    this.formElement.addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    // Members button
    document.getElementById('groupMembersBtn')?.addEventListener('click', () => {
      this.showMembersModal();
    });

    // Leave group button
    document.getElementById('leaveGroupBtn')?.addEventListener('click', () => {
      this.confirmLeaveGroup();
    });
  },

  setupGroupAI() {
    const aiForm = document.getElementById('groupAiForm');
    const aiInput = document.getElementById('groupAiInput');
    const aiConversation = document.getElementById('groupAiConversation');

    if (!aiForm || !aiInput || !aiConversation) return;

    aiForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const message = aiInput.value.trim();
      if (!message) return;

      this.handleGroupAI(message, aiConversation);
      aiInput.value = '';
    });
  },

  handleGroupAI(message, container) {
    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'ai-message user';
    userMsg.textContent = message;
    container.appendChild(userMsg);

    // Generate AI response
    setTimeout(() => {
      const botMsg = document.createElement('div');
      botMsg.className = 'ai-message bot';
      botMsg.textContent = this.generateGroupAIResponse(message);
      container.appendChild(botMsg);
      container.scrollTop = container.scrollHeight;
    }, 500);

    container.scrollTop = container.scrollHeight;
  },

  generateGroupAIResponse(message) {
    const lower = message.toLowerCase();

    if (lower.includes('poll') && lower.includes('create')) {
      this.createPoll();
      return '📊 Poll created! Check the chat for the poll widget.';
    }

    if (lower.includes('summarize') || lower.includes('summary')) {
      return '📝 Recent activity: 12 messages in the last hour. Main topics: study notes and project deadlines.';
    }

    if (lower.includes('remind')) {
      return '⏰ Reminder set! I\'ll notify the group about this.';
    }

    if (lower.includes('member')) {
      const group = this.getGroupInfo();
      return `👥 This group has ${group.members.length} members. Use the Members button to see the full list.`;
    }

    return `I can help with polls, reminders, and summaries. Try: "create poll", "summarize chat", or "remind members about X"`;
  },

  loadGroupInfo() {
    const group = this.getGroupInfo();
    const titleEl = document.getElementById('groupTitle');
    if (titleEl && group) {
      titleEl.textContent = group.name;
    }
  },

  getGroupInfo() {
    const allGroups = DB.load(STORAGE_KEYS.GROUPS, []);
    return allGroups.find(g => g.id === this.currentGroupId) || {
      id: this.currentGroupId,
      name: 'Unknown Group',
      members: []
    };
  },

  loadMessages() {
    const messages = this.getMessages();
    this.renderMessages(messages);
  },

  getMessages() {
    const allMessages = DB.load(STORAGE_KEYS.MESSAGES, []);
    const convId = `group_${this.currentGroupId}`;
    return allMessages.filter(m => m.convId === convId);
  },

  renderMessages(messages) {
    if (!this.messagesContainer) return;

    if (messages.length === 0) {
      this.messagesContainer.innerHTML = `
        <div style="text-align:center;padding:40px;color:var(--text-muted)">
          <p>👥 Welcome to the group!</p>
          <p style="font-size:14px;margin-top:8px">Be the first to send a message</p>
        </div>
      `;
      return;
    }

    const currentUser = DB.load(STORAGE_KEYS.CURRENT_USER);
    const allUsers = DB.load(STORAGE_KEYS.USERS, []);

    this.messagesContainer.innerHTML = messages.map(msg => {
      const isMine = msg.from === (currentUser?.id);
      const sender = allUsers.find(u => u.id === msg.from) || { name: 'Unknown', avatarColor: '#666' };
      
      return `
        <div class="message group ${isMine ? 'mine' : ''}">
          <div class="avatar" style="background:${sender.avatarColor}">
            ${sender.name.slice(0, 2).toUpperCase()}
          </div>
          <div class="bubble" data-sender="${sender.name}">
            <div class="text">${this.escapeHtml(msg.text)}</div>
            <div class="meta">
              <span>${this.formatTime(msg.time)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

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
      convId: `group_${this.currentGroupId}`,
      from: currentUser.id,
      text: text,
      time: new Date().toISOString()
    };

    const allMessages = DB.load(STORAGE_KEYS.MESSAGES, []);
    allMessages.push(message);
    DB.save(STORAGE_KEYS.MESSAGES, allMessages);

    this.inputElement.value = '';
    this.loadMessages();
  },

  showMembersModal() {
    const group = this.getGroupInfo();
    const allUsers = DB.load(STORAGE_KEYS.USERS, []);
    const currentUser = DB.load(STORAGE_KEYS.CURRENT_USER);

    const modal = document.createElement('div');
    modal.className = 'members-modal';
    modal.innerHTML = `
      <div class="members-modal-content">
        <div class="members-modal-header">
          <h3>Group Members (${group.members.length})</h3>
          <button id="closeMembersModal">✕</button>
        </div>
        <div class="members-list">
          ${group.members.map(memberId => {
            const member = allUsers.find(u => u.id === memberId) || { 
              id: memberId, 
              name: 'Unknown', 
              avatarColor: '#666' 
            };
            const isCurrentUser = member.id === currentUser?.id;
            
            return `
              <div class="member-item">
                <div class="avatar" style="background:${member.avatarColor}">
                  ${member.name.slice(0, 2).toUpperCase()}
                </div>
                <div class="info">
                  <div class="name">${member.name} ${isCurrentUser ? '(You)' : ''}</div>
                  <div class="role">${member.about || 'Member'}</div>
                </div>
                ${member.id === group.members[0] ? '<span class="badge">Admin</span>' : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#closeMembersModal')?.addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  },

  confirmLeaveGroup() {
    const group = this.getGroupInfo();
    
    const modal = document.createElement('div');
    modal.className = 'confirmation-modal';
    modal.innerHTML = `
      <div class="confirmation-content">
        <h3>Leave ${group.name}?</h3>
        <p>You will no longer receive messages from this group.</p>
        <div class="confirmation-actions">
          <button class="btn secondary" id="cancelLeave">Cancel</button>
          <button class="btn danger" id="confirmLeave">Leave Group</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#cancelLeave')?.addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('#confirmLeave')?.addEventListener('click', () => {
      this.leaveGroup();
      modal.remove();
    });
  },

  leaveGroup() {
    const currentUser = DB.load(STORAGE_KEYS.CURRENT_USER);
    if (!currentUser) return;

    const allGroups = DB.load(STORAGE_KEYS.GROUPS, []);
    const groupIndex = allGroups.findIndex(g => g.id === this.currentGroupId);
    
    if (groupIndex !== -1) {
      allGroups[groupIndex].members = allGroups[groupIndex].members.filter(
        m => m !== currentUser.id
      );
      DB.save(STORAGE_KEYS.GROUPS, allGroups);
    }

    notifications.success('Left group successfully');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
  },

  createPoll() {
    const pollWidget = `
      <div class="poll-widget">
        <h4>Quick Poll: When should we meet?</h4>
        <div class="poll-options">
          <div class="poll-option" onclick="this.classList.toggle('voted')">
            <span class="text">Tomorrow 3pm</span>
            <span class="votes">0 votes</span>
          </div>
          <div class="poll-option" onclick="this.classList.toggle('voted')">
            <span class="text">Friday 5pm</span>
            <span class="votes">0 votes</span>
          </div>
          <div class="poll-option" onclick="this.classList.toggle('voted')">
            <span class="text">Weekend</span>
            <span class="votes">0 votes</span>
          </div>
        </div>
        <div class="poll-footer">
          <span>Created by Group Assistant</span>
          <span>Click to vote</span>
        </div>
      </div>
    `;

    if (this.messagesContainer) {
      const pollEl = document.createElement('div');
      pollEl.innerHTML = pollWidget;
      this.messagesContainer.appendChild(pollEl);
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  },

  formatTime(isoString) {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      });
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
  },

  // Create new group
  createGroup({ name, desc, members }) {
    const currentUser = DB.load(STORAGE_KEYS.CURRENT_USER);
    if (!currentUser) {
      notifications.error('Please login first');
      return;
    }

    if (!name) {
      notifications.error('Group name is required');
      return;
    }

    // Find members by identifier
    const allUsers = DB.load(STORAGE_KEYS.USERS, []);
    const memberIds = [currentUser.id];

    members.forEach(identifier => {
      const user = allUsers.find(u => 
        u.identifier === identifier || 
        u.name.toLowerCase() === identifier.toLowerCase()
      );
      if (user && !memberIds.includes(user.id)) {
        memberIds.push(user.id);
      }
    });

    const newGroup = {
      id: this.generateId('g'),
      name,
      description: desc || '',
      members: memberIds,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id
    };

    const allGroups = DB.load(STORAGE_KEYS.GROUPS, []);
    allGroups.push(newGroup);
    DB.save(STORAGE_KEYS.GROUPS, allGroups);

    notifications.success(`Group "${name}" created successfully!`);
    return newGroup;
  },

  // Render my groups
  renderMyGroups(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const currentUser = DB.load(STORAGE_KEYS.CURRENT_USER);
    if (!currentUser) {
      element.innerHTML = '<li class="groups-empty">Please login to see your groups</li>';
      return;
    }

    const allGroups = DB.load(STORAGE_KEYS.GROUPS, []);
    const myGroups = allGroups.filter(g => 
      g.members && g.members.includes(currentUser.id)
    );

    if (myGroups.length === 0) {
      element.innerHTML = `
        <li class="groups-empty">
          <div class="groups-empty-icon">👥</div>
          <p>No groups yet</p>
          <p style="font-size:14px">Create your first group above!</p>
        </li>
      `;
      return;
    }

    element.innerHTML = myGroups.map(group => `
      <li>
        <div class="group-card" onclick="window.location.href='group-chat.html?id=${group.id}'">
          <div class="group-icon">👥</div>
          <h4>${this.escapeHtml(group.name)}</h4>
          <div class="group-meta">
            <span>👤 ${group.members.length} members</span>
            <span>📅 ${this.formatDate(group.createdAt)}</span>
          </div>
          ${group.description ? `<p class="description">${this.escapeHtml(group.description)}</p>` : ''}
        </div>
      </li>
    `).join('');
  },

  // Format date
  formatDate(isoString) {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diff = now - date;

      if (diff < 86400000) { // Less than 24 hours
        return 'Today';
      } else if (diff < 172800000) { // Less than 48 hours
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch (e) {
      return '';
    }
  },

};

window.groups = groups;

const Groups = (function() {
  'use strict';

  function createGroup(name, creatorId, members = []) {
    if (!name || !creatorId) return { ok: false, msg: 'Group name and creator required' };
    
    const groups = DB.load(KEYS.GROUPS, []);
    const group = {
      id: 'grp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      creator: creatorId,
      admins: [creatorId],
      members: [creatorId, ...members],
      created: new Date().toISOString(),
      description: '',
      inviteLink: generateInviteLink()
    };
    
    groups.push(group);
    DB.save(KEYS.GROUPS, groups);
    
    return { ok: true, msg: 'Group created successfully!', group };
  }

  function addMemberToGroup(groupId, userId, addedBy) {
    const groups = DB.load(KEYS.GROUPS, []);
    const group = groups.find(g => g.id === groupId);
    
    if (!group) return { ok: false, msg: 'Group not found' };
    
    // Check if user has privacy setting enabled
    const users = DB.load(KEYS.USERS, []);
    const user = users.find(u => u.id === userId);
    
    if (user && user.settings && user.settings.requireGroupInvite) {
      // Create a pending invite instead
      return createGroupInvite(groupId, userId, addedBy);
    }
    
    if (group.members.includes(userId)) {
      return { ok: false, msg: 'User already in group' };
    }
    
    group.members.push(userId);
    DB.save(KEYS.GROUPS, groups);
    
    return { ok: true, msg: 'Member added successfully!' };
  }

  function createGroupInvite(groupId, userId, invitedBy) {
    const invites = DB.load('group_invites', []);
    
    // Check if invite already exists
    const existing = invites.find(i => i.groupId === groupId && i.userId === userId);
    if (existing) return { ok: false, msg: 'Invite already sent' };
    
    const invite = {
      id: 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      groupId,
      userId,
      invitedBy,
      timestamp: new Date().toISOString()
    };
    
    invites.push(invite);
    DB.save('group_invites', invites);
    
    return { ok: true, msg: 'Group invite sent!', invite };
  }

  function acceptGroupInvite(inviteId) {
    const invites = DB.load('group_invites', []);
    const invite = invites.find(i => i.id === inviteId);
    
    if (!invite) return { ok: false, msg: 'Invite not found' };
    
    const groups = DB.load(KEYS.GROUPS, []);
    const group = groups.find(g => g.id === invite.groupId);
    
    if (!group) return { ok: false, msg: 'Group not found' };
    
    if (!group.members.includes(invite.userId)) {
      group.members.push(invite.userId);
      DB.save(KEYS.GROUPS, groups);
    }
    
    // Remove invite
    const updatedInvites = invites.filter(i => i.id !== inviteId);
    DB.save('group_invites', updatedInvites);
    
    return { ok: true, msg: 'Joined group successfully!', group };
  }

  function removeMemberFromGroup(groupId, userId, removedBy) {
    const groups = DB.load(KEYS.GROUPS, []);
    const group = groups.find(g => g.id === groupId);
    
    if (!group) return { ok: false, msg: 'Group not found' };
    
    // Check if remover is admin
    if (!group.admins.includes(removedBy)) {
      return { ok: false, msg: 'Only admins can remove members' };
    }
    
    // Cannot remove creator
    if (userId === group.creator) {
      return { ok: false, msg: 'Cannot remove group creator' };
    }
    
    group.members = group.members.filter(m => m !== userId);
    group.admins = group.admins.filter(a => a !== userId);
    
    DB.save(KEYS.GROUPS, groups);
    
    return { ok: true, msg: 'Member removed successfully!' };
  }

  function getAllGroups() {
    return DB.load(KEYS.GROUPS, []);
  }

  function getUserGroups(userId) {
    const groups = DB.load(KEYS.GROUPS, []);
    return groups.filter(g => g.members.includes(userId));
  }

  function generateInviteLink() {
    return 'inv_' + Math.random().toString(36).substr(2, 12);
  }

  function joinGroupByInviteLink(inviteLink, userId) {
    const groups = DB.load(KEYS.GROUPS, []);
    const group = groups.find(g => g.inviteLink === inviteLink);
    
    if (!group) return { ok: false, msg: 'Invalid invite link' };
    
    if (group.members.includes(userId)) {
      return { ok: false, msg: 'Already a member of this group' };
    }
    
    group.members.push(userId);
    DB.save(KEYS.GROUPS, groups);
    
    return { ok: true, msg: 'Joined group successfully!', group };
  }

  return {
    createGroup,
    addMemberToGroup,
    removeMemberFromGroup,
    createGroupInvite,
    acceptGroupInvite,
    getAllGroups,
    getUserGroups,
    joinGroupByInviteLink
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Groups;
}
