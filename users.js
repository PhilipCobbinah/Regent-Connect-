/* ============================================================
   users.js – User management, friends, block list
   Handles user profiles, friend requests, and blocking
   ============================================================ */

// Import dependencies (ensure DB and Auth are loaded first)
if (typeof DB === 'undefined') {
    console.error('DB module not loaded. Please include db.js first.');
}
if (typeof KEYS === 'undefined') {
    console.error('KEYS not loaded. Please include db.js first.');
}

const Users = {
    /**
     * Get user by ID
     * @param {string} id - User ID
     * @returns {Object|null} User object or null
     */
    getUserById(id) {
        const users = DB.load(KEYS.USERS, []);
        return users.find(u => u.id === id) || null;
    },

    /**
     * Get all users
     * @returns {Array} Array of users
     */
    getAllUsers() {
        return DB.load(KEYS.USERS, []);
    },

    /**
     * Search users by name or phone
     * @param {string} query - Search query
     * @returns {Array} Filtered users
     */
    searchUsers(query) {
        const users = this.getAllUsers();
        const searchLower = query.toLowerCase().trim();
        
        return users.filter(u => 
            u.name.toLowerCase().includes(searchLower) ||
            (u.phone && u.phone.includes(query)) ||
            (u.about && u.about.toLowerCase().includes(searchLower))
        );
    },

    /**
     * Update user profile
     * @param {string} userId - User ID to update
     * @param {Object} data - Profile data to update
     * @returns {Object} Result object
     */
    updateUserProfile(userId, data) {
        let users = DB.load(KEYS.USERS, []);
        const index = users.findIndex(u => u.id === userId);
        
        if (index === -1) {
            return { ok: false, msg: "User not found" };
        }

        // Merge updates
        users[index] = { ...users[index], ...data, id: userId }; // Preserve ID
        
        DB.save(KEYS.USERS, users);

        // Update current user if it's them
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (currentUser && currentUser.id === userId) {
            DB.save(KEYS.CURRENT_USER, users[index]);
        }

        return { ok: true, msg: "Profile updated", user: users[index] };
    },

    /**
     * Get user's friends
     * @param {string} userId - User ID
     * @returns {Array} Array of friend user objects
     */
    getFriends(userId) {
        const user = this.getUserById(userId);
        if (!user || !user.friends) return [];

        const users = this.getAllUsers();
        return user.friends
            .map(friendId => users.find(u => u.id === friendId))
            .filter(Boolean); // Remove null/undefined
    },

    /**
     * Check if two users are friends
     * @param {string} userId1 - First user ID
     * @param {string} userId2 - Second user ID
     * @returns {boolean}
     */
    areFriends(userId1, userId2) {
        const user1 = this.getUserById(userId1);
        if (!user1 || !user1.friends) return false;
        return user1.friends.includes(userId2);
    },

    /**
     * Send friend request
     * @param {string} fromId - Sender ID
     * @param {string} toId - Receiver ID
     * @returns {Object} Result object
     */
    sendFriendRequest(fromId, toId) {
        // Validation
        if (fromId === toId) {
            return { ok: false, msg: "Cannot friend yourself" };
        }

        if (this.areFriends(fromId, toId)) {
            return { ok: false, msg: "Already friends" };
        }

        // Check if request already exists
        let reqs = DB.load(KEYS.REQUESTS, []);
        const exists = reqs.find(r => r.from === fromId && r.to === toId);
        if (exists) {
            return { ok: false, msg: "Request already sent" };
        }

        // Create request
        const request = {
            id: uid('req'),
            from: fromId,
            to: toId,
            time: timeNow()
        };

        reqs.push(request);
        DB.save(KEYS.REQUESTS, reqs);

        // Create notification
        this._createNotification({
            type: 'friend_request',
            from: fromId,
            to: toId,
            message: `${this.getUserById(fromId)?.name || 'Someone'} sent you a friend request`,
            time: timeNow()
        });

        return { ok: true, msg: "Friend request sent" };
    },

    /**
     * Accept friend request
     * @param {string} requestId - Request ID
     * @returns {Object} Result object
     */
    acceptFriendRequest(requestId) {
        let reqs = DB.load(KEYS.REQUESTS, []);
        const request = reqs.find(r => r.id === requestId);
        
        if (!request) {
            return { ok: false, msg: "Request not found" };
        }

        // Add to friends lists
        let users = DB.load(KEYS.USERS, []);
        const fromUser = users.find(u => u.id === request.from);
        const toUser = users.find(u => u.id === request.to);

        if (!fromUser || !toUser) {
            return { ok: false, msg: "Users not found" };
        }

        // Initialize friends arrays
        if (!fromUser.friends) fromUser.friends = [];
        if (!toUser.friends) toUser.friends = [];

        // Add to each other's friends
        if (!fromUser.friends.includes(toUser.id)) {
            fromUser.friends.push(toUser.id);
        }
        if (!toUser.friends.includes(fromUser.id)) {
            toUser.friends.push(fromUser.id);
        }

        // Update users
        users = users.map(u => 
            u.id === fromUser.id ? fromUser : 
            u.id === toUser.id ? toUser : u
        );
        DB.save(KEYS.USERS, users);

        // Update current user if affected
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (currentUser) {
            if (currentUser.id === fromUser.id) {
                DB.save(KEYS.CURRENT_USER, fromUser);
            } else if (currentUser.id === toUser.id) {
                DB.save(KEYS.CURRENT_USER, toUser);
            }
        }

        // Remove request
        reqs = reqs.filter(r => r.id !== requestId);
        DB.save(KEYS.REQUESTS, reqs);

        return { ok: true, msg: "Friend request accepted", fromUser, toUser };
    },

    /**
     * Reject friend request
     * @param {string} requestId - Request ID
     * @returns {Object} Result object
     */
    rejectFriendRequest(requestId) {
        let reqs = DB.load(KEYS.REQUESTS, []);
        const request = reqs.find(r => r.id === requestId);
        
        if (!request) {
            return { ok: false, msg: "Request not found" };
        }

        reqs = reqs.filter(r => r.id !== requestId);
        DB.save(KEYS.REQUESTS, reqs);

        return { ok: true, msg: "Friend request rejected" };
    },

    /**
     * Remove friend
     * @param {string} userId - Current user ID
     * @param {string} friendId - Friend to remove
     * @returns {Object} Result object
     */
    removeFriend(userId, friendId) {
        let users = DB.load(KEYS.USERS, []);
        const user = users.find(u => u.id === userId);
        const friend = users.find(u => u.id === friendId);

        if (!user || !friend) {
            return { ok: false, msg: "Users not found" };
        }

        // Remove from both friends lists
        if (user.friends) {
            user.friends = user.friends.filter(id => id !== friendId);
        }
        if (friend.friends) {
            friend.friends = friend.friends.filter(id => id !== userId);
        }

        // Update users
        users = users.map(u => 
            u.id === user.id ? user : 
            u.id === friend.id ? friend : u
        );
        DB.save(KEYS.USERS, users);

        // Update current user if affected
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (currentUser && currentUser.id === userId) {
            DB.save(KEYS.CURRENT_USER, user);
        }

        return { ok: true, msg: "Friend removed" };
    },

    /**
     * Block user
     * @param {string} blockerId - User doing the blocking
     * @param {string} victimId - User being blocked
     * @returns {Object} Result object
     */
    blockUser(blockerId, victimId) {
        if (blockerId === victimId) {
            return { ok: false, msg: "Cannot block yourself" };
        }

        let users = DB.load(KEYS.USERS, []);
        const blocker = users.find(u => u.id === blockerId);

        if (!blocker) {
            return { ok: false, msg: "User not found" };
        }

        // Initialize blocked array
        if (!blocker.blocked) blocker.blocked = [];

        // Check if already blocked
        if (blocker.blocked.includes(victimId)) {
            return { ok: false, msg: "User already blocked" };
        }

        // Add to blocked list
        blocker.blocked.push(victimId);

        // Remove from friends if they are friends
        if (blocker.friends) {
            blocker.friends = blocker.friends.filter(id => id !== victimId);
        }

        // Update users
        users = users.map(u => u.id === blockerId ? blocker : u);
        DB.save(KEYS.USERS, users);

        // Update current user
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (currentUser && currentUser.id === blockerId) {
            DB.save(KEYS.CURRENT_USER, blocker);
        }

        return { ok: true, msg: "User blocked" };
    },

    /**
     * Unblock user
     * @param {string} blockerId - User doing the unblocking
     * @param {string} victimId - User being unblocked
     * @returns {Object} Result object
     */
    unblockUser(blockerId, victimId) {
        let users = DB.load(KEYS.USERS, []);
        const blocker = users.find(u => u.id === blockerId);

        if (!blocker || !blocker.blocked) {
            return { ok: false, msg: "User not found or no blocked list" };
        }

        // Remove from blocked list
        blocker.blocked = blocker.blocked.filter(id => id !== victimId);

        // Update users
        users = users.map(u => u.id === blockerId ? blocker : u);
        DB.save(KEYS.USERS, users);

        // Update current user
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (currentUser && currentUser.id === blockerId) {
            DB.save(KEYS.CURRENT_USER, blocker);
        }

        return { ok: true, msg: "User unblocked" };
    },

    /**
     * Check if user is blocked
     * @param {string} blockerId - User who might have blocked
     * @param {string} victimId - User who might be blocked
     * @returns {boolean}
     */
    isBlocked(blockerId, victimId) {
        const blocker = this.getUserById(blockerId);
        if (!blocker || !blocker.blocked) return false;
        return blocker.blocked.includes(victimId);
    },

    /**
     * Get blocked users
     * @param {string} userId - User ID
     * @returns {Array} Array of blocked user objects
     */
    getBlockedUsers(userId) {
        const user = this.getUserById(userId);
        if (!user || !user.blocked) return [];

        const users = this.getAllUsers();
        return user.blocked
            .map(blockedId => users.find(u => u.id === blockedId))
            .filter(Boolean);
    },

    /**
     * Get pending friend requests for user
     * @param {string} userId - User ID
     * @returns {Array} Array of requests
     */
    getPendingRequests(userId) {
        const reqs = DB.load(KEYS.REQUESTS, []);
        return reqs.filter(r => r.to === userId);
    },

    /**
     * Get sent friend requests from user
     * @param {string} userId - User ID
     * @returns {Array} Array of requests
     */
    getSentRequests(userId) {
        const reqs = DB.load(KEYS.REQUESTS, []);
        return reqs.filter(r => r.from === userId);
    },

    /**
     * Create notification (private helper)
     * @private
     */
    _createNotification(data) {
        let notifs = DB.load(KEYS.NOTIFICATIONS, []);
        const notification = {
            id: uid('notif'),
            read: false,
            ...data
        };
        notifs.push(notification);
        DB.save(KEYS.NOTIFICATIONS, notifs);
    },

    /**
     * Update user online status
     * @param {string} userId - User ID
     * @param {boolean} online - Online status
     */
    updateOnlineStatus(userId, online) {
        let users = DB.load(KEYS.USERS, []);
        const user = users.find(u => u.id === userId);
        
        if (user) {
            user.online = online;
            user.lastSeen = Date.now();
            
            users = users.map(u => u.id === userId ? user : u);
            DB.save(KEYS.USERS, users);
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Users };
}
