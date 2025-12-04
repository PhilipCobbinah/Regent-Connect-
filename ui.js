// UI utilities for Regent Connect

// Theme management
function initTheme() {
  const savedTheme = localStorage.getItem('rc_theme') || 'dark';
  const savedAccent = localStorage.getItem('rc_accent') || 'blue';
  
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.documentElement.setAttribute('data-accent', savedAccent);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('rc_theme', newTheme);
}

// Initialize theme on load
initTheme();

// Add theme toggle button if needed
if (document.querySelector('.auth-page')) {
  const themeToggle = document.createElement('button');
  themeToggle.className = 'theme-toggle';
  themeToggle.innerHTML = '🌙';
  themeToggle.title = 'Toggle theme';
  
  themeToggle.addEventListener('click', () => {
    toggleTheme();
    themeToggle.innerHTML = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
  });
  
  document.body.appendChild(themeToggle);
}

// Form validation helpers
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  return /^[+]?[\d\s-()]+$/.test(phone);
}

// Export for use in other scripts
window.rcUI = {
  initTheme,
  toggleTheme,
  validateEmail,
  validatePhone
};
