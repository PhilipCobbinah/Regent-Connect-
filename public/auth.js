/* ============================================================
   auth.js – Registration / Login / Authentication
   Handles user authentication and session management
   ============================================================ */

// Import DB if not already loaded
if (typeof DB === 'undefined') {
    console.error('DB module not loaded. Please include db.js first.');
}
if (typeof KEYS === 'undefined') {
    console.error('KEYS not loaded. Please include db.js first.');
}

const Auth = {
    /**
     * Register a new user
     * @param {Object} data - User registration data
     * @param {string} data.name - Full name
     * @param {string} data.phone - Phone number or email
     * @param {string} data.password - Password
     * @returns {Object} Result object with ok status and message
     */
    registerUser(data) {
        // Validation
        if (!data.name || data.name.trim().length < 2) {
            return { ok: false, msg: "Name must be at least 2 characters." };
        }

        if (!data.phone || data.phone.trim().length < 3) {
            return { ok: false, msg: "Phone number or email required." };
        }

        if (!data.password || data.password.length < 6) {
            return { ok: false, msg: "Password must be at least 6 characters." };
        }

        const users = DB.load(KEYS.USERS, []);

        // Check if user already exists
        const exists = users.some(u => 
            u.phone === data.phone || 
            u.name.toLowerCase() === data.name.toLowerCase()
        );

        if (exists) {
            return { ok: false, msg: "User with this phone/email or name already exists." };
        }

        // Create new user
        const newUser = {
            id: uid(),
            name: data.name.trim(),
            phone: data.phone.trim(),
            password: data.password, // In production, hash this!
            about: data.bio || '',
            avatarColor: this._randomColor(),
            avatarImage: null,
            lastSeen: Date.now(),
            online: true,
            friends: [],
            blocked: [],
            settings: {
                photoPrivacy: 'everyone',
                lastSeenPrivacy: 'everyone'
            },
            createdAt: timeNow()
        };

        users.push(newUser);
        DB.save(KEYS.USERS, users);

        // Auto-login after registration
        this.setCurrentUser(newUser);

        return { ok: true, msg: "Registration successful!", user: newUser };
    },

    /**
     * Login user
     * @param {string} identifier - Phone number, email, or username
     * @param {string} password - Password
     * @returns {Object} Result object
     */
    loginUser(identifier, password) {
        if (!identifier || !password) {
            return { ok: false, msg: "Please enter all fields." };
        }

        const users = DB.load(KEYS.USERS, []);
        const identLower = identifier.toLowerCase().trim();

        // Find user by phone, email, or name
        const found = users.find(u => 
            u.phone === identifier ||
            u.name.toLowerCase() === identLower ||
            u.id === identifier
        );

        if (!found) {
            return { ok: false, msg: "User not found." };
        }

        // Check password (in production, use proper password comparison)
        if (found.password && found.password !== password) {
            return { ok: false, msg: "Incorrect password." };
        }

        // Update online status
        found.online = true;
        found.lastSeen = Date.now();

        // Save updated user
        const updatedUsers = users.map(u => u.id === found.id ? found : u);
        DB.save(KEYS.USERS, updatedUsers);

        // Set current user
        this.setCurrentUser(found);

        return { ok: true, msg: "Login successful!", user: found };
    },

    /**
     * Get current logged-in user
     * @returns {Object|null} Current user or null
     */
    getCurrentUser() {
        return DB.load(KEYS.CURRENT_USER, null);
    },

    /**
     * Set current user
     * @param {Object} user - User object
     */
    setCurrentUser(user) {
        DB.save(KEYS.CURRENT_USER, user);
    },

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return this.getCurrentUser() !== null;
    },

    /**
     * Logout user
     * @param {boolean} redirect - Whether to redirect to login page
     */
    logoutUser(redirect = true) {
        const currentUser = this.getCurrentUser();
        
        if (currentUser) {
            // Update user's online status
            const users = DB.load(KEYS.USERS, []);
            const updatedUsers = users.map(u => {
                if (u.id === currentUser.id) {
                    u.online = false;
                    u.lastSeen = Date.now();
                }
                return u;
            });
            DB.save(KEYS.USERS, updatedUsers);
        }

        // Clear session
        DB.remove(KEYS.CURRENT_USER);
        DB.remove(KEYS.REMEMBER);

        if (redirect) {
            window.location.href = 'login.html';
        }

        return { ok: true, msg: "Logged out successfully." };
    },

    /**
     * Update current user data
     * @param {Object} updates - Fields to update
     * @returns {Object} Result object
     */
    updateCurrentUser(updates) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            return { ok: false, msg: "No user logged in." };
        }

        // Merge updates
        const updatedUser = { ...currentUser, ...updates };

        // Update in users list
        const users = DB.load(KEYS.USERS, []);
        const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
        DB.save(KEYS.USERS, updatedUsers);

        // Update current user session
        this.setCurrentUser(updatedUser);

        return { ok: true, msg: "User updated successfully.", user: updatedUser };
    },

    /**
     * Change password
     * @param {string} oldPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Object} Result object
     */
    changePassword(oldPassword, newPassword) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            return { ok: false, msg: "No user logged in." };
        }

        if (currentUser.password !== oldPassword) {
            return { ok: false, msg: "Current password is incorrect." };
        }

        if (newPassword.length < 6) {
            return { ok: false, msg: "New password must be at least 6 characters." };
        }

        return this.updateCurrentUser({ password: newPassword });
    },

    /**
     * Delete current user account
     * @returns {Object} Result object
     */
    deleteAccount() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            return { ok: false, msg: "No user logged in." };
        }

        // Remove user from all friends lists
        let users = DB.load(KEYS.USERS, []);
        users = users.map(u => {
            if (u.friends && u.friends.includes(currentUser.id)) {
                u.friends = u.friends.filter(f => f !== currentUser.id);
            }
            return u;
        });

        // Remove user
        users = users.filter(u => u.id !== currentUser.id);
        DB.save(KEYS.USERS, users);

        // Remove from groups
        let groups = DB.load(KEYS.GROUPS, []);
        groups = groups.map(g => {
            if (g.members && g.members.includes(currentUser.id)) {
                g.members = g.members.filter(m => m !== currentUser.id);
            }
            return g;
        }).filter(g => g.members.length > 0);
        DB.save(KEYS.GROUPS, groups);

        // Remove messages
        let msgs = DB.load(KEYS.MESSAGES, []);
        msgs = msgs.filter(m => m.from !== currentUser.id);
        DB.save(KEYS.MESSAGES, msgs);

        // Remove status
        let status = DB.load(KEYS.STATUS, []);
        status = status.filter(s => s.userId !== currentUser.id);
        DB.save(KEYS.STATUS, status);

        // Clear session
        this.logoutUser(false);

        return { ok: true, msg: "Account deleted successfully." };
    },

    /**
     * Check authentication and redirect if needed
     * @param {string} redirectTo - Where to redirect if not authenticated
     */
    requireAuth(redirectTo = 'login.html') {
        if (!this.isAuthenticated()) {
            window.location.href = redirectTo;
            return false;
        }
        return true;
    },

    /**
     * Set remember me
     * @param {boolean} remember - Whether to remember user
     */
    setRememberMe(remember) {
        if (remember) {
            DB.save(KEYS.REMEMBER, 'true');
        } else {
            DB.remove(KEYS.REMEMBER);
        }
    },

    /**
     * Check if remember me is set
     * @returns {boolean}
     */
    shouldRemember() {
        return DB.load(KEYS.REMEMBER) === 'true';
    },

    /**
     * Generate random avatar color
     * @private
     * @returns {string} Hex color
     */
    _randomColor() {
        const colors = [
            '#ef4444', '#f97316', '#f59e0b', '#eab308',
            '#84cc16', '#10b981', '#06b6d4', '#3b82f6',
            '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
};

// Auto-check authentication on protected pages
if (typeof window !== 'undefined') {
    // Don't check on login/register/index pages
    const publicPages = ['login.html', 'index.html', ''];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (!publicPages.includes(currentPage)) {
        document.addEventListener('DOMContentLoaded', () => {
            Auth.requireAuth();
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Auth };
}
