// Authentication module for Supabase integration

class Auth {
    constructor() {
        this.supabase = window.supabase;
        this.currentUser = null;
    }

    init() {
        const url = window.CONFIG.SUPABASE_URL;
        const key = window.CONFIG.SUPABASE_ANON_KEY;

        if (!url || !key) {
            console.error('❌ Supabase URL ou Key ausente!');
            return;
        }

        if (!window.supabase) {
            console.error('❌ Cliente Supabase não está disponível! Verifique o import.');
            return;
        }

        this.supabase = window.supabase;
        console.log('✅ Supabase client inicializado com sucesso!');

        this.checkExistingSession();
    }

    getSupabaseClient() {
        return this.supabase;
    }

    async checkExistingSession() {
        try {
            const storedUser = Utils.getLocalStorage('currentUser');
            if (storedUser && storedUser.expires) {
                const now = new Date().getTime();
                if (now < storedUser.expires) {
                    this.currentUser = storedUser;
                    this.showMainApp();
                    return;
                } if (!storedUser) {
    console.log('⚠️ Nenhum usuário encontrado no localStorage. Mostrando login...');
    this.showLogin();
    return;
}

            }
            this.showLogin();
        } catch (error) {
            console.error('Error checking session:', error);
            this.showLogin();
        }
    }

    async login(email, password) {
        try {
            const validCredentials = [
                { email: 'admin@barbearia.com', password: 'admin123', name: 'Administrador' },
                { email: 'barbeiro@barbearia.com', password: 'barbeiro123', name: 'Barbeiro' }
            ];

            const user = validCredentials.find(cred =>
                cred.email === email && cred.password === password
            );

            if (!user) {
                throw new Error('Email ou senha incorretos');
            }

            this.currentUser = {
                id: Date.now(),
                email: user.email,
                name: user.name,
                role: user.email.includes('admin') ? 'admin' : 'barbeiro'
            };

            Utils.setLocalStorage('currentUser', {
                ...this.currentUser,
                lastLogin: new Date().toISOString(),
                expires: new Date().getTime() + (24 * 60 * 60 * 1000) // 24 horas
            });

            Utils.showToast(`Bem-vindo, ${user.name}!`, 'success');
            this.showMainApp();
        } catch (error) {
            console.error('Login error:', error);
            this.showLoginError(error.message);
        }
    }

    async logout() {
        try {
            Utils.removeLocalStorage('currentUser');
            this.currentUser = null;
            Utils.showToast('Logout realizado com sucesso!', 'success');
            this.showLogin();
        } catch (error) {
            console.error('Logout error:', error);
            Utils.showToast('Erro ao fazer logout', 'error');
        }
    }

    showLogin() {
        document.getElementById('loading-screen')?.classList.add('hidden');
        document.getElementById('main-app')?.classList.add('hidden');
        document.getElementById('login-screen')?.classList.remove('hidden');
        this.setupLoginForm();
    }

    showMainApp() {
        document.getElementById('loading-screen')?.classList.add('hidden');
        document.getElementById('login-screen')?.classList.add('hidden');
        document.getElementById('main-app')?.classList.remove('hidden');

        if (window.Main) {
            window.Main.init();
        }
    }

    setupLoginForm() {
        const loginForm = document.getElementById('login-form');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = emailInput.value.trim();
                const password = passwordInput.value.trim();

                if (!email || !password) {
                    this.showLoginError('Por favor, preencha todos os campos.');
                    return;
                }

                if (!Utils.validateEmail(email)) {
                    this.showLoginError('Por favor, digite um email válido.');
                    return;
                }

                const submitBtn = loginForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.innerHTML = '<div class="loading-spinner" style="width: 20px; height: 20px;"></div>';
                submitBtn.disabled = true;

                try {
                    await this.login(email, password);
                } finally {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            });
        }
    }

    showLoginError(message) {
        const errorElement = document.getElementById('login-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
            setTimeout(() => errorElement.classList.add('hidden'), 5000);
        }
    }

    getErrorMessage(error) {
        const errorMessages = {
            'Invalid login credentials': 'Email ou senha incorretos.',
            'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
            'Too many requests': 'Muitas tentativas. Tente novamente em alguns minutos.',
            'User not found': 'Usuário não encontrado.',
            'Invalid email': 'Email inválido.',
            'Password is too short': 'Senha muito curta. Mínimo 6 caracteres.',
            'Network error': 'Erro de conexão. Verifique sua internet.',
        };

        return errorMessages[error.message] || error.message || 'Erro desconhecido. Tente novamente.';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }
}

// Instancia global
window.Auth = new Auth();
