/* ============================================================
   groups.js – Group creation & group chat
   Handles group management and group messaging
   ============================================================ */

// Import dependencies
if (typeof DB === 'undefined') {
    console.error('DB module not loaded. Please include db.js first.');
}
if (typeof KEYS === 'undefined') {
    console.error('KEYS not loaded. Please include db.js first.');
}

const Groups = {
    /**
     * Create a new group
     * @param {Object} data - Group data
     * @param {string} data.name - Group name
     * @param {Array} data.members - Array of member user IDs
     * @param {string} data.avatar - Avatar URL/color
     * @param {string} data.description - Group description
     * @returns {Object} Result object with group
     */
    createGroup(data) {
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (!currentUser) {
            return { ok: false, msg: "No user logged in" };
        }

        // Validation
        if (!data.name || data.name.trim().length < 2) {
            return { ok: false, msg: "Group name must be at least 2 characters" };
        }

        if (!data.members || data.members.length === 0) {
            return { ok: false, msg: "Group must have at least one member besides you" };
        }

        // Create group object
        const group = {
            id: uid('grp'),
            name: data.name.trim(),
            description: data.description || '',
            avatar: data.avatar || this._randomGroupColor(),
            avatarType: data.avatarType || 'color', // color, emoji, image
            admin: currentUser.id,
            admins: [currentUser.id], // Support multiple admins
            members: [...new Set([currentUser.id, ...data.members])], // Include creator, remove duplicates
            createdBy: currentUser.id,
            createdAt: timeNow(),
            settings: {
                onlyAdminsCanSend: false,
                onlyAdminsCanEdit: false,
                allowMemberAdd: true
            }
        };

        // Save group
        let groups = DB.load(KEYS.GROUPS, []);
        groups.push(group);
        DB.save(KEYS.GROUPS, groups);

        return { ok: true, msg: "Group created successfully", group };
    },

    /**
     * Get group by ID
     * @param {string} groupId - Group ID
     * @returns {Object|null} Group object or null
     */
    getGroupById(groupId) {
        const groups = DB.load(KEYS.GROUPS, []);
        return groups.find(g => g.id === groupId) || null;
    },

    /**
     * Get all groups
     * @returns {Array} Array of groups
     */
    getAllGroups() {
        return DB.load(KEYS.GROUPS, []);
    },

    /**
     * Get user's groups
     * @param {string} userId - User ID
     * @returns {Array} Array of groups user is member of
     */
    getUserGroups(userId) {
        const groups = this.getAllGroups();
        return groups.filter(g => g.members && g.members.includes(userId));
    },

    /**
     * Update group info
     * @param {string} groupId - Group ID
     * @param {Object} updates - Fields to update
     * @returns {Object} Result object
     */
    updateGroup(groupId, updates) {
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (!currentUser) {
            return { ok: false, msg: "No user logged in" };
        }

        let groups = DB.load(KEYS.GROUPS, []);
        const groupIndex = groups.findIndex(g => g.id === groupId);

        if (groupIndex === -1) {
            return { ok: false, msg: "Group not found" };
        }

        const group = groups[groupIndex];

        // Check if user is admin
        if (!group.admins || !group.admins.includes(currentUser.id)) {
            return { ok: false, msg: "Only admins can update group info" };
        }

        // Merge updates (preserve important fields)
        groups[groupIndex] = {
            ...group,
            ...updates,
            id: groupId, // Preserve ID
            admin: group.admin, // Preserve original admin
            createdBy: group.createdBy, // Preserve creator
            createdAt: group.createdAt // Preserve creation date
        };

        DB.save(KEYS.GROUPS, groups);

        return { ok: true, msg: "Group updated", group: groups[groupIndex] };
    },

    /**
     * Add member to group
     * @param {string} groupId - Group ID
     * @param {string} userId - User ID to add
     * @returns {Object} Result object
     */
    addMember(groupId, userId) {
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (!currentUser) {
            return { ok: false, msg: "No user logged in" };
        }

        let groups = DB.load(KEYS.GROUPS, []);
        const groupIndex = groups.findIndex(g => g.id === groupId);

        if (groupIndex === -1) {
            return { ok: false, msg: "Group not found" };
        }

        const group = groups[groupIndex];

        // Check permissions
        if (group.settings?.onlyAdminsCanEdit && !group.admins?.includes(currentUser.id)) {
            return { ok: false, msg: "Only admins can add members" };
        }

        // Check if already member
        if (group.members.includes(userId)) {
            return { ok: false, msg: "User is already a member" };
        }

        // Add member
        groups[groupIndex].members.push(userId);
        DB.save(KEYS.GROUPS, groups);

        return { ok: true, msg: "Member added", group: groups[groupIndex] };
    },

    /**
     * Remove member from group
     * @param {string} groupId - Group ID
     * @param {string} userId - User ID to remove
     * @returns {Object} Result object
     */
    removeMember(groupId, userId) {
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (!currentUser) {
            return { ok: false, msg: "No user logged in" };
        }

        let groups = DB.load(KEYS.GROUPS, []);
        const groupIndex = groups.findIndex(g => g.id === groupId);

        if (groupIndex === -1) {
            return { ok: false, msg: "Group not found" };
        }

        const group = groups[groupIndex];

        // Check if user is admin or removing themselves
        const isAdmin = group.admins?.includes(currentUser.id);
        const isSelf = userId === currentUser.id;

        if (!isAdmin && !isSelf) {
            return { ok: false, msg: "Only admins can remove members" };
        }

        // Cannot remove the original admin
        if (userId === group.admin) {
            return { ok: false, msg: "Cannot remove group creator" };
        }

        // Remove member
        groups[groupIndex].members = group.members.filter(m => m !== userId);

        // If group is empty, delete it
        if (groups[groupIndex].members.length === 0) {
            groups = groups.filter(g => g.id !== groupId);
        }

        DB.save(KEYS.GROUPS, groups);

        return { ok: true, msg: isSelf ? "Left group" : "Member removed" };
    },

    /**
     * Make user admin
     * @param {string} groupId - Group ID
     * @param {string} userId - User ID to promote
     * @returns {Object} Result object
     */
    makeAdmin(groupId, userId) {
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (!currentUser) {
            return { ok: false, msg: "No user logged in" };
        }

        let groups = DB.load(KEYS.GROUPS, []);
        const groupIndex = groups.findIndex(g => g.id === groupId);

        if (groupIndex === -1) {
            return { ok: false, msg: "Group not found" };
        }

        const group = groups[groupIndex];

        // Check if current user is admin
        if (!group.admins || !group.admins.includes(currentUser.id)) {
            return { ok: false, msg: "Only admins can promote members" };
        }

        // Check if user is member
        if (!group.members.includes(userId)) {
            return { ok: false, msg: "User is not a member" };
        }

        // Check if already admin
        if (group.admins.includes(userId)) {
            return { ok: false, msg: "User is already an admin" };
        }

        // Add to admins
        groups[groupIndex].admins.push(userId);
        DB.save(KEYS.GROUPS, groups);

        return { ok: true, msg: "User promoted to admin" };
    },

    /**
     * Send message to group
     * @param {string} groupId - Group ID
     * @param {Object} data - Message data
     * @returns {Object} Result object
     */
    sendGroupMessage(groupId, data) {
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (!currentUser) {
            return { ok: false, msg: "No user logged in" };
        }

        const group = this.getGroupById(groupId);
        if (!group) {
            return { ok: false, msg: "Group not found" };
        }

        // Check if user is member
        if (!group.members.includes(currentUser.id)) {
            return { ok: false, msg: "You are not a member of this group" };
        }

        // Check if only admins can send
        if (group.settings?.onlyAdminsCanSend && !group.admins?.includes(currentUser.id)) {
            return { ok: false, msg: "Only admins can send messages in this group" };
        }

        // Create message using Chat module
        if (typeof Chat !== 'undefined') {
            return Chat.sendMessage({
                to: groupId,
                text: data.text,
                type: data.type || 'text',
                attachment: data.attachment,
                attachmentType: data.attachmentType,
                attachmentName: data.attachmentName,
                isGroup: true
            });
        }

        // Fallback if Chat module not loaded
        const convId = 'group_' + groupId;
        const message = {
            id: uid('msg'),
            convId: convId,
            from: currentUser.id,
            text: data.text || '',
            type: data.type || 'text',
            attachment: data.attachment || null,
            time: timeNow(),
            seenBy: [currentUser.id]
        };

        let msgs = DB.load(KEYS.MESSAGES, []);
        msgs.push(message);
        DB.save(KEYS.MESSAGES, msgs);

        return { ok: true, msg: "Message sent", message };
    },

    /**
     * Get group messages
     * @param {string} groupId - Group ID
     * @returns {Array} Array of messages
     */
    getGroupMessages(groupId) {
        if (typeof Chat !== 'undefined') {
            return Chat.getGroupMessages(groupId);
        }

        // Fallback
        const convId = 'group_' + groupId;
        const msgs = DB.load(KEYS.MESSAGES, []);
        return msgs.filter(m => m.convId === convId)
            .sort((a, b) => new Date(a.time) - new Date(b.time));
    },

    /**
     * Delete group (admin only)
     * @param {string} groupId - Group ID
     * @returns {Object} Result object
     */
    deleteGroup(groupId) {
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (!currentUser) {
            return { ok: false, msg: "No user logged in" };
        }

        let groups = DB.load(KEYS.GROUPS, []);
        const group = groups.find(g => g.id === groupId);

        if (!group) {
            return { ok: false, msg: "Group not found" };
        }

        // Only creator can delete
        if (group.admin !== currentUser.id) {
            return { ok: false, msg: "Only group creator can delete group" };
        }

        // Remove group
        groups = groups.filter(g => g.id !== groupId);
        DB.save(KEYS.GROUPS, groups);

        // Optionally delete messages
        let msgs = DB.load(KEYS.MESSAGES, []);
        const convId = 'group_' + groupId;
        msgs = msgs.filter(m => m.convId !== convId);
        DB.save(KEYS.MESSAGES, msgs);

        return { ok: true, msg: "Group deleted" };
    },

    /**
     * Search groups
     * @param {string} query - Search query
     * @returns {Array} Filtered groups
     */
    searchGroups(query) {
        const groups = this.getAllGroups();
        const searchLower = query.toLowerCase().trim();
        
        return groups.filter(g => 
            g.name.toLowerCase().includes(searchLower) ||
            (g.description && g.description.toLowerCase().includes(searchLower))
        );
    },

    /**
     * Get group members with details
     * @param {string} groupId - Group ID
     * @returns {Array} Array of member objects with user details
     */
    getGroupMembers(groupId) {
        const group = this.getGroupById(groupId);
        if (!group) return [];

        const users = DB.load(KEYS.USERS, []);
        return group.members
            .map(memberId => {
                const user = users.find(u => u.id === memberId);
                if (!user) return null;
                
                return {
                    ...user,
                    isAdmin: group.admins?.includes(memberId) || false,
                    isCreator: group.admin === memberId
                };
            })
            .filter(Boolean);
    },

    /**
     * Check if user is admin of group
     * @param {string} groupId - Group ID
     * @param {string} userId - User ID
     * @returns {boolean}
     */
    isAdmin(groupId, userId) {
        const group = this.getGroupById(groupId);
        if (!group) return false;
        return group.admins?.includes(userId) || group.admin === userId;
    },

    /**
     * Check if user is member of group
     * @param {string} groupId - Group ID
     * @param {string} userId - User ID
     * @returns {boolean}
     */
    isMember(groupId, userId) {
        const group = this.getGroupById(groupId);
        if (!group) return false;
        return group.members?.includes(userId) || false;
    },

    /**
     * Generate random group color
     * @private
     */
    _randomGroupColor() {
        const colors = [
            '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444',
            '#f97316', '#f59e0b', '#10b981', '#06b6d4',
            '#3b82f6', '#6366f1', '#a855f7', '#d946ef'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Groups };
}
