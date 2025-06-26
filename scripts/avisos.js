// Avisos (Notices) management module for bot communication

class Avisos {
    constructor() {
        this.supabase = null;
        this.currentNotice = null;
        this.noticesHistory = [];
    }

    init() {
        this.supabase = window.Auth.getSupabaseClient();
        this.setupEventListeners();
        this.loadCurrentNotice();
        this.loadNoticesHistory();
    }

    setupEventListeners() {
        const noticeForm = document.getElementById('notice-form');
        const clearNoticeBtn = document.getElementById('clear-notice-btn');

        if (noticeForm) {
            noticeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateNotice();
            });
        }

        if (clearNoticeBtn) {
            clearNoticeBtn.addEventListener('click', () => {
                this.clearNotice();
            });
        }
    }

    async loadCurrentNotice() {
        try {
            // Try to load from Supabase 'avisos' table
            const { data, error } = await this.supabase
                .from('avisos')
                .select('*')
                .eq('ativo', true)
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) {
                console.log('Avisos table might not exist:', error);
                this.currentNotice = this.getDefaultNotice();
            } else {
                this.currentNotice = data && data.length > 0 ? data[0] : this.getDefaultNotice();
            }

            this.renderCurrentNotice();
        } catch (error) {
            console.error('Error loading current notice:', error);
            this.currentNotice = this.getDefaultNotice();
            this.renderCurrentNotice();
        }
    }

    async loadNoticesHistory() {
        try {
            // Try to load history from Supabase
            const { data, error } = await this.supabase
                .from('avisos')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) {
                console.log('Avisos table might not exist:', error);
                this.noticesHistory = this.getDefaultHistory();
            } else {
                this.noticesHistory = data || this.getDefaultHistory();
            }

            this.renderNoticesHistory();
        } catch (error) {
            console.error('Error loading notices history:', error);
            this.noticesHistory = this.getDefaultHistory();
            this.renderNoticesHistory();
        }
    }

    getDefaultNotice() {
        return {
            id: 1,
            titulo: 'Sistema Funcionando',
            mensagem: 'Olá! Nosso sistema de agendamento está funcionando normalmente. Você pode agendar seu horário pelo WhatsApp.',
            ativo: true,
            created_at: new Date().toISOString(),
            created_by: 'Sistema'
        };
    }

    getDefaultHistory() {
        return [
            {
                id: 1,
                titulo: 'Sistema Funcionando',
                mensagem: 'Olá! Nosso sistema de agendamento está funcionando normalmente. Você pode agendar seu horário pelo WhatsApp.',
                ativo: true,
                created_at: new Date().toISOString(),
                created_by: 'Sistema'
            },
            {
                id: 2,
                titulo: 'Horário Especial',
                mensagem: 'Durante o mês de dezembro, funcionaremos em horário especial. Consulte nossa disponibilidade.',
                ativo: false,
                created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
                created_by: 'Admin'
            }
        ];
    }

    renderCurrentNotice() {
        const container = document.getElementById('current-notice');
        if (!container) return;

        if (!this.currentNotice || !this.currentNotice.ativo) {
            container.innerHTML = `
                <div class="notice-empty">
                    <i data-feather="bell-off"></i>
                    <p>Nenhum aviso ativo no momento</p>
                    <small>Configure um aviso para ser exibido no bot</small>
                </div>
            `;
            feather.replace();
            return;
        }

        container.innerHTML = `
            <div class="notice-active">
                <div class="notice-header">
                    <div class="notice-status">
                        <i data-feather="bell"></i>
                        <span class="status-badge status-active">Ativo</span>
                    </div>
                    <small class="notice-date">
                        ${Utils.formatDate(this.currentNotice.created_at, 'readable')}
                    </small>
                </div>
                
                ${this.currentNotice.titulo ? `
                    <h4 class="notice-title">${this.escapeHtml(this.currentNotice.titulo)}</h4>
                ` : ''}
                
                <div class="notice-message">
                    ${this.formatNoticeMessage(this.currentNotice.mensagem)}
                </div>
                
                <div class="notice-meta">
                    <small>Por: ${this.escapeHtml(this.currentNotice.created_by || 'Sistema')}</small>
                </div>
            </div>
        `;

        feather.replace();
    }

    renderNoticesHistory() {
        const container = document.getElementById('notices-history');
        if (!container) return;

        if (this.noticesHistory.length === 0) {
            container.innerHTML = `
                <div class="history-empty">
                    <i data-feather="clock"></i>
                    <p>Nenhum histórico disponível</p>
                </div>
            `;
            feather.replace();
            return;
        }

        const historyHtml = this.noticesHistory.map(notice => `
            <div class="history-item ${notice.ativo ? 'active' : 'inactive'}">
                <div class="history-header">
                    <div class="history-status">
                        <i data-feather="${notice.ativo ? 'bell' : 'bell-off'}"></i>
                        <span class="status-badge ${notice.ativo ? 'status-active' : 'status-inactive'}">
                            ${notice.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                    <small class="history-date">
                        ${Utils.formatDate(notice.created_at)}
                    </small>
                </div>
                
                ${notice.titulo ? `
                    <h5 class="history-title">${this.escapeHtml(notice.titulo)}</h5>
                ` : ''}
                
                <div class="history-message">
                    ${this.formatNoticeMessage(notice.mensagem, true)}
                </div>
                
                <div class="history-actions">
                    <button class="action-btn" onclick="window.Avisos.restoreNotice(${notice.id})" 
                            title="Reativar este aviso">
                        <i data-feather="rotate-ccw"></i>
                    </button>
                    <button class="action-btn danger" onclick="window.Avisos.deleteNotice(${notice.id})" 
                            title="Excluir aviso">
                        <i data-feather="trash-2"></i>
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = historyHtml;
        this.addAvisosStyles();
        feather.replace();
    }

    escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    formatNoticeMessage(message, truncate = false) {
        if (!message) return '';
        
        // Escape HTML characters to prevent XSS
        let formatted = this.escapeHtml(message);
        
        // Convert line breaks to HTML
        formatted = formatted.replace(/\n/g, '<br>');
        
        // Truncate for history if needed
        if (truncate && formatted.length > 150) {
            formatted = formatted.substring(0, 150) + '...';
        }
        
        return formatted;
    }

    async updateNotice() {
        try {
            const noticeText = document.getElementById('notice-text').value.trim();
            
            if (!noticeText) {
                Utils.showToast('Por favor, digite uma mensagem para o aviso.', 'warning');
                return;
            }

            // Show loading
            const submitBtn = document.querySelector('#notice-form button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<div class="loading-spinner" style="width: 16px; height: 16px; margin: 0 auto;"></div>';
            submitBtn.disabled = true;

            const noticeData = {
                titulo: 'Aviso da Barbearia',
                mensagem: noticeText,
                ativo: true,
                created_at: new Date().toISOString(),
                created_by: window.Auth.getCurrentUser()?.email || 'Admin'
            };

            // First, deactivate current notice
            if (this.currentNotice && this.currentNotice.ativo) {
                await this.deactivateCurrentNotice();
            }

            // Try to insert new notice
            try {
                const { data, error } = await this.supabase
                    .from('avisos')
                    .insert(noticeData)
                    .select();

                if (error) throw error;

                this.currentNotice = data[0];
                Utils.showToast('Aviso atualizado com sucesso!', 'success');
            } catch (error) {
                console.log('Creating notice locally (table may not exist):', error);
                // Create locally if table doesn't exist
                const newNotice = {
                    ...noticeData,
                    id: Math.max(...this.noticesHistory.map(n => n.id), 0) + 1
                };
                
                this.currentNotice = newNotice;
                this.noticesHistory.unshift(newNotice);
                
                Utils.showToast('Aviso atualizado localmente!', 'success');
            }

            // Clear form
            document.getElementById('notice-text').value = '';
            
            // Refresh displays
            this.loadCurrentNotice();
            this.loadNoticesHistory();

        } catch (error) {
            Utils.handleError(error, 'updateNotice');
        } finally {
            // Restore button
            const submitBtn = document.querySelector('#notice-form button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i data-feather="send"></i> Atualizar Aviso';
                submitBtn.disabled = false;
                feather.replace();
            }
        }
    }

    async deactivateCurrentNotice() {
        if (!this.currentNotice || !this.currentNotice.id) return;

        try {
            const { error } = await this.supabase
                .from('avisos')
                .update({ ativo: false })
                .eq('id', this.currentNotice.id);

            if (error) {
                console.log('Deactivating notice locally:', error);
                // Update locally if needed
                const index = this.noticesHistory.findIndex(n => n.id === this.currentNotice.id);
                if (index !== -1) {
                    this.noticesHistory[index].ativo = false;
                }
            }
        } catch (error) {
            console.error('Error deactivating current notice:', error);
        }
    }

    async clearNotice() {
        if (!confirm('Deseja realmente limpar o aviso atual? Ele ficará inativo.')) return;

        try {
            if (this.currentNotice && this.currentNotice.ativo) {
                await this.deactivateCurrentNotice();
                this.currentNotice.ativo = false;
            }

            document.getElementById('notice-text').value = '';
            Utils.showToast('Aviso limpo com sucesso!', 'success');
            
            this.loadCurrentNotice();
            this.loadNoticesHistory();
        } catch (error) {
            Utils.handleError(error, 'clearNotice');
        }
    }

    async restoreNotice(noticeId) {
        if (!confirm('Deseja reativar este aviso? Ele substituirá o aviso atual.')) return;

        try {
            const notice = this.noticesHistory.find(n => n.id === noticeId);
            if (!notice) return;

            // Deactivate current notice
            if (this.currentNotice && this.currentNotice.ativo) {
                await this.deactivateCurrentNotice();
            }

            // Activate selected notice
            try {
                const { error } = await this.supabase
                    .from('avisos')
                    .update({ ativo: true })
                    .eq('id', noticeId);

                if (error) throw error;
                
                Utils.showToast('Aviso reativado com sucesso!', 'success');
            } catch (error) {
                console.log('Restoring notice locally:', error);
                // Update locally
                this.noticesHistory.forEach(n => n.ativo = false);
                notice.ativo = true;
                this.currentNotice = notice;
                
                Utils.showToast('Aviso reativado localmente!', 'success');
            }

            this.loadCurrentNotice();
            this.loadNoticesHistory();
        } catch (error) {
            Utils.handleError(error, 'restoreNotice');
        }
    }

    async deleteNotice(noticeId) {
        if (!confirm('Deseja realmente excluir este aviso? Esta ação não pode ser desfeita.')) return;

        try {
            const notice = this.noticesHistory.find(n => n.id === noticeId);
            if (!notice) return;

            // Don't allow deleting active notice
            if (notice.ativo) {
                Utils.showToast('Não é possível excluir o aviso ativo. Desative-o primeiro.', 'warning');
                return;
            }

            try {
                const { error } = await this.supabase
                    .from('avisos')
                    .delete()
                    .eq('id', noticeId);

                if (error) throw error;
                
                Utils.showToast('Aviso excluído com sucesso!', 'success');
            } catch (error) {
                console.log('Deleting notice locally:', error);
                // Remove locally
                this.noticesHistory = this.noticesHistory.filter(n => n.id !== noticeId);
                
                Utils.showToast('Aviso excluído localmente!', 'success');
            }

            this.loadNoticesHistory();
        } catch (error) {
            Utils.handleError(error, 'deleteNotice');
        }
    }

    addAvisosStyles() {
        if (document.getElementById('avisos-styles')) return;

        const style = document.createElement('style');
        style.id = 'avisos-styles';
        style.textContent = `
            .avisos-header {
                margin-bottom: 32px;
            }
            
            .avisos-header h2 {
                font-size: 2rem;
                font-weight: 700;
                color: var(--text-primary);
                margin-bottom: 8px;
            }
            
            .avisos-header p {
                color: var(--text-secondary);
                font-size: 1.1rem;
            }
            
            .avisos-content {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                gap: 24px;
            }
            
            .aviso-card {
                background: var(--card-bg);
                border: 1px solid var(--border-color);
                border-radius: 16px;
                padding: 24px;
                transition: all 0.3s ease;
            }
            
            .aviso-card:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-lg);
                border-color: var(--accent-primary);
            }
            
            .aviso-card h3 {
                margin: 0 0 20px 0;
                color: var(--text-primary);
                font-size: 1.2rem;
                font-weight: 600;
                padding-bottom: 12px;
                border-bottom: 1px solid var(--border-color);
            }
            
            .notice-empty, .history-empty {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px 20px;
                color: var(--text-secondary);
                text-align: center;
                gap: 12px;
            }
            
            .notice-empty i, .history-empty i {
                width: 48px;
                height: 48px;
                opacity: 0.5;
            }
            
            .notice-active {
                padding: 20px;
                background: var(--input-bg);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                border-left: 4px solid var(--success-text);
            }
            
            .notice-header, .history-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }
            
            .notice-status, .history-status {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .notice-status i, .history-status i {
                width: 16px;
                height: 16px;
                color: var(--success-text);
            }
            
            .status-badge {
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
            }
            
            .status-active {
                background: var(--success-bg);
                color: var(--success-text);
            }
            
            .status-inactive {
                background: var(--secondary-bg);
                color: var(--text-muted);
            }
            
            .notice-date, .history-date {
                color: var(--text-secondary);
                font-size: 0.85rem;
            }
            
            .notice-title, .history-title {
                color: var(--text-primary);
                margin: 0 0 12px 0;
                font-size: 1.1rem;
                font-weight: 600;
            }
            
            .notice-message, .history-message {
                color: var(--text-primary);
                line-height: 1.6;
                margin-bottom: 12px;
                word-wrap: break-word;
            }
            
            .notice-meta {
                padding-top: 12px;
                border-top: 1px solid var(--border-color);
                color: var(--text-secondary);
            }
            
            .notice-form {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            
            .history-item {
                padding: 16px;
                background: var(--input-bg);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                margin-bottom: 12px;
                transition: all 0.3s ease;
                position: relative;
            }
            
            .history-item:hover {
                border-color: var(--accent-primary);
            }
            
            .history-item.active {
                border-left: 4px solid var(--success-text);
            }
            
            .history-item.inactive {
                opacity: 0.7;
                border-left: 4px solid var(--text-muted);
            }
            
            .history-actions {
                display: flex;
                gap: 8px;
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid var(--border-color);
            }
            
            .action-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                background: var(--secondary-bg);
                border: 1px solid var(--border-color);
                border-radius: 6px;
                color: var(--text-secondary);
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .action-btn:hover {
                background: var(--hover-bg);
                color: var(--text-primary);
            }
            
            .action-btn.danger {
                color: var(--error-text);
                border-color: var(--error-text);
            }
            
            .action-btn.danger:hover {
                background: var(--error-bg);
            }
            
            .action-btn i {
                width: 14px;
                height: 14px;
            }
            
            .notices-history {
                max-height: 500px;
                overflow-y: auto;
                padding-right: 8px;
            }
            
            .notices-history::-webkit-scrollbar {
                width: 6px;
            }
            
            .notices-history::-webkit-scrollbar-track {
                background: var(--bg-secondary);
                border-radius: 3px;
            }
            
            .notices-history::-webkit-scrollbar-thumb {
                background: var(--accent-primary);
                border-radius: 3px;
            }
            
            @media (max-width: 1024px) {
                .avisos-content {
                    grid-template-columns: 1fr;
                    gap: 20px;
                }
            }
            
            @media (max-width: 768px) {
                .aviso-card {
                    padding: 16px;
                }
                
                .notice-header, .history-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 8px;
                }
                
                .avisos-header h2 {
                    font-size: 1.5rem;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    refresh() {
        this.loadCurrentNotice();
        this.loadNoticesHistory();
    }

    destroy() {
        // Cleanup if needed
    }
}

// Create global instance
window.Avisos = new Avisos();

