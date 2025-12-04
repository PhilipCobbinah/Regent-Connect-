/* ============================================================
   calls.js – Simulated Calls (UI only)
   Handles call initiation, history, and UI simulation
   Note: Real WebRTC implementation requires signaling server
   ============================================================ */

// Import dependencies
if (typeof DB === 'undefined') {
    console.error('DB module not loaded. Please include db.js first.');
}
if (typeof KEYS === 'undefined') {
    console.error('KEYS not loaded. Please include db.js first.');
}

const Calls = {
    /**
     * Start a call
     * @param {Object} data - Call data
     * @param {string} data.userId - User ID to call
     * @param {string} data.type - Call type (voice, video)
     * @param {string} data.groupId - Group ID for group calls
     * @returns {Object} Result object
     */
    startCall(data) {
        const currentUser = DB.load(KEYS.CURRENT_USER);
        if (!currentUser) {
            return { ok: false, msg: "No user logged in" };
        }

        // Validation
        if (!data.userId && !data.groupId) {
            return { ok: false, msg: "User ID or Group ID required" };
        }

        const type = data.type || 'voice';
        const isGroup = !!data.groupId;

        // Create call record
        const call = {
            id: uid('call'),
            caller: currentUser.id,
            receiver: data.userId || null,
            groupId: data.groupId || null,
            type: type, // voice, video
            isGroup: isGroup,
            status: 'calling', // calling, connected, ended, missed, declined
            startTime: Date.now(),
            endTime: null,
            duration: 0,
            timestamp: timeNow()
        };

        // Save to call history
        let calls = DB.load(KEYS.CALLS, []);
        calls.push(call);
        DB.save(KEYS.CALLS, calls);

        // Redirect to call page
        const url = isGroup 
            ? `call.html?groupId=${data.groupId}&type=${type}`
            : `call.html?userId=${data.userId}&type=${type}`;
        
        if (typeof window !== 'undefined') {
            window.location.href = url;
        }

        return { ok: true, msg: "Call started", call };
    },

    /**
     * End a call
     * @param {string} callId - Call ID
     * @returns {Object} Result object
     */
    endCall(callId) {
        let calls = DB.load(KEYS.CALLS, []);
        const callIndex = calls.findIndex(c => c.id === callId);

        if (callIndex === -1) {
            return { ok: false, msg: "Call not found" };
        }

        const call = calls[callIndex];
        call.status = 'ended';
        call.endTime = Date.now();
        call.duration = Math.floor((call.endTime - call.startTime) / 1000); // seconds

        calls[callIndex] = call;
        DB.save(KEYS.CALLS, calls);

        return { ok: true, msg: "Call ended", call };
    },

    /**
     * Get call by ID
     * @param {string} callId - Call ID
     * @returns {Object|null} Call object
     */
    getCallById(callId) {
        const calls = DB.load(KEYS.CALLS, []);
        return calls.find(c => c.id === callId) || null;
    },

    /**
     * Get call history for user
     * @param {string} userId - User ID
     * @param {number} limit - Number of calls to return
     * @returns {Array} Array of call records
     */
    getCallHistory(userId, limit = 20) {
        const calls = DB.load(KEYS.CALLS, []);
        const users = DB.load(KEYS.USERS, []);
        const groups = DB.load(KEYS.GROUPS, []);

        return calls
            .filter(c => c.caller === userId || c.receiver === userId)
            .sort((a, b) => b.startTime - a.startTime)
            .slice(0, limit)
            .map(call => {
                // Add user/group details
                if (call.isGroup) {
                    const group = groups.find(g => g.id === call.groupId);
                    return {
                        ...call,
                        name: group?.name || 'Unknown Group',
                        avatar: group?.avatar || '#8b5cf6'
                    };
                } else {
                    const otherId = call.caller === userId ? call.receiver : call.caller;
                    const user = users.find(u => u.id === otherId);
                    return {
                        ...call,
                        name: user?.name || 'Unknown User',
                        avatar: user?.avatarColor || '#6ee7b7',
                        isIncoming: call.receiver === userId,
                        isOutgoing: call.caller === userId
                    };
                }
            });
    },

    /**
     * Get missed calls
     * @param {string} userId - User ID
     * @returns {Array} Array of missed calls
     */
    getMissedCalls(userId) {
        const calls = DB.load(KEYS.CALLS, []);
        return calls.filter(c => 
            c.receiver === userId && 
            c.status === 'missed'
        ).sort((a, b) => b.startTime - a.startTime);
    },

    /**
     * Mark call as missed
     * @param {string} callId - Call ID
     * @returns {Object} Result object
     */
    markAsMissed(callId) {
        let calls = DB.load(KEYS.CALLS, []);
        const callIndex = calls.findIndex(c => c.id === callId);

        if (callIndex === -1) {
            return { ok: false, msg: "Call not found" };
        }

        calls[callIndex].status = 'missed';
        calls[callIndex].endTime = Date.now();
        DB.save(KEYS.CALLS, calls);

        return { ok: true, msg: "Call marked as missed" };
    },

    /**
     * Mark call as declined
     * @param {string} callId - Call ID
     * @returns {Object} Result object
     */
    declineCall(callId) {
        let calls = DB.load(KEYS.CALLS, []);
        const callIndex = calls.findIndex(c => c.id === callId);

        if (callIndex === -1) {
            return { ok: false, msg: "Call not found" };
        }

        calls[callIndex].status = 'declined';
        calls[callIndex].endTime = Date.now();
        DB.save(KEYS.CALLS, calls);

        return { ok: true, msg: "Call declined" };
    },

    /**
     * Get total call duration with a user
     * @param {string} userId1 - First user ID
     * @param {string} userId2 - Second user ID
     * @returns {number} Total duration in seconds
     */
    getTotalCallDuration(userId1, userId2) {
        const calls = DB.load(KEYS.CALLS, []);
        return calls
            .filter(c => 
                (c.caller === userId1 && c.receiver === userId2) ||
                (c.caller === userId2 && c.receiver === userId1)
            )
            .reduce((total, call) => total + (call.duration || 0), 0);
    },

    /**
     * Clear call history
     * @param {string} userId - User ID
     * @returns {Object} Result object
     */
    clearCallHistory(userId) {
        let calls = DB.load(KEYS.CALLS, []);
        const originalLength = calls.length;
        
        calls = calls.filter(c => c.caller !== userId && c.receiver !== userId);
        DB.save(KEYS.CALLS, calls);

        const deleted = originalLength - calls.length;
        return { ok: true, msg: `${deleted} calls cleared` };
    },

    /**
     * Format call duration
     * @param {number} seconds - Duration in seconds
     * @returns {string} Formatted duration
     */
    formatDuration(seconds) {
        if (seconds < 60) {
            return `${seconds}s`;
        }
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins < 60) {
            return `${mins}m ${secs}s`;
        }
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        return `${hours}h ${remainingMins}m`;
    },

    /**
     * Get call statistics
     * @param {string} userId - User ID
     * @returns {Object} Statistics object
     */
    getCallStats(userId) {
        const calls = this.getCallHistory(userId, 999);
        
        return {
            totalCalls: calls.length,
            voiceCalls: calls.filter(c => c.type === 'voice').length,
            videoCalls: calls.filter(c => c.type === 'video').length,
            incomingCalls: calls.filter(c => c.isIncoming).length,
            outgoingCalls: calls.filter(c => c.isOutgoing).length,
            missedCalls: calls.filter(c => c.status === 'missed').length,
            totalDuration: calls.reduce((sum, c) => sum + (c.duration || 0), 0),
            averageDuration: calls.length > 0 
                ? Math.round(calls.reduce((sum, c) => sum + (c.duration || 0), 0) / calls.length)
                : 0
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Calls };
}
