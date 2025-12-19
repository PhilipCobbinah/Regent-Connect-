/* ============================================================
   ui.js – Animations, helpers, floating assistant
   UI utilities and effects for Regent Connect
   ============================================================ */

const UI = {
    /**
     * Initialize all UI components
     */
    init() {
        this.initFloatingAI();
        this.initToastContainer();
        this.initKeyboardShortcuts();
        console.log('🎨 UI utilities initialized');
    },

    /**
     * Initialize floating AI assistant button
     */
    initFloatingAI() {
        // Check if already exists
        if (document.querySelector('.floating-ai-btn')) return;

        const btn = document.createElement('div');
        btn.className = 'floating-ai-btn';
        btn.innerHTML = '🤖';
        btn.title = 'Open RegentAI';
        btn.onclick = () => window.location.href = 'ai.html';

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .floating-ai-btn {
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, var(--accent, #4f46e5), #06b6d4);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;
                cursor: pointer;
                box-shadow: 0 8px 24px rgba(79, 70, 229, 0.4);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 1000;
                animation: float 3s ease-in-out infinite;
            }
            
            .floating-ai-btn:hover {
                transform: translateY(-4px) scale(1.1);
                box-shadow: 0 12px 32px rgba(79, 70, 229, 0.6);
            }
            
            .floating-ai-btn:active {
                transform: translateY(-2px) scale(1.05);
            }
            
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }
            
            @media (max-width: 768px) {
                .floating-ai-btn {
                    bottom: 16px;
                    right: 16px;
                    width: 52px;
                    height: 52px;
                    font-size: 24px;
                }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(btn);
    },

    /**
     * Initialize toast notification container
     */
    initToastContainer() {
        if (document.getElementById('toast-container')) return;

        const container = document.createElement('div');
        container.id = 'toast-container';
        
        const style = document.createElement('style');
        style.textContent = `
            #toast-container {
                position: fixed;
                top: 24px;
                right: 24px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-width: 400px;
            }
            
            .toast {
                padding: 16px 20px;
                border-radius: 12px;
                background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.9));
                color: #1f2937;
                box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                backdrop-filter: blur(10px);
                animation: slideIn 0.3s ease-out;
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 14px;
                font-weight: 500;
            }
            
            .toast.success { border-left: 4px solid #10b981; }
            .toast.error { border-left: 4px solid #ef4444; }
            .toast.info { border-left: 4px solid #3b82f6; }
            .toast.warning { border-left: 4px solid #f59e0b; }
            
            .toast-icon { font-size: 20px; }
            .toast-message { flex: 1; }
            .toast-close {
                background: none;
                border: none;
                color: #6b7280;
                cursor: pointer;
                font-size: 18px;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @media (max-width: 768px) {
                #toast-container {
                    top: 16px;
                    right: 16px;
                    left: 16px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(container);
    },

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type (success, error, info, warning)
     * @param {number} duration - Duration in ms
     */
    toast(message, type = 'info', duration = 3000) {
        this.initToastContainer();

        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ',
            warning: '⚠'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close">×</button>
        `;

        container.appendChild(toast);

        // Close button
        toast.querySelector('.toast-close').onclick = () => {
            toast.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        };

        // Auto remove
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    },

    /**
     * Typewriter animation effect
     * @param {HTMLElement} element - Element to type into
     * @param {string} text - Text to type
     * @param {number} speed - Speed in ms per character
     * @returns {Promise} Resolves when complete
     */
    typeEffect(element, text, speed = 30) {
        return new Promise((resolve) => {
            let i = 0;
            element.textContent = '';
            
            const interval = setInterval(() => {
                if (i < text.length) {
                    element.textContent += text[i];
                    i++;
                } else {
                    clearInterval(interval);
                    resolve();
                }
            }, speed);
        });
    },

    /**
     * Fade in animation
     * @param {HTMLElement} element - Element to fade in
     * @param {number} duration - Duration in ms
     */
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.transition = `opacity ${duration}ms ease-in`;
        
        setTimeout(() => {
            element.style.opacity = '1';
        }, 10);
    },

    /**
     * Fade out animation
     * @param {HTMLElement} element - Element to fade out
     * @param {number} duration - Duration in ms
     * @returns {Promise} Resolves when complete
     */
    fadeOut(element, duration = 300) {
        return new Promise((resolve) => {
            element.style.opacity = '1';
            element.style.transition = `opacity ${duration}ms ease-out`;
            element.style.opacity = '0';
            
            setTimeout(() => {
                resolve();
            }, duration);
        });
    },

    /**
     * Slide animation
     * @param {HTMLElement} element - Element to slide
     * @param {string} direction - Direction (up, down, left, right)
     * @param {number} duration - Duration in ms
     */
    slide(element, direction = 'up', duration = 300) {
        const transforms = {
            up: 'translateY(-20px)',
            down: 'translateY(20px)',
            left: 'translateX(-20px)',
            right: 'translateX(20px)'
        };

        element.style.transform = transforms[direction];
        element.style.opacity = '0';
        element.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        
        setTimeout(() => {
            element.style.transform = 'none';
            element.style.opacity = '1';
        }, 10);
    },

    /**
     * Show loading spinner
     * @param {string} message - Loading message
     * @returns {Function} Function to hide loader
     */
    showLoader(message = 'Loading...') {
        const loader = document.createElement('div');
        loader.id = 'app-loader';
        loader.innerHTML = `
            <div class="loader-backdrop">
                <div class="loader-content">
                    <div class="spinner"></div>
                    <p>${message}</p>
                </div>
            </div>
        `;

        const style = document.createElement('style');
        style.id = 'loader-styles';
        style.textContent = `
            .loader-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            
            .loader-content {
                text-align: center;
                color: white;
            }
            
            .spinner {
                width: 48px;
                height: 48px;
                border: 4px solid rgba(255,255,255,0.1);
                border-top-color: var(--accent, #4f46e5);
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                margin: 0 auto 16px;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(loader);

        return () => {
            loader.remove();
            document.getElementById('loader-styles')?.remove();
        };
    },

    /**
     * Confirm dialog
     * @param {string} message - Confirmation message
     * @param {Object} options - Options (title, confirmText, cancelText)
     * @returns {Promise<boolean>} User's choice
     */
    confirm(message, options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Confirm',
                confirmText = 'Confirm',
                cancelText = 'Cancel'
            } = options;

            const modal = document.createElement('div');
            modal.className = 'confirm-modal';
            modal.innerHTML = `
                <div class="confirm-backdrop">
                    <div class="confirm-dialog">
                        <h3>${title}</h3>
                        <p>${message}</p>
                        <div class="confirm-actions">
                            <button class="btn-cancel">${cancelText}</button>
                            <button class="btn-confirm">${confirmText}</button>
                        </div>
                    </div>
                </div>
            `;

            const style = document.createElement('style');
            style.textContent = `
                .confirm-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    animation: fadeIn 0.2s ease-out;
                }
                
                .confirm-dialog {
                    background: linear-gradient(180deg, rgba(15,23,36,0.98), rgba(11,18,32,0.98));
                    padding: 24px;
                    border-radius: 16px;
                    max-width: 400px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.6);
                    animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .confirm-dialog h3 {
                    margin: 0 0 12px 0;
                    font-size: 20px;
                    color: #e6eef8;
                }
                
                .confirm-dialog p {
                    margin: 0 0 20px 0;
                    color: #94a3b8;
                    line-height: 1.5;
                }
                
                .confirm-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }
                
                .confirm-actions button {
                    padding: 10px 20px;
                    border-radius: 8px;
                    border: none;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .btn-cancel {
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    color: #94a3b8;
                }
                
                .btn-cancel:hover {
                    background: rgba(255,255,255,0.05);
                }
                
                .btn-confirm {
                    background: var(--accent, #4f46e5);
                    color: white;
                }
                
                .btn-confirm:hover {
                    background: #4338ca;
                }
                
                @keyframes slideUp {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `;

            document.head.appendChild(style);
            document.body.appendChild(modal);

            const cleanup = () => {
                modal.remove();
                style.remove();
            };

            modal.querySelector('.btn-cancel').onclick = () => {
                cleanup();
                resolve(false);
            };

            modal.querySelector('.btn-confirm').onclick = () => {
                cleanup();
                resolve(true);
            };

            modal.querySelector('.confirm-backdrop').onclick = (e) => {
                if (e.target === e.currentTarget) {
                    cleanup();
                    resolve(false);
                }
            };
        });
    },

    /**
     * Initialize keyboard shortcuts
     */
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K - Open AI
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                window.location.href = 'ai.html';
            }
            
            // Escape - Close modals
            if (e.key === 'Escape') {
                document.querySelector('.modal-backdrop')?.remove();
                document.querySelector('.confirm-modal')?.remove();
            }
        });
    },

    /**
     * Copy to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} Success status
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.toast('Copied to clipboard!', 'success', 2000);
            return true;
        } catch (err) {
            this.toast('Failed to copy', 'error', 2000);
            return false;
        }
    },

    /**
     * Format time ago
     * @param {Date|string|number} date - Date to format
     * @returns {string} Formatted time
     */
    timeAgo(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
        if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
        if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
        
        return new Date(date).toLocaleDateString();
    }
};

// Auto-initialize on DOM load
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => UI.init());
    } else {
        UI.init();
    }
    
    // Global access
    window.UI = UI;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UI };
}
