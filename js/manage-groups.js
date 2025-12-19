const manageGroups = {
  init() {
    this.loadGroups();
    this.setupEventListeners();
  },

  setupEventListeners() {
    document.getElementById('createGroupBtn')?.addEventListener('click', () => {
      this.openCreateModal();
    });
  },

  loadGroups() {
    const container = document.getElementById('groupsGrid');
    if (!container) return;

    const allGroups = DB.load(STORAGE_KEYS.GROUPS, []);
    const currentUser = DB.load(STORAGE_KEYS.CURRENT_USER);
    
    const userGroups = allGroups.filter(g => 
      g.members && g.members.includes(currentUser?.id)
    );

    if (userGroups.length === 0) {
      container.innerHTML = `
        <div class="empty-state card">
          <p>👥 No groups yet</p>
          <p class="muted">Create a group to start collaborating</p>
        </div>
      `;
      return;
    }

    container.innerHTML = userGroups.map(group => `
      <div class="group-card card" onclick="window.location.href='group-chat.html?id=${group.id}'">
        <div class="group-icon">👥</div>
        <h3>${this.escapeHtml(group.name)}</h3>
        <p class="muted">${group.members.length} members</p>
        <p class="description">${this.escapeHtml(group.description || 'No description')}</p>
      </div>
    `).join('');
  },

  openCreateModal() {
    const modal = document.getElementById('createGroupModal');
    if (!modal) return;

    modal.hidden = false;
    this.populateMembersList();

    const form = document.getElementById('createGroupForm');
    const cancel = document.getElementById('cancelCreate');

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.createGroup();
    }, { once: true });

    cancel?.addEventListener('click', () => {
      modal.hidden = true;
      form?.reset();
    }, { once: true });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.hidden = true;
        form?.reset();
      }
    });
  },

  populateMembersList() {
    const container = document.getElementById('membersCheckboxes');
    if (!container) return;

    const allUsers = DB.load(STORAGE_KEYS.USERS, []);
    const currentUser = DB.load(STORAGE_KEYS.CURRENT_USER);

    const otherUsers = allUsers.filter(u => u.id !== currentUser?.id);

    container.innerHTML = otherUsers.map(user => `
      <label class="checkbox-item">
        <input type="checkbox" value="${user.id}">
        <span>${this.escapeHtml(user.name)}</span>
      </label>
    `).join('');
  },

  createGroup() {
    const nameInput = document.getElementById('groupName');
    const descInput = document.getElementById('groupDesc');
    const checkboxes = document.querySelectorAll('#membersCheckboxes input:checked');

    const name = nameInput?.value.trim();
    const description = descInput?.value.trim();
    const selectedMembers = Array.from(checkboxes).map(cb => cb.value);

    if (!name) {
      notifications.error('Group name is required');
      return;
    }

    if (selectedMembers.length === 0) {
      notifications.error('Please add at least one member');
      return;
    }

    const currentUser = DB.load(STORAGE_KEYS.CURRENT_USER);
    const newGroup = {
      id: this.generateId('g'),
      name,
      description,
      members: [currentUser.id, ...selectedMembers],
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id
    };

    const allGroups = DB.load(STORAGE_KEYS.GROUPS, []);
    allGroups.push(newGroup);
    DB.save(STORAGE_KEYS.GROUPS, allGroups);

    document.getElementById('createGroupModal').hidden = true;
    document.getElementById('createGroupForm')?.reset();
    
    notifications.success('Group created successfully!');
    this.loadGroups();
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

document.addEventListener('DOMContentLoaded', async () => {
  if (window.app && app.loadComponents) await app.loadComponents();
  manageGroups.init();
});
