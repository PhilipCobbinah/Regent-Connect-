/* ============================================================
   db.js – LocalStorage Database Layer
   Everything in Regent Connect reads/writes using this file.
   ============================================================ */

const DB = {
    /**
     * Load data from localStorage
     * @param {string} key - Storage key
     * @param {*} fallback - Default value if key doesn't exist
     * @returns {*} Parsed data or fallback
     */
    load(key, fallback = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : fallback;
        } catch (e) {
            console.error("DB load error for key:", key, e);
            return fallback;
        }
    },

    /**
     * Save data to localStorage
     * @param {string} key - Storage key
     * @param {*} value - Data to save (will be JSON stringified)
     */
    save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error("DB save error for key:", key, e);
            return false;
        }
    },

    /**
     * Remove data from localStorage
     * @param {string} key - Storage key
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error("DB remove error for key:", key, e);
            return false;
        }
    },

    /**
     * Check if key exists
     * @param {string} key - Storage key
     * @returns {boolean}
     */
    exists(key) {
        return localStorage.getItem(key) !== null;
    },

    /**
     * Clear all Regent Connect data
     */
    clearAll() {
        const keys = Object.keys(KEYS);
        keys.forEach(k => {
            this.remove(KEYS[k]);
        });
    },

    /**
     * Export all data as JSON
     * @returns {Object} All app data
     */
    exportAll() {
        const data = {};
        Object.entries(KEYS).forEach(([name, key]) => {
            data[name] = this.load(key, null);
        });
        return data;
    },

    /**
     * Import data from JSON
     * @param {Object} data - Data object to import
     */
    importAll(data) {
        Object.entries(data).forEach(([name, value]) => {
            const key = KEYS[name];
            if (key && value !== null) {
                this.save(key, value);
            }
        });
    }
};

// Storage Keys
const KEYS = {
    USERS: 'rc_users',
    CURRENT_USER: 'rc_currentUser',
    MESSAGES: 'rc_msgs',
    GROUPS: 'rc_groups',
    STATUS: 'rc_status',
    REQUESTS: 'rc_reqs',
    NOTIFICATIONS: 'rc_notifs',
    SETTINGS: 'rc_settings',
    REMEMBER: 'rc_remember',
    AI_HISTORY: 'rc_ai_history',
    CALLS: 'rc_calls'
};

// Utility functions
const uid = (prefix = 'u') => prefix + Math.random().toString(36).slice(2, 9);
const timeNow = () => new Date().toISOString();

// Initialize default datasets
(function initDatabase() {
    // Users - Seed with default users if empty
    if (!DB.load(KEYS.USERS)) {
        DB.save(KEYS.USERS, [
            {
                id: uid(),
                name: 'Philip',
                phone: '+233201234567',
                password: 'demo123',
                about: 'Level 300 — CS',
                avatarColor: '#ef4444',
                friends: []
            },
            {
                id: uid(),
                name: 'Nana',
                phone: '+233245000123',
                password: 'demo123',
                about: 'Robotics Club',
                avatarColor: '#f97316',
                friends: []
            },
            {
                id: uid(),
                name: 'Akosua',
                phone: '+233244999888',
                password: 'demo123',
                about: 'STEMAID',
                avatarColor: '#06b6d4',
                friends: []
            },
            {
                id: 'bot_ai',
                name: 'Regent AI',
                phone: '',
                password: '',
                about: 'Simulated assistant',
                avatarColor: '#4f46e5',
                friends: []
            }
        ]);
    }

    // Messages
    if (!DB.load(KEYS.MESSAGES)) {
        DB.save(KEYS.MESSAGES, []);
    }

    // Groups
    if (!DB.load(KEYS.GROUPS)) {
        DB.save(KEYS.GROUPS, []);
    }

    // Status updates
    if (!DB.load(KEYS.STATUS)) {
        DB.save(KEYS.STATUS, []);
    }

    // Friend requests
    if (!DB.load(KEYS.REQUESTS)) {
        DB.save(KEYS.REQUESTS, []);
    }

    // Notifications
    if (!DB.load(KEYS.NOTIFICATIONS)) {
        DB.save(KEYS.NOTIFICATIONS, []);
    }

    // Settings
    if (!DB.load(KEYS.SETTINGS)) {
        DB.save(KEYS.SETTINGS, {
            theme: 'dark',
            notifications: true,
            sounds: true,
            readReceipts: true,
            typingIndicator: true,
            autoDownload: true,
            mediaLimit: 50
        });
    }

    // AI conversation history
    if (!DB.load(KEYS.AI_HISTORY)) {
        DB.save(KEYS.AI_HISTORY, []);
    }

    // Call history
    if (!DB.load(KEYS.CALLS)) {
        DB.save(KEYS.CALLS, []);
    }

    console.log('💾 Regent Connect Database initialized');
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DB, KEYS, uid, timeNow };
}
