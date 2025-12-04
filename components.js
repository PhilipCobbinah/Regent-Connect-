/**
 * Regent Connect - Component Loader
 * Loads reusable HTML components
 */

const ComponentLoader = {
  /**
   * Load header component
   */
  async loadHeader(targetSelector = '#appHeader') {
    const target = document.querySelector(targetSelector);
    if (!target) {
      console.warn('Header target element not found:', targetSelector);
      return;
    }
    
    try {
      const response = await fetch('./components/header.html');
      if (!response.ok) throw new Error('Failed to load header');
      const html = await response.text();
      target.innerHTML = html;
      
      // Execute any scripts in the loaded component
      this._executeScripts(target);
    } catch (error) {
      console.error('Error loading header:', error);
      // Fallback to simple header
      target.innerHTML = `
        <header class="site-header" style="background:rgba(255,255,255,0.03);padding:12px 24px;display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.04)">
          <a href="dashboard.html" style="text-decoration:none;color:inherit;font-weight:600">Regent Connect</a>
          <div style="display:flex;gap:12px">
            <a href="dashboard.html" style="text-decoration:none;color:inherit">Dashboard</a>
            <a href="profile.html" style="text-decoration:none;color:inherit">Profile</a>
          </div>
        </header>
      `;
    }
  },

  /**
   * Load sidebar component
   */
  async loadSidebar(targetSelector = '#appSidebar') {
    const target = document.querySelector(targetSelector);
    if (!target) {
      console.warn('Sidebar target element not found:', targetSelector);
      return;
    }
    
    try {
      const response = await fetch('./components/sidebar.html');
      if (!response.ok) throw new Error('Failed to load sidebar');
      const html = await response.text();
      target.innerHTML = html;
      
      // Execute any scripts in the loaded component
      this._executeScripts(target);
    } catch (error) {
      console.error('Error loading sidebar:', error);
      // Fallback to simple sidebar
      target.innerHTML = `
        <nav style="padding:16px">
          <ul style="list-style:none;padding:0">
            <li><a href="dashboard.html" style="display:block;padding:10px;text-decoration:none;color:inherit">Home</a></li>
            <li><a href="chat.html" style="display:block;padding:10px;text-decoration:none;color:inherit">Chat</a></li>
            <li><a href="profile.html" style="display:block;padding:10px;text-decoration:none;color:inherit">Profile</a></li>
          </ul>
        </nav>
      `;
    }
  },

  /**
   * Execute scripts in loaded component
   */
  _executeScripts(container) {
    const scripts = container.querySelectorAll('script');
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  },

  /**
   * Load all components
   */
  async loadAll() {
    const tasks = [];
    
    if (document.getElementById('appHeader')) {
      tasks.push(this.loadHeader());
    }
    
    if (document.getElementById('appSidebar')) {
      tasks.push(this.loadSidebar());
    }
    
    await Promise.all(tasks);
  }
};

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  window.ComponentLoader = ComponentLoader;
  
  // Auto-load on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ComponentLoader.loadAll();
    });
  } else {
    // DOM already loaded
    ComponentLoader.loadAll();
  }
}
