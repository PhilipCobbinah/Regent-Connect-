/* ============================================================
   chat.js – One-to-One and Group Messaging
   Handles message sending, receiving, typing indicators, and read receipts
   ============================================================ */

// Import dependencies
if (typeof DB === 'undefined') {
    console.error('DB module not loaded. Please include db.js first.');
}
if (typeof KEYS === 'undefined') {
    console.error('KEYS not loaded. Please include db.js first.');
}

const Chat = {
    /**
     * Generate conversation ID for two users
     * @param {string} user1 - First user ID
     * @param {string} user2 - Second user ID
     * @returns {string} Conversation ID
     */
    getChatId(user1, user2) {
        return 'p_' + [user1, user2].sort().join('_');
    },

    /**
     * Generate group conversation ID
     * @param {string} groupId - Group ID
     * @returns {string} Conversation ID
     */
    getGroupChatId(groupId) {
        return 'group_' + groupId;
    },

    /**
     * Send message to user or group
     * @param {Object} data - Message data
     * @param {string} data.to - Recipient ID (user or group)
     * @param {string} data.text - Message text
     * @param {string} data.type - Message type (text, image, video, file, voice)
     * @param {string} data.attachment - Attachment URL/data
     * @param {boolean} data.isGroup - Whether it's a group message
     * @returns {Object} Result object with message
     */
    sendMessage(data) {
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (!currentUser) {
            return { ok: false, msg: "No user logged in" };
        }

        // Validation
        if (!data.text && !data.attachment) {
            return { ok: false, msg: "Message cannot be empty" };
        }

        // Generate conversation ID
        const convId = data.isGroup ? 
            this.getGroupChatId(data.to) : 
            this.getChatId(currentUser.id, data.to);

        // Create message object
        const message = {
            id: uid('msg'),
            convId: convId,
            from: currentUser.id,
            to: data.to,
            text: data.text || '',
            type: data.type || 'text',
            attachment: data.attachment || null,
            attachmentType: data.attachmentType || null,
            attachmentName: data.attachmentName || null,
            quotedMessage: data.quotedMessage || null,
            status: 'sent', // sent, delivered, read
            starred: false,
            seen: false,
            edited: false,
            deleted: false,
            time: timeNow(),
            timestamp: Date.now()
        };

        // Save message
        let msgs = DB.load(KEYS.MESSAGES, []);
        msgs.push(message);
        DB.save(KEYS.MESSAGES, msgs);

        return { ok: true, msg: "Message sent", message };
    },

    /**
     * Get messages for a conversation
     * @param {string} convId - Conversation ID
     * @returns {Array} Array of messages
     */
    getMessages(convId) {
        const msgs = DB.load(KEYS.MESSAGES, []);
        return msgs.filter(m => m.convId === convId && !m.deleted)
            .sort((a, b) => new Date(a.time) - new Date(b.time));
    },

    /**
     * Get private chat messages with another user
     * @param {string} userId - Other user ID
     * @returns {Array} Array of messages
     */
    getPrivateMessages(userId) {
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (!currentUser) return [];

        const convId = this.getChatId(currentUser.id, userId);
        return this.getMessages(convId);
    },

    /**
     * Get group chat messages
     * @param {string} groupId - Group ID
     * @returns {Array} Array of messages
     */
    getGroupMessages(groupId) {
        const convId = this.getGroupChatId(groupId);
        return this.getMessages(convId);
    },

    /**
     * Mark messages as seen
     * @param {string} convId - Conversation ID
     * @returns {Object} Result object
     */
    markAsSeen(convId) {
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (!currentUser) {
            return { ok: false, msg: "No user logged in" };
        }

        let msgs = DB.load(KEYS.MESSAGES, []);
        let updated = 0;

        msgs = msgs.map(m => {
            // Mark as seen if it's in this conversation and sent to current user
            if (m.convId === convId && m.to === currentUser.id && !m.seen) {
                updated++;
                return { ...m, seen: true, status: 'read' };
            }
            return m;
        });

        if (updated > 0) {
            DB.save(KEYS.MESSAGES, msgs);
        }

        return { ok: true, msg: `${updated} messages marked as seen` };
    },

    /**
     * Star/Unstar a message
     * @param {string} messageId - Message ID
     * @param {boolean} starred - Star status
     * @returns {Object} Result object
     */
    starMessage(messageId, starred = true) {
        let msgs = DB.load(KEYS.MESSAGES, []);
        const msgIndex = msgs.findIndex(m => m.id === messageId);

        if (msgIndex === -1) {
            return { ok: false, msg: "Message not found" };
        }

        msgs[msgIndex].starred = starred;
        DB.save(KEYS.MESSAGES, msgs);

        return { ok: true, msg: starred ? "Message starred" : "Message unstarred" };
    },

    /**
     * Get starred messages
     * @param {string} convId - Conversation ID (optional)
     * @returns {Array} Array of starred messages
     */
    getStarredMessages(convId = null) {
        const msgs = DB.load(KEYS.MESSAGES, []);
        return msgs.filter(m => m.starred && (convId ? m.convId === convId : true));
    },

    /**
     * Edit a message
     * @param {string} messageId - Message ID
     * @param {string} newText - New message text
     * @returns {Object} Result object
     */
    editMessage(messageId, newText) {
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (!currentUser) {
            return { ok: false, msg: "No user logged in" };
        }

        let msgs = DB.load(KEYS.MESSAGES, []);
        const msgIndex = msgs.findIndex(m => m.id === messageId);

        if (msgIndex === -1) {
            return { ok: false, msg: "Message not found" };
        }

        // Check if user owns the message
        if (msgs[msgIndex].from !== currentUser.id) {
            return { ok: false, msg: "You can only edit your own messages" };
        }

        msgs[msgIndex].text = newText;
        msgs[msgIndex].edited = true;
        msgs[msgIndex].editedAt = timeNow();
        DB.save(KEYS.MESSAGES, msgs);

        return { ok: true, msg: "Message edited", message: msgs[msgIndex] };
    },

    /**
     * Delete a message
     * @param {string} messageId - Message ID
     * @param {boolean} forEveryone - Delete for everyone or just me
     * @returns {Object} Result object
     */
    deleteMessage(messageId, forEveryone = false) {
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (!currentUser) {
            return { ok: false, msg: "No user logged in" };
        }

        let msgs = DB.load(KEYS.MESSAGES, []);
        const msgIndex = msgs.findIndex(m => m.id === messageId);

        if (msgIndex === -1) {
            return { ok: false, msg: "Message not found" };
        }

        // Check if user owns the message for "delete for everyone"
        if (forEveryone && msgs[msgIndex].from !== currentUser.id) {
            return { ok: false, msg: "You can only delete your own messages for everyone" };
        }

        if (forEveryone) {
            msgs[msgIndex].deleted = true;
            msgs[msgIndex].deletedAt = timeNow();
            msgs[msgIndex].text = "This message was deleted";
        } else {
            // Just remove from list
            msgs = msgs.filter(m => m.id !== messageId);
        }

        DB.save(KEYS.MESSAGES, msgs);

        return { ok: true, msg: "Message deleted" };
    },

    /**
     * Set typing indicator
     * @param {string} convId - Conversation ID
     * @param {boolean} isTyping - Typing status
     */
    setTyping(convId, isTyping) {
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (!currentUser) return;

        const key = `typing_${convId}_${currentUser.id}`;
        if (isTyping) {
            DB.save(key, {
                userId: currentUser.id,
                time: Date.now()
            });

            // Auto-clear after 3 seconds
            setTimeout(() => {
                const stored = DB.load(key);
                if (stored && Date.now() - stored.time >= 3000) {
                    DB.remove(key);
                }
            }, 3000);
        } else {
            DB.remove(key);
        }
    },

    /**
     * Check if user is typing
     * @param {string} convId - Conversation ID
     * @param {string} userId - User ID to check
     * @returns {boolean} Is typing status
     */
    isTyping(convId, userId) {
        const key = `typing_${convId}_${userId}`;
        const stored = DB.load(key);
        
        if (!stored) return false;

        // Check if typing indicator is stale (more than 5 seconds old)
        if (Date.now() - stored.time > 5000) {
            DB.remove(key);
            return false;
        }

        return true;
    },

    /**
     * Get recent conversations
     * @param {number} limit - Number of conversations to return
     * @returns {Array} Array of conversation objects
     */
    getRecentConversations(limit = 10) {
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (!currentUser) return [];

        const msgs = DB.load(KEYS.MESSAGES, []);
        const users = DB.load(KEYS.USERS, []);
        const groups = DB.load(KEYS.GROUPS, []);

        // Group by conversation
        const convs = {};
        msgs.forEach(m => {
            if (!m.convId.includes(currentUser.id) && !m.convId.startsWith('group_')) return;
            
            if (!convs[m.convId]) {
                convs[m.convId] = {
                    convId: m.convId,
                    lastMessage: m,
                    unreadCount: 0
                };
            } else if (new Date(m.time) > new Date(convs[m.convId].lastMessage.time)) {
                convs[m.convId].lastMessage = m;
            }

            // Count unread
            if (m.to === currentUser.id && !m.seen) {
                convs[m.convId].unreadCount++;
            }
        });

        // Convert to array and add metadata
        const conversations = Object.values(convs).map(conv => {
            if (conv.convId.startsWith('group_')) {
                const groupId = conv.convId.replace('group_', '');
                const group = groups.find(g => g.id === groupId);
                return {
                    ...conv,
                    type: 'group',
                    groupId,
                    name: group?.name || 'Unknown Group',
                    avatar: null,
                    members: group?.members || []
                };
            } else {
                const otherUserId = conv.convId.split('_').find(id => id !== 'p' && id !== currentUser.id);
                const user = users.find(u => u.id === otherUserId);
                return {
                    ...conv,
                    type: 'private',
                    userId: otherUserId,
                    name: user?.name || 'Unknown User',
                    avatar: user?.avatarColor || '#6ee7b7',
                    online: user?.online || false
                };
            }
        });

        // Sort by last message time
        conversations.sort((a, b) => 
            new Date(b.lastMessage.time) - new Date(a.lastMessage.time)
        );

        return conversations.slice(0, limit);
    },

    /**
     * Search messages
     * @param {string} query - Search query
     * @param {string} convId - Conversation ID (optional)
     * @returns {Array} Array of matching messages
     */
    searchMessages(query, convId = null) {
        const msgs = DB.load(KEYS.MESSAGES, []);
        const searchLower = query.toLowerCase().trim();

        return msgs.filter(m => {
            const matchesQuery = m.text && m.text.toLowerCase().includes(searchLower);
            const matchesConv = convId ? m.convId === convId : true;
            return matchesQuery && matchesConv && !m.deleted;
        });
    },

    /**
     * Get unread message count
     * @param {string} convId - Conversation ID (optional)
     * @returns {number} Unread count
     */
    getUnreadCount(convId = null) {
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (!currentUser) return 0;

        const msgs = DB.load(KEYS.MESSAGES, []);
        return msgs.filter(m => 
            m.to === currentUser.id && 
            !m.seen && 
            (convId ? m.convId === convId : true)
        ).length;
    },

    /**
     * Clear conversation
     * @param {string} convId - Conversation ID
     * @returns {Object} Result object
     */
    clearConversation(convId) {
        let msgs = DB.load(KEYS.MESSAGES, []);
        const originalLength = msgs.length;
        
        msgs = msgs.filter(m => m.convId !== convId);
        DB.save(KEYS.MESSAGES, msgs);

        const deleted = originalLength - msgs.length;
        return { ok: true, msg: `${deleted} messages cleared` };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Chat };
}
