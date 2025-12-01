/* ============================================================
   ai.js – RegentAI (MetaAI-style Chatbot)
   Intelligent campus assistant with contextual responses
   ============================================================ */

// Import dependencies
if (typeof DB === 'undefined') {
    console.error('DB module not loaded. Please include db.js first.');
}
if (typeof KEYS === 'undefined') {
    console.error('KEYS not loaded. Please include db.js first.');
}

const REGENT_AI_ID = 'bot_ai'; // Use existing bot ID from seeded data

const RegentAI = {
    /**
     * Generate AI response
     * @param {string} userMsg - User's message
     * @param {Object} context - Optional context (user info, history, etc.)
     * @returns {Promise<string>} AI response
     */
    async generateResponse(userMsg, context = {}) {
        // Simulate thinking delay
        await this._delay(500 + Math.random() * 500);

        // Get contextual response
        return this._getContextualResponse(userMsg, context);
    },

    /**
     * Get contextual AI response based on message content
     * @private
     */
    _getContextualResponse(msg, context) {
        const msgLower = msg.toLowerCase().trim();
        const currentUser = context.currentUser || DB.load(KEYS.CURRENT_USER);

        // Greetings
        if (this._matchesAny(msgLower, ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'])) {
            const greetings = [
                `👋 Hello ${currentUser?.name || 'there'}! I'm RegentAI, your campus assistant. How can I help you today?`,
                `Hey ${currentUser?.name || 'friend'}! 😊 What would you like to know about?`,
                `Hi! I'm here to help with campus info, friends, study tips, and more. What do you need?`
            ];
            return this._randomChoice(greetings);
        }

        // Friend/social queries
        if (this._matchesAny(msgLower, ['friend', 'people', 'contacts', 'connect'])) {
            const friendCount = currentUser?.friends?.length || 0;
            return `You currently have ${friendCount} ${friendCount === 1 ? 'friend' : 'friends'} on Regent Connect. ${
                friendCount === 0 
                    ? 'Want me to suggest some people to connect with? Try searching for users with similar interests!' 
                    : 'Visit the Chat or Friends page to message them!'
            }`;
        }

        // Groups
        if (this._matchesAny(msgLower, ['group', 'groups', 'team'])) {
            const groups = DB.load(KEYS.GROUPS, []);
            const userGroups = groups.filter(g => g.members && g.members.includes(currentUser?.id));
            return `📊 You're in ${userGroups.length} ${userGroups.length === 1 ? 'group' : 'groups'}. Groups are perfect for study sessions, project collaboration, and club activities. ${
                userGroups.length === 0 ? 'Want to create one? Head to the Groups page!' : ''
            }`;
        }

        // Study help
        if (this._matchesAny(msgLower, ['study', 'exam', 'test', 'quiz', 'revision', 'learn'])) {
            const tips = [
                `📚 Study tips:\n1. Use the Pomodoro technique (25min focus + 5min break)\n2. Create a study group on Regent Connect\n3. Review notes daily, not just before exams\n4. Teach concepts to others - it reinforces learning\n5. Stay hydrated and take regular breaks`,
                `🎓 Effective studying:\n• Active recall - test yourself frequently\n• Spaced repetition - review over time\n• Find a study buddy through Regent Connect\n• Break topics into chunks\n• Use the Feynman Technique: explain it simply`,
                `💡 Study strategies:\n- Start with hardest subjects when fresh\n- Use flashcards for memorization\n- Join study groups for motivation\n- Take practice tests\n- Sleep well before exams!`
            ];
            return this._randomChoice(tips);
        }

        // Project ideas
        if (this._matchesAny(msgLower, ['project', 'idea', 'build', 'create', 'develop'])) {
            const ideas = [
                `💡 CS Project ideas:\n1. Campus event tracker with notifications\n2. Study buddy matching algorithm\n3. AI-powered note summarizer\n4. Virtual club management platform\n5. Student marketplace for books/items\n6. Timetable optimizer\n7. Campus navigation app`,
                `🚀 Innovative projects:\n• Real-time collaboration tool for group work\n• Automated attendance system\n• Course review and rating platform\n• Campus food delivery coordination\n• Lost and found tracking system\n• Carpooling app for students`,
                `💻 Tech project suggestions:\n- Blockchain-based certificate verification\n- ML-powered career recommendation\n- IoT campus safety system\n- Gamified learning platform\n- Campus social network (like Regent Connect!)`
            ];
            return this._randomChoice(ideas);
        }

        // Campus events
        if (this._matchesAny(msgLower, ['event', 'happening', 'activity', 'program'])) {
            return `📅 Upcoming campus events:\n• Tech Talk: AI in Education - Friday 3PM\n• Robotics Club Meeting - Wednesday 5PM\n• Hackathon Registration Open\n• Career Fair - Next Month\n• STEMAID Community Outreach - Saturday\n\nJoin relevant groups to stay updated!`;
        }

        // Clubs
        if (this._matchesAny(msgLower, ['club', 'robotics', 'stemaid', 'organization'])) {
            return `🤖 Active campus clubs:\n• Robotics Club - Build robots & compete (Contact: Nana)\n• STEMAID - Community outreach (Contact: Akosua)\n• Coding Club - Weekly challenges\n• Entrepreneurs' Club - Startup ideas\n• Chess Club - Strategy & tournaments\n\nConnect with members through Regent Connect!`;
        }

        // Career advice
        if (this._matchesAny(msgLower, ['career', 'job', 'internship', 'work'])) {
            return `💼 Career tips:\n1. Build a strong GitHub portfolio\n2. Network through LinkedIn & campus events\n3. Apply for internships early\n4. Work on real projects (not just tutorials)\n5. Attend career fairs and workshops\n6. Practice coding interviews\n7. Create a professional resume\n\nNeed specific career advice? Let me know your field!`;
        }

        // Programming help
        if (this._matchesAny(msgLower, ['code', 'program', 'bug', 'error', 'debug', 'algorithm'])) {
            return `💻 Programming help:\n• Break down the problem into smaller parts\n• Use console.log/print for debugging\n• Check Stack Overflow & documentation\n• Ask in study groups on Regent Connect\n• Practice on platforms like LeetCode\n• Learn by building projects\n\nWhat language are you working with?`;
        }

        // Time management
        if (this._matchesAny(msgLower, ['time', 'schedule', 'busy', 'deadline', 'manage'])) {
            return `⏰ Time management tips:\n1. Use a planner or app (Google Calendar)\n2. Prioritize with Eisenhower Matrix\n3. Set specific goals daily\n4. Avoid multitasking\n5. Schedule breaks\n6. Learn to say no\n7. Use Regent Connect to coordinate with study groups efficiently`;
        }

        // Mental health
        if (this._matchesAny(msgLower, ['stress', 'anxiety', 'pressure', 'overwhelm', 'mental'])) {
            return `🧠 Mental wellness:\n• Take breaks regularly\n• Talk to friends (use Regent Connect!)\n• Exercise or walk daily\n• Get 7-8 hours of sleep\n• Practice mindfulness/meditation\n• Seek counseling if needed\n• Remember: It's okay to ask for help\n\nYour wellbeing matters! 💚`;
        }

        // App help
        if (this._matchesAny(msgLower, ['how', 'use', 'help', 'feature', 'tutorial'])) {
            return `ℹ️ Regent Connect features:\n• **Chat**: Message friends privately\n• **Groups**: Collaborate with teams\n• **Friends**: Send & accept requests\n• **Status**: Share 24-hour updates\n• **Calls**: Voice/Video calling\n• **Profile**: Update your info\n• **AI (me!)**: Get help anytime\n\nWhat specific feature do you need help with?`;
        }

        // Messages/chats
        if (this._matchesAny(msgLower, ['message', 'chat', 'send', 'talk'])) {
            const msgs = DB.load(KEYS.MESSAGES, []);
            const userMsgs = msgs.filter(m => m.from === currentUser?.id || m.to === currentUser?.id);
            return `💬 You've exchanged ${userMsgs.length} messages on Regent Connect. Want to start a new conversation? Head to the Chat page and select a friend or group!`;
        }

        // Status updates
        if (this._matchesAny(msgLower, ['status', 'story', 'post', 'update'])) {
            return `📸 Status updates:\n• Share photos, videos, or text\n• Visible to friends for 24 hours\n• See who viewed your status\n• React to friends' status\n\nGo to the Status page to share what's on your mind!`;
        }

        // About RegentAI
        if (this._matchesAny(msgLower, ['who are you', 'what are you', 'about you', 'your name'])) {
            return `🤖 I'm RegentAI, your intelligent campus assistant!\n\nI can help with:\n• Finding information\n• Connecting with peers\n• Study guidance & tips\n• Project ideas\n• Campus navigation\n• Platform support\n\nI'm constantly learning to serve Regent students better. Built with ❤️ for the Regent community!`;
        }

        // Thanks/goodbye
        if (this._matchesAny(msgLower, ['thank', 'thanks', 'bye', 'goodbye', 'see you'])) {
            const responses = [
                `You're welcome, ${currentUser?.name || 'friend'}! 😊 Feel free to come back anytime.`,
                `Glad I could help! Have a great day! 🌟`,
                `Anytime! Good luck with your studies! 📚`,
                `Happy to assist! See you around! 👋`
            ];
            return this._randomChoice(responses);
        }

        // Jokes/fun
        if (this._matchesAny(msgLower, ['joke', 'funny', 'laugh', 'fun'])) {
            const jokes = [
                `Why do programmers prefer dark mode?\n\nBecause light attracts bugs! 🐛😄`,
                `How many programmers does it take to change a light bulb?\n\nNone. It's a hardware problem! 💡`,
                `Why do Java developers wear glasses?\n\nBecause they can't C#! 😎`,
                `What's a programmer's favorite hangout?\n\nThe Foo Bar! 🍺`
            ];
            return this._randomChoice(jokes);
        }

        // Default/fallback responses
        const fallbacks = [
            `I understand you're asking about "${msg.slice(0, 50)}${msg.length > 50 ? '...' : ''}". ${this._getSuggestions()}`,
            `That's interesting! Could you tell me more about what you're looking for? ${this._getSuggestions()}`,
            `I'm here to help! ${this._getSuggestions()}`,
            `Let me help you with that. ${this._getSuggestions()}`
        ];

        return this._randomChoice(fallbacks);
    },

    /**
     * Get suggestions for what AI can help with
     * @private
     */
    _getSuggestions() {
        return `\n\nI can help with:\n• Friends & Groups 👥\n• Study Tips 📚\n• Campus Events 📅\n• Project Ideas 💡\n• Career Advice 💼\n• Platform Help ℹ️`;
    },

    /**
     * Check if message matches any keywords
     * @private
     */
    _matchesAny(text, keywords) {
        return keywords.some(keyword => text.includes(keyword.toLowerCase()));
    },

    /**
     * Get random choice from array
     * @private
     */
    _randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    /**
     * Simulate delay (thinking time)
     * @private
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Send message to AI and get response
     * @param {string} message - User message
     * @param {Object} context - Optional context
     * @returns {Promise<Object>} Result with response
     */
    async chat(message, context = {}) {
        const currentUser = context.currentUser || DB.load(KEYS.CURRENT_USER);
        
        if (!message || !message.trim()) {
            return { ok: false, msg: "Message cannot be empty" };
        }

        // Save user message to AI history
        let history = DB.load(KEYS.AI_HISTORY, []);
        history.push({
            type: 'user',
            text: message,
            time: timeNow()
        });

        // Generate AI response
        const response = await this.generateResponse(message, { currentUser });

        // Save AI response to history
        history.push({
            type: 'bot',
            text: response,
            time: timeNow()
        });

        // Keep last 100 messages
        if (history.length > 100) {
            history = history.slice(-100);
        }

        DB.save(KEYS.AI_HISTORY, history);

        return { ok: true, response };
    },

    /**
     * Get AI chat history
     * @returns {Array} Chat history
     */
    getHistory() {
        return DB.load(KEYS.AI_HISTORY, []);
    },

    /**
     * Clear AI chat history
     */
    clearHistory() {
        DB.save(KEYS.AI_HISTORY, []);
    },

    /**
     * Send AI message into regular chat conversation
     * @param {string} convId - Conversation ID
     * @param {string} text - Message text
     */
    async sendToChat(convId, text) {
        if (typeof Chat !== 'undefined') {
            // Get AI response
            const result = await this.chat(text);
            
            if (result.ok) {
                // Send AI reply to conversation
                Chat.sendMessage({
                    to: REGENT_AI_ID,
                    text: result.response,
                    isGroup: false
                });
            }

            return result;
        }
        
        return { ok: false, msg: "Chat module not loaded" };
    }
};

// Global access
if (typeof window !== 'undefined') {
    window.RegentAI = RegentAI;
    window.REGENT_AI_ID = REGENT_AI_ID;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RegentAI, REGENT_AI_ID };
}

console.log('🤖 RegentAI module loaded - Campus assistant ready!');
