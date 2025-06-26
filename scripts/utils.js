// Utility functions for the barbershop management system

class Utils {
    // Date formatting utilities
    static formatDate(date, format = 'DD/MM/YYYY') {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        
        switch (format) {
            case 'DD/MM/YYYY':
                return `${day}/${month}/${year}`;
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'readable':
                return d.toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            default:
                return d.toLocaleDateString('pt-BR');
        }
    }

    static formatTime(time) {
        if (!time) return '';
        return time.slice(0, 5); // HH:MM format
    }

    static formatCurrency(amount) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(amount || 0);
    }

    // Local storage utilities
    static setLocalStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    static getLocalStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }

    static removeLocalStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    }

    // Theme utilities
    static setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.setLocalStorage('theme', theme);
        
        // Update theme toggle icon
        const themeIcon = document.querySelector('#theme-toggle-btn i');
        if (themeIcon) {
            themeIcon.setAttribute('data-feather', 
                theme === 'dark' ? 'sun' : 
                theme === 'light' ? 'moon' : 'palette'
            );
            feather.replace();
        }
    }

    static getTheme() {
        return this.getLocalStorage('theme', 'dark');
    }

    static cycleTheme() {
        const themes = ['dark', 'light', 'colorful'];
        const current = this.getTheme();
        const currentIndex = themes.indexOf(current);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.setTheme(themes[nextIndex]);
    }

    // Font size utilities
    static setFontSize(size) {
        const validSizes = ['small', 'normal', 'large', 'extra-large'];
        if (!validSizes.includes(size)) return;
        
        document.body.className = document.body.className
            .replace(/font-size-\w+/g, '')
            .trim();
        document.body.classList.add(`font-size-${size}`);
        
        this.setLocalStorage('fontSize', size);
        this.updateFontSizeDisplay();
    }

    static getFontSize() {
        return this.getLocalStorage('fontSize', 'normal');
    }

    static updateFontSizeDisplay() {
        const fontSize = this.getFontSize();
        const sizeMap = {
            'small': '90%',
            'normal': '100%',
            'large': '110%',
            'extra-large': '120%'
        };
        
        const display = document.getElementById('font-current');
        if (display) {
            display.textContent = sizeMap[fontSize];
        }
    }

    static increaseFontSize() {
        const sizes = ['small', 'normal', 'large', 'extra-large'];
        const current = this.getFontSize();
        const currentIndex = sizes.indexOf(current);
        if (currentIndex < sizes.length - 1) {
            this.setFontSize(sizes[currentIndex + 1]);
        }
    }

    static decreaseFontSize() {
        const sizes = ['small', 'normal', 'large', 'extra-large'];
        const current = this.getFontSize();
        const currentIndex = sizes.indexOf(current);
        if (currentIndex > 0) {
            this.setFontSize(sizes[currentIndex - 1]);
        }
    }

    // Modal utilities
    static showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    static hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    // Toast notifications
    static showToast(message, type = 'info', duration = 3000) {
        // Remove existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i data-feather="${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add CSS for toast
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: var(--card-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 16px 20px;
                    box-shadow: var(--shadow-lg);
                    z-index: 10000;
                    backdrop-filter: blur(10px);
                    animation: toastSlideIn 0.3s ease;
                }
                .toast-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: var(--text-primary);
                    font-weight: 500;
                }
                .toast-success { border-left: 4px solid var(--success-text); }
                .toast-error { border-left: 4px solid var(--error-text); }
                .toast-warning { border-left: 4px solid var(--warning-text); }
                .toast-info { border-left: 4px solid var(--accent-primary); }
                @keyframes toastSlideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes toastSlideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);
        feather.replace();

        // Auto remove toast
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'toastSlideOut 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);

        // Click to dismiss
        toast.addEventListener('click', () => {
            toast.style.animation = 'toastSlideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        });
    }

    static getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'x-circle',
            warning: 'alert-triangle',
            info: 'info'
        };
        return icons[type] || 'info';
    }

    // Validation utilities
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validatePhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 11;
    }

    static validateTime(time) {
        const re = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return re.test(time);
    }

    // DOM utilities
    static createElement(tag, className, content) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) element.innerHTML = content;
        return element;
    }

    static debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // Error handling
    static handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        this.showToast(
            `Erro: ${error.message || 'Algo deu errado. Tente novamente.'}`,
            'error'
        );
    }

    // Loading states
    static showLoading(element, text = 'Carregando...') {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (!element) return;

        element.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <p>${text}</p>
            </div>
        `;
        element.classList.add('loading');
    }

    static hideLoading(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (!element) return;

        element.classList.remove('loading');
    }

    // Chart color utilities
    static getBarberColor(barber) {
        const colors = {
            renne: '#00d4ff',
            lele: '#ffc107',
            all: '#8b5cf6'
        };
        return colors[barber] || colors.all;
    }

    static getStatusColor(status) {
        const colors = {
            agendado: '#00d4ff',
            realizado: '#22c55e',
            cancelado: '#ef4444'
        };
        return colors[status] || colors.agendado;
    }
}

// Export for use in other modules
window.Utils = Utils;
