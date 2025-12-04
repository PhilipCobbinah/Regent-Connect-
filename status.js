/* ============================================================
   status.js – 24-hour disappearing stories
   Handles status updates that expire after 24 hours
   ============================================================ */

// Import dependencies
if (typeof DB === 'undefined') {
    console.error('DB module not loaded. Please include db.js first.');
}
if (typeof KEYS === 'undefined') {
    console.error('KEYS not loaded. Please include db.js first.');
}

const Status = {
    /**
     * Add a new status
     * @param {Object} data - Status data
     * @param {string} data.type - Status type (text, image, video)
     * @param {string} data.text - Status text content
     * @param {string} data.file - File data URL for image/video
     * @param {string} data.backgroundColor - Background color for text status
     * @returns {Object} Result object with status
     */
    addStatus(data) {
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (!currentUser) {
            return { ok: false, msg: "No user logged in" };
        }

        // Validation
        if (!data.type) {
            return { ok: false, msg: "Status type required" };
        }

        if (data.type === 'text' && (!data.text || !data.text.trim())) {
            return { ok: false, msg: "Text status cannot be empty" };
        }

        if ((data.type === 'image' || data.type === 'video') && !data.file) {
            return { ok: false, msg: "File required for image/video status" };
        }

        // Create status object
        const status = {
            id: uid('status'),
            userId: currentUser.id,
            type: data.type,
            text: data.text || '',
            file: data.file || null,
            backgroundColor: data.backgroundColor || '#4f46e5',
            views: [],
            reactions: [],
            timestamp: Date.now(),
            time: timeNow()
        };

        // Save status
        let statuses = DB.load(KEYS.STATUS, []);
        statuses.push(status);
        DB.save(KEYS.STATUS, statuses);

        // Clean old statuses
        this.cleanStatuses();

        return { ok: true, msg: "Status added", status };
    },

    /**
     * Get status by ID
     * @param {string} statusId - Status ID
     * @returns {Object|null} Status object or null
     */
    getStatusById(statusId) {
        const statuses = DB.load(KEYS.STATUS, []);
        return statuses.find(s => s.id === statusId) || null;
    },

    /**
     * Get all statuses
     * @param {boolean} includeExpired - Include expired statuses
     * @returns {Array} Array of statuses
     */
    getAllStatuses(includeExpired = false) {
        let statuses = DB.load(KEYS.STATUS, []);
        
        if (!includeExpired) {
            statuses = this._filterExpired(statuses);
        }
        
        return statuses.sort((a, b) => b.timestamp - a.timestamp);
    },

    /**
     * Get user's statuses
     * @param {string} userId - User ID
     * @param {boolean} includeExpired - Include expired statuses
     * @returns {Array} Array of statuses
     */
    getUserStatuses(userId, includeExpired = false) {
        const statuses = this.getAllStatuses(includeExpired);
        return statuses.filter(s => s.userId === userId);
    },

    /**
     * Get statuses from friends
     * @param {string} userId - Current user ID
     * @returns {Array} Array of friend statuses grouped by user
     */
    getFriendStatuses(userId) {
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (!currentUser) return [];

        const users = DB.load(KEYS.USERS, []);
        const friends = currentUser.friends || [];
        const statuses = this.getAllStatuses(false);

        // Group statuses by user
        const groupedStatuses = {};
        statuses.forEach(s => {
            if (friends.includes(s.userId) || s.userId === userId) {
                if (!groupedStatuses[s.userId]) {
                    const user = users.find(u => u.id === s.userId);
                    groupedStatuses[s.userId] = {
                        userId: s.userId,
                        userName: user?.name || 'Unknown',
                        avatarColor: user?.avatarColor || '#6ee7b7',
                        statuses: []
                    };
                }
                groupedStatuses[s.userId].statuses.push(s);
            }
        });

        // Convert to array and sort
        return Object.values(groupedStatuses)
            .map(group => ({
                ...group,
                latestTime: Math.max(...group.statuses.map(s => s.timestamp))
            }))
            .sort((a, b) => b.latestTime - a.latestTime);
    },

    /**
     * View a status (mark as viewed)
     * @param {string} statusId - Status ID
     * @returns {Object} Result object
     */
    viewStatus(statusId) {
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (!currentUser) {
            return { ok: false, msg: "No user logged in" };
        }

        let statuses = DB.load(KEYS.STATUS, []);
        const statusIndex = statuses.findIndex(s => s.id === statusId);

        if (statusIndex === -1) {
            return { ok: false, msg: "Status not found" };
        }

        // Add view if not already viewed
        if (!statuses[statusIndex].views) {
            statuses[statusIndex].views = [];
        }

        if (!statuses[statusIndex].views.includes(currentUser.id)) {
            statuses[statusIndex].views.push(currentUser.id);
            DB.save(KEYS.STATUS, statuses);
        }

        return { ok: true, msg: "Status viewed", status: statuses[statusIndex] };
    },

    /**
     * React to a status
     * @param {string} statusId - Status ID
     * @param {string} emoji - Reaction emoji
     * @returns {Object} Result object
     */
    reactToStatus(statusId, emoji) {
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (!currentUser) {
            return { ok: false, msg: "No user logged in" };
        }

        let statuses = DB.load(KEYS.STATUS, []);
        const statusIndex = statuses.findIndex(s => s.id === statusId);

        if (statusIndex === -1) {
            return { ok: false, msg: "Status not found" };
        }

        // Initialize reactions array
        if (!statuses[statusIndex].reactions) {
            statuses[statusIndex].reactions = [];
        }

        // Check if user already reacted
        const existingReaction = statuses[statusIndex].reactions.find(
            r => r.userId === currentUser.id
        );

        if (existingReaction) {
            // Update existing reaction
            existingReaction.emoji = emoji;
        } else {
            // Add new reaction
            statuses[statusIndex].reactions.push({
                userId: currentUser.id,
                emoji: emoji,
                time: timeNow()
            });
        }

        DB.save(KEYS.STATUS, statuses);

        return { ok: true, msg: "Reaction added", status: statuses[statusIndex] };
    },

    /**
     * Delete a status
     * @param {string} statusId - Status ID
     * @returns {Object} Result object
     */
    deleteStatus(statusId) {
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (!currentUser) {
            return { ok: false, msg: "No user logged in" };
        }

        let statuses = DB.load(KEYS.STATUS, []);
        const status = statuses.find(s => s.id === statusId);

        if (!status) {
            return { ok: false, msg: "Status not found" };
        }

        // Check if user owns the status
        if (status.userId !== currentUser.id) {
            return { ok: false, msg: "You can only delete your own statuses" };
        }

        // Remove status
        statuses = statuses.filter(s => s.id !== statusId);
        DB.save(KEYS.STATUS, statuses);

        return { ok: true, msg: "Status deleted" };
    },

    /**
     * Clean expired statuses (older than 24 hours)
     * @returns {Object} Result with count of deleted statuses
     */
    cleanStatuses() {
        let statuses = DB.load(KEYS.STATUS, []);
        const originalLength = statuses.length;

        statuses = this._filterExpired(statuses);
        
        DB.save(KEYS.STATUS, statuses);

        const deleted = originalLength - statuses.length;
        if (deleted > 0) {
            console.log(`Cleaned ${deleted} expired statuses`);
        }

        return { ok: true, deleted };
    },

    /**
     * Get status views (who viewed)
     * @param {string} statusId - Status ID
     * @returns {Array} Array of user objects who viewed
     */
    getStatusViews(statusId) {
        const status = this.getStatusById(statusId);
        if (!status || !status.views) return [];

        const users = DB.load(KEYS.USERS, []);
        return status.views
            .map(userId => users.find(u => u.id === userId))
            .filter(Boolean);
    },

    /**
     * Get status reactions
     * @param {string} statusId - Status ID
     * @returns {Array} Array of reaction objects with user details
     */
    getStatusReactions(statusId) {
        const status = this.getStatusById(statusId);
        if (!status || !status.reactions) return [];

        const users = DB.load(KEYS.USERS, []);
        return status.reactions.map(r => ({
            ...r,
            userName: users.find(u => u.id === r.userId)?.name || 'Unknown'
        }));
    },

    /**
     * Check if status is expired
     * @param {Object} status - Status object
     * @returns {boolean} True if expired
     */
    isExpired(status) {
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        return (now - status.timestamp) >= twentyFourHours;
    },

    /**
     * Get time remaining for status
     * @param {Object} status - Status object
     * @returns {string} Time remaining string
     */
    getTimeRemaining(status) {
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        const elapsed = now - status.timestamp;
        const remaining = twentyFourHours - elapsed;

        if (remaining <= 0) return 'Expired';

        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

        if (hours > 0) {
            return `${hours}h ${minutes}m left`;
        }
        return `${minutes}m left`;
    },

    /**
     * Filter expired statuses (private helper)
     * @private
     */
    _filterExpired(statuses) {
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        return statuses.filter(s => (now - s.timestamp) < twentyFourHours);
    }
};

// Auto-clean expired statuses every minute
if (typeof window !== 'undefined') {
    setInterval(() => {
        Status.cleanStatuses();
    }, 60 * 1000); // Every 60 seconds

    console.log('📸 Status module loaded - Auto-cleanup enabled');
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Status };
}
