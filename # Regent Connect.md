# Regent Connect

A modern campus chat platform built with vanilla JavaScript and localStorage.

## Features

### 🔐 Authentication System
- Login/Register with password support
- "Remember me" functionality
- Session management
- Auto-redirect based on login status

### 💬 Chat System
- Private one-on-one messaging
- Group chats with multiple members
- Real-time message display
- Message history persistence
- AI-simulated replies (optional)

### 👥 Social Features
- Friend requests system
- User profiles with avatars
- Contact management
- User search functionality

### 📊 Dashboard
- Recent chats overview
- Friends list
- Groups management
- Activity stream
- Quick navigation

### 🤖 RegentAI Assistant
- Context-aware help system
- Quick access floating button
- Task automation assistance

## File Structure

```
Regent Connect/
├── index.html          # Landing/splash page
├── login.html          # Authentication page
├── dashboard.html      # Main dashboard
├── chat.html          # Chat interface
└── README.md          # This file
```

## Data Storage

All data is stored in browser localStorage:

- `rc_users` - User accounts
- `rc_currentUser` - Active session
- `rc_msgs` - Chat messages
- `rc_reqs` - Friend requests
- `rc_groups` - Group chats
- `rc_remember` - Remember me flag

## Getting Started

1. Open `index.html` in your browser
2. You'll be redirected to login page
3. Register a new account or use demo credentials:
   - Username: **Philip**
   - Password: **demo123**
4. After login, you'll see the dashboard
5. Navigate to Chat to start messaging

## Demo Users

The system comes with pre-seeded demo users:
- **Philip** - Level 300 CS student
- **Nana** - Robotics Club member
- **Akosua** - STEMAID participant
- **Regent AI** - Bot assistant

## Features by Page

### Login Page (login.html)
- Login form with validation
- Registration form
- Password requirements
- Auto-redirect on success

### Dashboard (dashboard.html)
- Welcome section
- Recent chats preview
- Friends list
- Groups overview
- Activity stream
- Global search
- RegentAI assistant

### Chat Page (chat.html)
- User list with search
- Friend requests management
- Private messaging
- Group chat creation
- Message composer
- AI reply simulation
- Profile editing

## Technologies

- **HTML5** - Structure
- **CSS3** - Styling with gradients and animations
- **Vanilla JavaScript** - All functionality
- **localStorage API** - Data persistence

## Browser Support

Works in all modern browsers that support:
- localStorage
- ES6+ JavaScript
- CSS Grid/Flexbox

## Development

No build process required! Just open the HTML files in a browser.

For local development:
1. Use a local server (e.g., `xampp`, `live-server`)
2. Place files in public directory
3. Access via `localhost`

## Security Note

⚠️ This is a demo application using localStorage. In production:
- Implement proper backend authentication
- Use secure password hashing (bcrypt)
- Add JWT tokens for sessions
- Implement HTTPS
- Add input sanitization
- Use a real database

## Future Enhancements

- [ ] File/image sharing
- [ ] Voice messages
- [ ] Video calls
- [ ] Message encryption
- [ ] Push notifications
- [ ] Message reactions
- [ ] Read receipts
- [ ] Typing indicators
- [ ] Dark/Light theme toggle
- [ ] Export chat history

## License

Educational project - Free to use and modify

## Credits

Built for Regent University College of Science and Technology

---

**Version:** 1.0.0  
**Last Updated:** 2024
