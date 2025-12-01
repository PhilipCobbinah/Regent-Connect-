// Simple local storage database manager

const DB = {
  // Load data from localStorage
  load(key, defaultVal = null) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultVal;
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      return defaultVal;
    }
  },

  // Save data to localStorage
  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      return false;
    }
  },

  // Remove data from localStorage
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      return false;
    }
  },

  // Clear all data
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }
};

// Storage keys
const STORAGE_KEYS = {
  USERS: 'rc_users',
  CURRENT_USER: 'rc_currentUser',
  MESSAGES: 'rc_msgs',
  GROUPS: 'rc_groups',
  REQUESTS: 'rc_reqs',
  AUTH: 'rc_auth',
  THEME: 'rc_theme',
  ACCENT: 'rc_accent'
};

// Export
window.DB = DB;
window.STORAGE_KEYS = STORAGE_KEYS;
