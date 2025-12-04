const profile = {
  init() {
    this.loadProfile();
    this.loadStats();
    this.setupEventListeners();
  },

  setupEventListeners() {
    document.getElementById('profileForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveProfile();
    });
  },

  loadProfile() {
    const currentUser = DB.load(STORAGE_KEYS.CURRENT_USER);
    if (!currentUser) {
      window.location.href = 'auth.html';
      return;
    }

    document.getElementById('profileAvatar').textContent = 
      currentUser.name.slice(0, 2).toUpperCase();
    document.getElementById('profileAvatar').style.background = 
      currentUser.avatarColor || 'linear-gradient(135deg, var(--accent), #06b6d4)';
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profileIdentifier').textContent = currentUser.identifier;
    
    document.getElementById('editName').value = currentUser.name;
    document.getElementById('editIdentifier').value = currentUser.identifier;
    document.getElementById('editBio').value = currentUser.about || '';
  },

  loadStats() {
    const currentUser = DB.load(STORAGE_KEYS.CURRENT_USER);
    const allGroups = DB.load(STORAGE_KEYS.GROUPS, []);
    const allMessages = DB.load(STORAGE_KEYS.MESSAGES, []);

    const friendsCount = currentUser?.friends?.length || 0;
    const groupsCount = allGroups.filter(g => 
      g.members && g.members.includes(currentUser?.id)
    ).length;
    const messagesCount = allMessages.filter(m => 
      m.from === currentUser?.id
    ).length;

    document.getElementById('friendsCount').textContent = friendsCount;
    document.getElementById('groupsCount').textContent = groupsCount;
    document.getElementById('messagesCount').textContent = messagesCount;
  },

  saveProfile() {
    const name = document.getElementById('editName').value.trim();
    const identifier = document.getElementById('editIdentifier').value.trim();
    const bio = document.getElementById('editBio').value.trim();

    if (!name || !identifier) {
      notifications.error('Name and identifier are required');
      return;
    }

    const currentUser = DB.load(STORAGE_KEYS.CURRENT_USER);
    const updatedUser = {
      ...currentUser,
      name,
      identifier,
      about: bio
    };

    // Update in users list
    const allUsers = DB.load(STORAGE_KEYS.USERS, []);
    const userIndex = allUsers.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
      allUsers[userIndex] = updatedUser;
      DB.save(STORAGE_KEYS.USERS, allUsers);
    }

    DB.save(STORAGE_KEYS.CURRENT_USER, updatedUser);

    notifications.success('Profile updated successfully!');
    this.loadProfile();
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  if (window.app && app.loadComponents) await app.loadComponents();
  profile.init();
});
