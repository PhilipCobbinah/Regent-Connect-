const settings = {
  init() {
    this.loadSettings();
    this.setupEventListeners();
  },

  loadSettings() {
    const theme = DB.load(STORAGE_KEYS.THEME, 'dark');
    const showProfile = DB.load('rc_showProfile', false);
    const readReceipts = DB.load('rc_readReceipts', false);

    const themeRadio = document.querySelector(`input[name="theme"][value="${theme}"]`);
    if (themeRadio) themeRadio.checked = true;

    const showProfileCheck = document.getElementById('optShowProfile');
    if (showProfileCheck) showProfileCheck.checked = showProfile;

    const readReceiptsCheck = document.getElementById('optReadReceipts');
    if (readReceiptsCheck) readReceiptsCheck.checked = readReceipts;
  },

  setupEventListeners() {
    // Theme change
    document.querySelectorAll('input[name="theme"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.changeTheme(e.target.value);
      });
    });

    // Privacy settings
    document.getElementById('optShowProfile')?.addEventListener('change', (e) => {
      DB.save('rc_showProfile', e.target.checked);
      notifications.success('Privacy setting updated!');
    });

    document.getElementById('optReadReceipts')?.addEventListener('change', (e) => {
      DB.save('rc_readReceipts', e.target.checked);
      notifications.success('Read receipts setting updated!');
    });

    // Export data
    document.getElementById('exportData')?.addEventListener('click', () => {
      this.exportData();
    });

    // Delete account
    document.getElementById('deleteAll')?.addEventListener('click', () => {
      this.deleteAccount();
    });
  },

  changeTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    DB.save(STORAGE_KEYS.THEME, theme);
    notifications.success('Theme updated!');
  },

  exportData() {
    const data = {
      users: DB.load(STORAGE_KEYS.USERS, []),
      messages: DB.load(STORAGE_KEYS.MESSAGES, []),
      groups: DB.load(STORAGE_KEYS.GROUPS, []),
      requests: DB.load(STORAGE_KEYS.REQUESTS, []),
      currentUser: DB.load(STORAGE_KEYS.CURRENT_USER),
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `regent-connect-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    notifications.success('Data exported successfully!');
  },

  deleteAccount() {
    if (confirm('⚠️ Delete your account and all stored data? This action cannot be undone!')) {
      if (confirm('Final confirmation: Are you absolutely sure?')) {
        DB.clear();
        notifications.success('Account deleted. Redirecting...');
        
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      }
    }
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  if (window.app && app.loadComponents) await app.loadComponents();
  settings.init();
});
