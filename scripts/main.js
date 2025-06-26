// Main application controller - orchestrates all modules and handles navigation

class Main {
    constructor() {
        this.currentTab = 'dashboard';
        this.modules = {};
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        
        try {
            this.setupTheme();
            this.setupFontSize();
            this.setupNavigation();
            this.setupAccessibilityControls();
            this.setupUserMenu();
            this.initializeModules();
            this.setupGlobalEventListeners();
            
            // Initialize feather icons
            feather.replace();
            
            this.initialized = true;
            Utils.showToast('Sistema carregado com sucesso!', 'success');
        } catch (error) {
            Utils.handleError(error, 'Main.init');
        }
    }

    setupTheme() {
        const savedTheme = Utils.getTheme();
        Utils.setTheme(savedTheme);
    }

    setupFontSize() {
        const savedFontSize = Utils.getFontSize();
        Utils.setFontSize(savedFontSize);
    }

    setupNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        console.log('Setting up navigation with', tabButtons.length, 'buttons');

        tabButtons.forEach((button, index) => {
            console.log('Setting up button', index, 'with data-tab:', button.getAttribute('data-tab'));
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const tabName = button.getAttribute('data-tab');
                console.log('Button clicked:', tabName);
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.tab) {
                this.switchTab(e.state.tab, false);
            }
        });

        // Set initial state
        const urlParams = new URLSearchParams(window.location.search);
        const initialTab = urlParams.get('tab') || 'dashboard';
        this.switchTab(initialTab, false);
    }

    switchTab(tabName, updateHistory = true) {
        if (this.currentTab === tabName) return;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
        });

        // Update tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        // Update browser history
        if (updateHistory) {
            const url = new URL(window.location);
            url.searchParams.set('tab', tabName);
            window.history.pushState({ tab: tabName }, '', url);
        }

        // Initialize module if needed
        this.initializeTabModule(tabName);

        this.currentTab = tabName;

        // Analytics/tracking could go here
        this.trackTabChange(tabName);
    }

    initializeTabModule(tabName) {
        switch (tabName) {
            case 'dashboard':
                if (!this.modules.dashboard) {
                    this.modules.dashboard = window.Dashboard;
                    this.modules.dashboard.init();
                }
                break;
            case 'agenda':
                if (!this.modules.agenda) {
                    this.modules.agenda = window.Agenda;
                    this.modules.agenda.init();
                }
                break;
            case 'barbeiros':
                if (!this.modules.barbeiros) {
                    this.modules.barbeiros = window.Barbeiros;
                    this.modules.barbeiros.init();
                }
                break;
            case 'relatorios':
                if (!this.modules.relatorios) {
                    this.modules.relatorios = window.Relatorios;
                    this.modules.relatorios.init();
                }
                break;
            case 'avisos':
                if (!this.modules.avisos) {
                    this.modules.avisos = window.Avisos;
                    this.modules.avisos.init();
                }
                break;
        }
    }

    initializeModules() {
        // Initialize dashboard by default
        this.initializeTabModule('dashboard');
    }

    setupAccessibilityControls() {
        // Font size control
        const fontSizeBtn = document.getElementById('font-size-btn');
        if (fontSizeBtn) {
            fontSizeBtn.addEventListener('click', () => {
                this.showFontSizeModal();
            });
        }

        // Font size modal controls
        const fontIncrease = document.getElementById('font-increase');
        const fontDecrease = document.getElementById('font-decrease');
        
        if (fontIncrease) {
            fontIncrease.addEventListener('click', () => {
                Utils.increaseFontSize();
            });
        }
        
        if (fontDecrease) {
            fontDecrease.addEventListener('click', () => {
                Utils.decreaseFontSize();
            });
        }

        // Theme toggle
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                Utils.cycleTheme();
            });
        }

        // Global font size modal functions
        window.closeFontSizeModal = () => {
            Utils.hideModal('font-size-modal');
        };
    }

    showFontSizeModal() {
        Utils.updateFontSizeDisplay();
        Utils.showModal('font-size-modal');
    }

    setupUserMenu() {
        const userMenuBtn = document.getElementById('user-menu-btn');
        const userDropdown = document.getElementById('user-dropdown');
        const logoutBtn = document.getElementById('logout-btn');

        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('hidden');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.add('hidden');
                }
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    async logout() {
        try {
            await window.Auth.logout();
        } catch (error) {
            Utils.handleError(error, 'logout');
        }
    }

    setupGlobalEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Handle window resize for responsive adjustments
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));

        // Handle visibility change for auto-refresh
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Global modal close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + number keys for tab switching
        if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '5') {
            e.preventDefault();
            const tabs = ['dashboard', 'agenda', 'barbeiros', 'relatorios', 'avisos'];
            const tabIndex = parseInt(e.key) - 1;
            if (tabs[tabIndex]) {
                this.switchTab(tabs[tabIndex]);
            }
        }

        // Alt + T for theme toggle
        if (e.altKey && e.key.toLowerCase() === 't') {
            e.preventDefault();
            Utils.cycleTheme();
        }

        // Alt + F for font size
        if (e.altKey && e.key.toLowerCase() === 'f') {
            e.preventDefault();
            this.showFontSizeModal();
        }
    }

    handleResize() {
        // Trigger resize events on modules that need it
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.handleResize === 'function') {
                module.handleResize();
            }
        });
    }

    handleVisibilityChange() {
        if (!document.hidden) {
            // Page became visible, refresh current module
            const currentModule = this.modules[this.currentTab];
            if (currentModule && typeof currentModule.refresh === 'function') {
                currentModule.refresh();
            }
        }
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
        });
        document.body.style.overflow = '';
    }

    trackTabChange(tabName) {
        // This could integrate with analytics services
        console.log(`Tab changed to: ${tabName}`);
        
        // Update document title
        const titles = {
            dashboard: 'Dashboard',
            agenda: 'Agenda',
            barbeiros: 'Barbeiros',
            relatorios: 'Relatórios',
            avisos: 'Avisos'
        };
        
        document.title = `${titles[tabName] || 'Sistema'} - Barbearia`;
    }

    // Public methods for other modules to use
    getCurrentTab() {
        return this.currentTab;
    }

    getModule(moduleName) {
        return this.modules[moduleName];
    }

    refreshCurrentModule() {
        const currentModule = this.modules[this.currentTab];
        if (currentModule && typeof currentModule.refresh === 'function') {
            currentModule.refresh();
        }
    }

    // Error boundary
    handleGlobalError(error, context) {
        console.error('Global error:', error, 'Context:', context);
        Utils.showToast(
            'Ocorreu um erro inesperado. A página será recarregada.',
            'error',
            5000
        );
        
        // Auto-reload after severe errors
        setTimeout(() => {
            window.location.reload();
        }, 5000);
    }

    // Cleanup method
    destroy() {
        // Clean up modules
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.destroy === 'function') {
                module.destroy();
            }
        });

        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyboardShortcuts);
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
}

// Create global instance
window.Main = new Main();

// Global error handler
window.addEventListener('error', (e) => {
    window.Main.handleGlobalError(e.error, 'Global error event');
});

window.addEventListener('unhandledrejection', (e) => {
    window.Main.handleGlobalError(e.reason, 'Unhandled promise rejection');
});

