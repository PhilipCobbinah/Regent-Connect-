// Authentication logic for Regent Connect

const AUTH_STORAGE_KEY = 'rc_auth';
const USERS_STORAGE_KEY = 'rc_users';

// Initialize users storage
function initStorage() {
  if (!localStorage.getItem(USERS_STORAGE_KEY)) {
    const defaultUsers = [
      {
        id: generateId(),
        name: 'Philip',
        identifier: '+233201234567',
        password: 'password123',
        bio: 'Level 300 — CS',
        avatarColor: '#ef4444',
        friends: []
      }
    ];
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
  }
}

initStorage();

// Handle login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const identifier = document.getElementById('loginIdentifier').value.trim();
  const password = document.getElementById('loginPassword').value;
  const remember = document.getElementById('remember').checked;

  try {
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    const user = users.find(u => 
      (u.identifier === identifier || u.name.toLowerCase() === identifier.toLowerCase()) && 
      u.password === password
    );

    if (!user) {
      showError('Invalid credentials. Please try again.');
      return;
    }

    // Store auth session
    const authData = {
      userId: user.id,
      name: user.name,
      identifier: user.identifier,
      avatarColor: user.avatarColor,
      remember
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    localStorage.setItem('rc_currentUser', JSON.stringify(user));

    // Redirect to chat
    window.location.href = 'chat.html';
  } catch (error) {
    showError('Login failed. Please try again.');
    console.error('Login error:', error);
  }
});

// Handle registration
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('regName').value.trim();
  const identifier = document.getElementById('regIdentifier').value.trim();
  const password = document.getElementById('regPassword').value;
  const bio = document.getElementById('regBio').value.trim();

  if (!name || !identifier || !password) {
    showError('Please fill in all required fields.');
    return;
  }

  if (password.length < 6) {
    showError('Password must be at least 6 characters.');
    return;
  }

  try {
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');

    // Check if user exists
    if (users.find(u => u.identifier === identifier)) {
      showError('This email/phone is already registered.');
      return;
    }

    // Create new user
    const newUser = {
      id: generateId(),
      name,
      identifier,
      password,
      bio: bio || '',
      avatarColor: getRandomColor(),
      friends: [],
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    // Auto login
    const authData = {
      userId: newUser.id,
      name: newUser.name,
      identifier: newUser.identifier,
      avatarColor: newUser.avatarColor,
      remember: true
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    localStorage.setItem('rc_currentUser', JSON.stringify(newUser));

    showSuccess('Account created successfully! Redirecting...');
    
    setTimeout(() => {
      window.location.href = 'chat.html';
    }, 1500);
  } catch (error) {
    showError('Registration failed. Please try again.');
    console.error('Registration error:', error);
  }
});

// Utility functions
function generateId(prefix = 'u') {
  return prefix + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function getRandomColor() {
  const colors = ['#ef4444', '#f97316', '#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function showError(message) {
  showNotification(message, 'error');
}

function showSuccess(message) {
  showNotification(message, 'success');
}

function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    background: ${type === 'error' ? 'var(--error)' : type === 'success' ? 'var(--success)' : 'var(--accent)'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    animation: slideDown 0.3s ease-out;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideUp 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
  
  @keyframes slideUp {
    from {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    to {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
  }
`;
document.head.appendChild(style);
