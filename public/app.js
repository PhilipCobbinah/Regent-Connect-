/* ============================================================
   app.js – Global startup & initialization
   Main application controller and utilities
   ============================================================ */

const App = {
    /**
     * Initialize the application
     */
    init() {
        this.checkAuth();
        this.updateOnlineStatus();
        this.loadTheme();
        this.startHeartbeat();
        this.handleVisibilityChange();
        console.log('🚀 Regent Connect initialized');
    },

    /**
     * Check authentication and redirect if needed
     */
    checkAuth() {
        const currentUser = DB.load(KEYS.CURRENT_USER);
        const currentPage = window.location.pathname.split('/').pop();
        
        // Public pages that don't require auth
        const publicPages = ['index.html', 'login.html', ''];
        
        // Redirect to login if not authenticated on protected pages
        if (!currentUser && !publicPages.includes(currentPage)) {
            window.location.href = 'login.html';
            return;
        }
        
        // Redirect to dashboard if authenticated on login/index pages
        if (currentUser && (currentPage === 'login.html' || currentPage === 'index.html')) {
            window.location.href = 'dashboard.html';
            return;
        }
    },

    /**
     * Update user's online status
     */
    updateOnlineStatus() {
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (!currentUser) return;

        let users = DB.load(KEYS.USERS, []);
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        
        if (userIndex !== -1) {
            users[userIndex].online = true;
            users[userIndex].lastSeen = Date.now();
            DB.save(KEYS.USERS, users);
            
            // Update current user session
            currentUser.online = true;
            currentUser.lastSeen = Date.now();
            DB.save(KEYS.CURRENT_USER, currentUser);
        }
    },

    /**
     * Start heartbeat to update online status periodically
     */
    startHeartbeat() {
        // Update every 30 seconds
        setInterval(() => {
            this.updateOnlineStatus();
        }, 30000);
    },

    /**
     * Handle visibility change (tab focus/blur)
     */
    handleVisibilityChange() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.setUserOffline();
            } else {
                this.updateOnlineStatus();
            }
        });

        // Handle page unload
        window.addEventListener('beforeunload', () => {
            this.setUserOffline();
        });
    },

    /**
     * Set user as offline
     */
    setUserOffline() {
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (!currentUser) return;

        let users = DB.load(KEYS.USERS, []);
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        
        if (userIndex !== -1) {
            users[userIndex].online = false;
            users[userIndex].lastSeen = Date.now();
            DB.save(KEYS.USERS, users);
        }
    },

    /**
     * Load and apply theme
     */
    loadTheme() {
        const settings = DB.load(KEYS.SETTINGS, {});
        const theme = settings.theme || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
    },

    /**
     * Set theme
     * @param {string} theme - Theme name
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        const settings = DB.load(KEYS.SETTINGS, {});
        settings.theme = theme;
        DB.save(KEYS.SETTINGS, settings);
        
        if (typeof UI !== 'undefined') {
            UI.toast(`Theme changed to ${theme}`, 'success', 2000);
        }
    },

    /**
     * Load header and sidebar components
     */
    async loadComponents() {
        if (typeof ComponentLoader !== 'undefined') {
            await ComponentLoader.loadAll();
        }
    },

    /**
     * Get current user
     * @returns {Object|null} Current user
     */
    getCurrentUser() {
        return DB.load(KEYS.CURRENT_USER, null);
    },

    /**
     * Get app statistics
     * @returns {Object} App statistics
     */
    getStats() {
        const users = DB.load(KEYS.USERS, []);
        const messages = DB.load(KEYS.MESSAGES, []);
        const groups = DB.load(KEYS.GROUPS, []);
        const status = DB.load(KEYS.STATUS, []);
        const calls = DB.load(KEYS.CALLS, []);

        return {
            totalUsers: users.length,
            onlineUsers: users.filter(u => u.online).length,
            totalMessages: messages.length,
            totalGroups: groups.length,
            totalStatus: status.length,
            totalCalls: calls.length
        };
    },

    /**
     * Export all app data
     * @returns {Object} All app data
     */
    exportData() {
        return {
            users: DB.load(KEYS.USERS, []),
            messages: DB.load(KEYS.MESSAGES, []),
            groups: DB.load(KEYS.GROUPS, []),
            status: DB.load(KEYS.STATUS, []),
            requests: DB.load(KEYS.REQUESTS, []),
            notifications: DB.load(KEYS.NOTIFICATIONS, []),
            calls: DB.load(KEYS.CALLS, []),
            settings: DB.load(KEYS.SETTINGS, {}),
            aiHistory: DB.load(KEYS.AI_HISTORY, []),
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
    },

    /**
     * Import app data
     * @param {Object} data - Data to import
     * @returns {Object} Result object
     */
    importData(data) {
        try {
            if (data.users) DB.save(KEYS.USERS, data.users);
            if (data.messages) DB.save(KEYS.MESSAGES, data.messages);
            if (data.groups) DB.save(KEYS.GROUPS, data.groups);
            if (data.status) DB.save(KEYS.STATUS, data.status);
            if (data.requests) DB.save(KEYS.REQUESTS, data.requests);
            if (data.notifications) DB.save(KEYS.NOTIFICATIONS, data.notifications);
            if (data.calls) DB.save(KEYS.CALLS, data.calls);
            if (data.settings) DB.save(KEYS.SETTINGS, data.settings);
            if (data.aiHistory) DB.save(KEYS.AI_HISTORY, data.aiHistory);

            return { ok: true, msg: 'Data imported successfully' };
        } catch (error) {
            console.error('Import error:', error);
            return { ok: false, msg: 'Failed to import data' };
        }
    },

    /**
     * Clear all app data (factory reset)
     */
    clearAllData() {
        if (typeof UI !== 'undefined') {
            UI.confirm('This will delete ALL data. Continue?', {
                title: '⚠️ Factory Reset',
                confirmText: 'Delete Everything',
                cancelText: 'Cancel'
            }).then(confirmed => {
                if (confirmed) {
                    localStorage.clear();
                    window.location.href = 'index.html';
                }
            });
        } else if (confirm('This will delete ALL data. Continue?')) {
            localStorage.clear();
            window.location.href = 'index.html';
        }
    },

    /**
     * Get app version
     * @returns {string} Version string
     */
    getVersion() {
        return '1.0.0';
    },

    /**
     * Check for updates (placeholder)
     */
    checkForUpdates() {
        console.log('Current version:', this.getVersion());
        if (typeof UI !== 'undefined') {
            UI.toast('You are using the latest version', 'info');
        }
    }
};

// Auto-initialize on DOM load
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => App.init());
    } else {
        App.init();
    }
    
    // Global access
    window.App = App;
    
    // Legacy support
    window.getCurrentUser = () => App.getCurrentUser();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { App };
}
