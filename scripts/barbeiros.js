// Barbeiros management module

class Barbeiros {
    constructor() {
        this.supabase = null;
        this.barbeiros = [];
        this.currentEditingBarber = null;
    }

    init() {
        this.supabase = window.Auth.getSupabaseClient();
        this.setupEventListeners();
        this.loadBarbeiros();
    }

    setupEventListeners() {
        const addBarberBtn = document.getElementById('add-barber-btn');
        if (addBarberBtn) {
            addBarberBtn.addEventListener('click', () => {
                this.showAddBarberModal();
            });
        }
    }

    async loadBarbeiros() {
        try {
            Utils.showLoading('barbeiros-list', 'Carregando barbeiros...');
            
            // Load barbers from Supabase - assuming there's a 'barbeiros' table
            const { data, error } = await this.supabase
                .from('barbeiros')
                .select('*')
                .order('nome');

            if (error) {
                console.error('Error loading barbers:', error);
                // If table doesn't exist, use default barbers
                this.barbeiros = this.getDefaultBarbeiros();
            } else {
                this.barbeiros = data || this.getDefaultBarbeiros();
            }

            this.renderBarbeiros();
        } catch (error) {
            console.error('Error in loadBarbeiros:', error);
            this.barbeiros = this.getDefaultBarbeiros();
            this.renderBarbeiros();
        } finally {
            Utils.hideLoading('barbeiros-list');
        }
    }

    getDefaultBarbeiros() {
        return [
            {
                id: 1,
                nome: 'Renne',
                email: 'renne@barbearia.com',
                telefone: '(11) 99999-9999',
                status: 'ativo',
                especialidades: ['Corte Masculino', 'Barba', 'Bigode'],
                horario_inicio: '08:00',
                horario_fim: '18:00',
                dias_disponiveis: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
                cor_tema: '#00d4ff',
                foto_url: null,
                comissao: 50,
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                nome: 'Lele',
                email: 'lele@barbearia.com',
                telefone: '(11) 99999-9998',
                status: 'ativo',
                especialidades: ['Corte Masculino', 'Barba', 'Degradê'],
                horario_inicio: '09:00',
                horario_fim: '19:00',
                dias_disponiveis: ['segunda', 'terca', 'quarta', 'quinta', 'sexta'],
                cor_tema: '#ffc107',
                foto_url: null,
                comissao: 50,
                created_at: new Date().toISOString()
            }
        ];
    }

    renderBarbeiros() {
        const container = document.getElementById('barbeiros-list');
        if (!container) return;

        if (this.barbeiros.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-feather="users"></i>
                    <h3>Nenhum barbeiro cadastrado</h3>
                    <p>Adicione barbeiros para começar a gerenciar a equipe</p>
                    <button class="primary-btn" onclick="window.Barbeiros.showAddBarberModal()">
                        <i data-feather="plus"></i>
                        Adicionar Primeiro Barbeiro
                    </button>
                </div>
            `;
            feather.replace();
            return;
        }

        const barbeirosHtml = this.barbeiros.map(barbeiro => `
            <div class="barber-card" data-barber-id="${barbeiro.id}">
                <div class="barber-header">
                    <div class="barber-avatar" style="background-color: ${barbeiro.cor_tema}20; border: 2px solid ${barbeiro.cor_tema}">
                        ${barbeiro.foto_url ? 
                            `<img src="${barbeiro.foto_url}" alt="${barbeiro.nome}">` : 
                            `<i data-feather="user"></i>`
                        }
                    </div>
                    <div class="barber-info">
                        <h3>${barbeiro.nome}</h3>
                        <p class="barber-email">${barbeiro.email || ''}</p>
                        <p class="barber-phone">${barbeiro.telefone || ''}</p>
                    </div>
                    <div class="barber-status">
                        <span class="status-badge status-${barbeiro.status}">
                            ${barbeiro.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                </div>
                
                <div class="barber-details">
                    <div class="detail-section">
                        <h4><i data-feather="clock"></i> Horário de Trabalho</h4>
                        <p>${Utils.formatTime(barbeiro.horario_inicio)} às ${Utils.formatTime(barbeiro.horario_fim)}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h4><i data-feather="calendar"></i> ${barbeiro.horarios_personalizados ? 'Horários Personalizados' : 'Dias Disponíveis'}</h4>
                        <div class="schedule-display">
                            ${barbeiro.horarios_personalizados ? 
                                this.renderCustomScheduleDisplay(barbeiro.horarios_personalizados) : 
                                this.renderDaysAvailable(barbeiro.dias_disponiveis)}
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4><i data-feather="scissors"></i> Especialidades</h4>
                        <div class="specialties-list">
                            ${(barbeiro.especialidades || []).map(esp => 
                                `<span class="specialty-tag">${esp}</span>`
                            ).join('')}
                        </div>
                    </div>
                    
                    ${barbeiro.comissao ? `
                        <div class="detail-section">
                            <h4><i data-feather="percent"></i> Comissão</h4>
                            <p>${barbeiro.comissao}%</p>
                        </div>
                    ` : ''}
                </div>
                
                <div class="barber-actions">
                    <button class="secondary-btn" onclick="window.Barbeiros.editBarber(${barbeiro.id})">
                        <i data-feather="edit"></i>
                        Editar
                    </button>
                    <button class="secondary-btn" onclick="window.Barbeiros.viewBarberStats(${barbeiro.id})">
                        <i data-feather="bar-chart"></i>
                        Estatísticas
                    </button>
                    <button class="secondary-btn ${barbeiro.status === 'ativo' ? 'danger' : 'success'}" 
                            onclick="window.Barbeiros.toggleBarberStatus(${barbeiro.id})">
                        <i data-feather="${barbeiro.status === 'ativo' ? 'user-x' : 'user-check'}"></i>
                        ${barbeiro.status === 'ativo' ? 'Desativar' : 'Ativar'}
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = barbeirosHtml;
        this.addBarberStyles();
        feather.replace();
    }

    renderDaysAvailable(diasDisponiveis) {
        const allDays = [
            { key: 'domingo', short: 'Dom', full: 'Domingo' },
            { key: 'segunda', short: 'Seg', full: 'Segunda' },
            { key: 'terca', short: 'Ter', full: 'Terça' },
            { key: 'quarta', short: 'Qua', full: 'Quarta' },
            { key: 'quinta', short: 'Qui', full: 'Quinta' },
            { key: 'sexta', short: 'Sex', full: 'Sexta' },
            { key: 'sabado', short: 'Sáb', full: 'Sábado' }
        ];

        return allDays.map(day => {
            const isAvailable = diasDisponiveis && diasDisponiveis.includes(day.key);
            return `
                <div class="day-indicator ${isAvailable ? 'available' : 'unavailable'}" 
                     title="${day.full}">
                    ${day.short}
                </div>
            `;
        }).join('');
    }

    showAddBarberModal() {
        this.currentEditingBarber = null;
        this.showBarberModal();
    }

    editBarber(barberId) {
        this.currentEditingBarber = this.barbeiros.find(b => b.id === barberId);
        if (this.currentEditingBarber) {
            this.showBarberModal(this.currentEditingBarber);
        }
    }

    showBarberModal(barber = null) {
        const isEditing = !!barber;
        const title = isEditing ? 'Editar Barbeiro' : 'Novo Barbeiro';
        
        const modalContent = document.getElementById('modal-content');
        modalContent.innerHTML = `
            <h2>${title}</h2>
            <form id="barber-form">
                <div class="form-grid">
                    <div class="input-group">
                        <label for="barber-name">Nome *</label>
                        <input type="text" id="barber-name" value="${barber?.nome || ''}" required>
                    </div>
                    
                    <div class="input-group">
                        <label for="barber-email">Email</label>
                        <input type="email" id="barber-email" value="${barber?.email || ''}">
                    </div>
                    
                    <div class="input-group">
                        <label for="barber-phone">Telefone</label>
                        <input type="tel" id="barber-phone" value="${barber?.telefone || ''}">
                    </div>
                    
                    <div class="input-group">
                        <label for="barber-status">Status</label>
                        <select id="barber-status">
                            <option value="ativo" ${barber?.status === 'ativo' ? 'selected' : ''}>Ativo</option>
                            <option value="inativo" ${barber?.status === 'inativo' ? 'selected' : ''}>Inativo</option>
                        </select>
                    </div>
                    
                    <div class="input-group">
                        <label for="barber-start-time">Horário de Início</label>
                        <input type="time" id="barber-start-time" value="${barber?.horario_inicio || '08:00'}">
                    </div>
                    
                    <div class="input-group">
                        <label for="barber-end-time">Horário de Fim</label>
                        <input type="time" id="barber-end-time" value="${barber?.horario_fim || '18:00'}">
                    </div>
                    
                    <div class="input-group">
                        <label for="barber-commission">Comissão (%)</label>
                        <input type="number" id="barber-commission" min="0" max="100" value="${barber?.comissao || 50}">
                    </div>
                    
                    <div class="input-group">
                        <label for="barber-color">Cor do Tema</label>
                        <input type="color" id="barber-color" value="${barber?.cor_tema || '#00d4ff'}">
                    </div>
                </div>
                
                <div class="input-group">
                    <label>Horários por Dia da Semana</label>
                    <div class="schedule-selector">
                        ${this.renderScheduleSelector(barber?.horarios_personalizados)}
                    </div>
                </div>
                
                <div class="input-group">
                    <label for="barber-specialties">Especialidades (uma por linha)</label>
                    <textarea id="barber-specialties" rows="4" placeholder="Corte Masculino&#10;Barba&#10;Degradê">${(barber?.especialidades || []).join('\n')}</textarea>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="primary-btn">
                        <i data-feather="save"></i>
                        ${isEditing ? 'Salvar Alterações' : 'Adicionar Barbeiro'}
                    </button>
                    <button type="button" class="secondary-btn" onclick="Utils.hideModal('modal')">
                        <i data-feather="x"></i>
                        Cancelar
                    </button>
                </div>
            </form>
        `;

        // Setup form submission
        const form = document.getElementById('barber-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBarber();
        });

        Utils.showModal('modal');
        feather.replace();
    }

    renderScheduleSelector(customSchedules = {}) {
        const days = [
            { key: 'domingo', label: 'Domingo' },
            { key: 'segunda', label: 'Segunda-feira' },
            { key: 'terca', label: 'Terça-feira' },
            { key: 'quarta', label: 'Quarta-feira' },
            { key: 'quinta', label: 'Quinta-feira' },
            { key: 'sexta', label: 'Sexta-feira' },
            { key: 'sabado', label: 'Sábado' }
        ];

        return days.map(day => {
            const schedule = customSchedules?.[day.key] || { ativo: false, inicio: '08:00', fim: '18:00' };
            
            return `
                <div class="day-schedule">
                    <label class="day-checkbox">
                        <input type="checkbox" 
                               class="day-active" 
                               data-day="${day.key}" 
                               ${schedule.ativo ? 'checked' : ''}
                               onchange="this.closest('.day-schedule').querySelector('.time-inputs').style.display = this.checked ? 'flex' : 'none'">
                        <span class="day-label">${day.label}</span>
                    </label>
                    <div class="time-inputs" style="display: ${schedule.ativo ? 'flex' : 'none'}">
                        <input type="time" 
                               class="time-start" 
                               data-day="${day.key}" 
                               value="${schedule.inicio}" 
                               title="Horário de início">
                        <span class="time-separator">até</span>
                        <input type="time" 
                               class="time-end" 
                               data-day="${day.key}" 
                               value="${schedule.fim}" 
                               title="Horário de fim">
                    </div>
                </div>
            `;
        }).join('');
    }

    renderCustomScheduleDisplay(customSchedules) {
        const days = [
            { key: 'domingo', label: 'Dom' },
            { key: 'segunda', label: 'Seg' },
            { key: 'terca', label: 'Ter' },
            { key: 'quarta', label: 'Qua' },
            { key: 'quinta', label: 'Qui' },
            { key: 'sexta', label: 'Sex' },
            { key: 'sabado', label: 'Sáb' }
        ];

        return days.map(day => {
            const schedule = customSchedules[day.key];
            if (schedule && schedule.ativo) {
                return `
                    <div class="day-schedule-item active">
                        <span class="day-name">${day.label}</span>
                        <span class="day-hours">${schedule.inicio} - ${schedule.fim}</span>
                    </div>
                `;
            } else {
                return `
                    <div class="day-schedule-item inactive">
                        <span class="day-name">${day.label}</span>
                        <span class="day-hours">Indisponível</span>
                    </div>
                `;
            }
        }).join('');
    }

    async saveBarber() {
        try {
            const formData = this.collectFormData();
            
            if (this.currentEditingBarber) {
                await this.updateBarber(this.currentEditingBarber.id, formData);
            } else {
                await this.createBarber(formData);
            }
            
            Utils.hideModal('modal');
            this.loadBarbeiros();
        } catch (error) {
            Utils.handleError(error, 'saveBarber');
        }
    }

    collectFormData() {
        // Coletar horários personalizados por dia
        const customSchedules = {};
        const dayCheckboxes = document.querySelectorAll('.day-active');
        
        dayCheckboxes.forEach(checkbox => {
            const day = checkbox.dataset.day;
            const isActive = checkbox.checked;
            
            if (isActive) {
                const startTime = document.querySelector(`.time-start[data-day="${day}"]`).value;
                const endTime = document.querySelector(`.time-end[data-day="${day}"]`).value;
                
                customSchedules[day] = {
                    ativo: true,
                    inicio: startTime,
                    fim: endTime
                };
            } else {
                customSchedules[day] = {
                    ativo: false,
                    inicio: '08:00',
                    fim: '18:00'
                };
            }
        });
        
        const specialties = document.getElementById('barber-specialties').value
            .split('\n')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        return {
            nome: document.getElementById('barber-name').value.trim(),
            email: document.getElementById('barber-email').value.trim(),
            telefone: document.getElementById('barber-phone').value.trim(),
            status: document.getElementById('barber-status').value,
            horario_inicio: document.getElementById('barber-start-time').value,
            horario_fim: document.getElementById('barber-end-time').value,
            comissao: parseFloat(document.getElementById('barber-commission').value) || 0,
            cor_tema: document.getElementById('barber-color').value,
            horarios_personalizados: customSchedules,
            especialidades: specialties
        };
    }

    async createBarber(barberData) {
        try {
            // Try to insert into Supabase
            const { data, error } = await this.supabase
                .from('barbeiros')
                .insert(barberData)
                .select();

            if (error) throw error;

            Utils.showToast('Barbeiro adicionado com sucesso!', 'success');
        } catch (error) {
            // If table doesn't exist, add to local array
            console.log('Adding barber locally (table may not exist):', error);
            const newBarber = {
                ...barberData,
                id: Math.max(...this.barbeiros.map(b => b.id), 0) + 1,
                created_at: new Date().toISOString()
            };
            this.barbeiros.push(newBarber);
            Utils.showToast('Barbeiro adicionado localmente!', 'success');
        }
    }

    async updateBarber(id, barberData) {
        try {
            // Try to update in Supabase
            const { data, error } = await this.supabase
                .from('barbeiros')
                .update(barberData)
                .eq('id', id)
                .select();

            if (error) throw error;

            Utils.showToast('Barbeiro atualizado com sucesso!', 'success');
        } catch (error) {
            // If table doesn't exist, update local array
            console.log('Updating barber locally (table may not exist):', error);
            const index = this.barbeiros.findIndex(b => b.id === id);
            if (index !== -1) {
                this.barbeiros[index] = { ...this.barbeiros[index], ...barberData };
                Utils.showToast('Barbeiro atualizado localmente!', 'success');
            }
        }
    }

    async toggleBarberStatus(barberId) {
        const barber = this.barbeiros.find(b => b.id === barberId);
        if (!barber) return;

        const newStatus = barber.status === 'ativo' ? 'inativo' : 'ativo';
        const action = newStatus === 'ativo' ? 'ativar' : 'desativar';

        if (!confirm(`Deseja realmente ${action} o barbeiro ${barber.nome}?`)) return;

        try {
            await this.updateBarber(barberId, { status: newStatus });
            this.loadBarbeiros();
        } catch (error) {
            Utils.handleError(error, 'toggleBarberStatus');
        }
    }

    viewBarberStats(barberId) {
        const barber = this.barbeiros.find(b => b.id === barberId);
        if (!barber) return;

        // Switch to reports tab with barber filter
        if (window.Main) {
            window.Main.switchTab('relatorios');
            // Set barber filter in reports module
            setTimeout(() => {
                const reportsModule = window.Main.getModule('relatorios');
                if (reportsModule && reportsModule.setBarberFilter) {
                    reportsModule.setBarberFilter(barber.nome.toLowerCase());
                }
            }, 100);
        }
    }

    addBarberStyles() {
        if (document.getElementById('barber-styles')) return;

        const style = document.createElement('style');
        style.id = 'barber-styles';
        style.textContent = `
            .barber-card {
                background: var(--card-bg);
                border: 1px solid var(--border-color);
                border-radius: 16px;
                padding: 24px;
                margin-bottom: 24px;
                transition: all 0.3s ease;
            }
            
            .barber-card:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-lg);
                border-color: var(--accent-primary);
            }
            
            .barber-header {
                display: flex;
                align-items: center;
                gap: 20px;
                margin-bottom: 24px;
                padding-bottom: 20px;
                border-bottom: 1px solid var(--border-color);
            }
            
            .barber-avatar {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2rem;
                overflow: hidden;
            }
            
            .barber-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .barber-avatar i {
                width: 40px;
                height: 40px;
                color: var(--text-primary);
            }
            
            .barber-info {
                flex: 1;
            }
            
            .barber-info h3 {
                margin: 0 0 8px 0;
                color: var(--text-primary);
                font-size: 1.5rem;
            }
            
            .barber-email, .barber-phone {
                margin: 4px 0;
                color: var(--text-secondary);
                font-size: 0.9rem;
            }
            
            .status-badge {
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 600;
                text-transform: uppercase;
            }
            
            .status-ativo {
                background: var(--success-bg);
                color: var(--success-text);
            }
            
            .status-inativo {
                background: var(--error-bg);
                color: var(--error-text);
            }
            
            .barber-details {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 24px;
            }
            
            .detail-section h4 {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 12px;
                color: var(--text-primary);
                font-size: 1rem;
            }
            
            .detail-section h4 i {
                width: 16px;
                height: 16px;
                color: var(--accent-primary);
            }
            
            .days-grid {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
            
            .day-indicator {
                padding: 6px 10px;
                border-radius: 6px;
                font-size: 0.8rem;
                font-weight: 500;
                text-align: center;
                min-width: 40px;
            }
            
            .day-indicator.available {
                background: var(--success-bg);
                color: var(--success-text);
            }
            
            .day-indicator.unavailable {
                background: var(--secondary-bg);
                color: var(--text-muted);
            }
            
            .specialties-list {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
            
            .specialty-tag {
                background: var(--accent-glow);
                color: var(--accent-primary);
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 0.85rem;
                font-weight: 500;
            }
            
            .barber-actions {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }
            
            .form-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .days-selector {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 12px;
                padding: 16px;
                background: var(--input-bg);
                border-radius: 8px;
                border: 1px solid var(--border-color);
            }
            
            .day-checkbox {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                padding: 8px;
                border-radius: 6px;
                transition: background-color 0.2s ease;
            }
            
            .day-checkbox:hover {
                background: var(--hover-bg);
            }
            
            .day-checkbox input[type="checkbox"] {
                width: auto;
                margin: 0;
            }
            
            .secondary-btn.danger {
                color: var(--error-text);
                border-color: var(--error-text);
            }
            
            .secondary-btn.danger:hover {
                background: var(--error-bg);
            }
            
            .secondary-btn.success {
                color: var(--success-text);
                border-color: var(--success-text);
            }
            
            .secondary-btn.success:hover {
                background: var(--success-bg);
            }
            
            @media (max-width: 768px) {
                .barber-header {
                    flex-direction: column;
                    text-align: center;
                    gap: 16px;
                }
                
                .barber-details {
                    grid-template-columns: 1fr;
                }
                
                .barber-actions {
                    justify-content: center;
                }
                
                .form-grid {
                    grid-template-columns: 1fr;
                }
                
                .days-selector {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    refresh() {
        this.loadBarbeiros();
    }

    destroy() {
        // Cleanup if needed
    }
}

// Create global instance
window.Barbeiros = new Barbeiros();

