// Agenda module - adapted from the existing calendar code

class Agenda {
    constructor() {
        this.supabase = null;
        this.state = {
            currentDate: new Date(),
            appointments: [],
            currentBarber: 'todos'
        };
        this.elements = {};
        this.MONTH_NAMES = window.CONFIG?.MONTH_NAMES || [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];
        this.WEEK_DAYS = window.CONFIG?.WEEK_DAYS || ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    }

    init() {
        this.supabase = window.Auth.getSupabaseClient();
        this.setupElements();
        this.setupEventListeners();
        this.updateBarberButtons();
        this.loadAppointments();
    }

    setupElements() {
        this.elements = {
            calendar: document.getElementById("calendar"),
            currentMonth: document.getElementById("current-month"),
            btnRenne: document.getElementById("btn-renne"),
            btnLele: document.getElementById("btn-lele"),
            btnTodos: document.getElementById("btn-todos"),
            modal: document.getElementById("modal"),
            modalContent: document.getElementById("modal-content")
        };
    }

    setupEventListeners() {
        // Make functions globally available for onclick handlers
        window.setBarbeiro = this.setBarbeiro.bind(this);
        window.changeMonth = this.changeMonth.bind(this);
        window.openNewModal = this.openNewModal.bind(this);
        window.createAppointment = this.createAppointment.bind(this);
        window.salvarAlteracoes = this.salvarAlteracoes.bind(this);
        window.deleteAppointment = this.deleteAppointment.bind(this);
        window.closeModal = this.closeModal.bind(this);
    }

    async loadAppointments() {
        Utils.showLoading('calendar', 'Carregando agendamentos...');
        
        try {
            // Direct demo data usage to prevent errors
            if (this.state.currentBarber === 'todos') {
                this.state.appointments = [
                    ...DemoData.getAppointments('renne').map(a => ({ ...a, _barber: 'renne' })),
                    ...DemoData.getAppointments('lele').map(a => ({ ...a, _barber: 'lele' }))
                ];
            } else {
                this.state.appointments = DemoData.getAppointments(this.state.currentBarber)
                    .map(a => ({ ...a, _barber: this.state.currentBarber }));
            }
            
            this.renderTodaySchedule();
            this.renderCalendar();
        } catch (error) {
            console.error('Error in loadAppointments:', error);
            this.state.appointments = [];
            this.renderTodaySchedule();
            this.renderCalendar();
        } finally {
            Utils.hideLoading('calendar');
        }
    }

    renderTodaySchedule() {
        const today = Utils.formatDate(new Date(), 'YYYY-MM-DD');
        const todayDateEl = document.getElementById('today-date');
        const todayHoursEl = document.getElementById('today-hours');
        
        if (!todayDateEl || !todayHoursEl) return;
        
        // Set today's date
        todayDateEl.textContent = Utils.formatDate(new Date(), 'DD/MM/YYYY');
        
        // Get today's appointments and sort by time
        const todayAppointments = this.state.appointments
            .filter(app => app.data === today)
            .sort((a, b) => {
                const timeA = a.horario || '00:00';
                const timeB = b.horario || '00:00';
                return timeA.localeCompare(timeB);
            });
        
        // Render appointments list
        if (todayAppointments.length === 0) {
            todayHoursEl.innerHTML = '<div class="no-appointments">Nenhum agendamento para hoje</div>';
        } else {
            todayHoursEl.innerHTML = todayAppointments.map(appointment => {
                const barberColor = Utils.getBarberColor(appointment._barber);
                const statusColor = Utils.getStatusColor(appointment.status || 'agendado');
                
                return `
                    <div class="appointment-item" style="border-left: 4px solid ${barberColor}">
                        <div class="appointment-time">${appointment.horario || 'Sem horário'}</div>
                        <div class="appointment-details">
                            <div class="appointment-client">${appointment.nome}</div>
                            <div class="appointment-service">${appointment.servico}</div>
                            <div class="appointment-barber">${appointment._barber}</div>
                        </div>
                        <div class="appointment-status" style="background: ${statusColor}">
                            ${appointment.status || 'Agendado'}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Removed fetchAppointments - using demo data directly in loadAppointments

    renderCalendar() {
        const y = this.state.currentDate.getFullYear();
        const m = this.state.currentDate.getMonth();
        const rawFD = new Date(y, m, 1).getDay();
        const firstDay = rawFD === 0 ? 6 : rawFD - 1;
        const lastDate = new Date(y, m + 1, 0).getDate();
        const isMobile = window.innerWidth < 600;

        this.elements.currentMonth.textContent = `${this.MONTH_NAMES[m]} ${y}`;
        this.elements.calendar.innerHTML = '';

        // Headers
        this.WEEK_DAYS.forEach(d => {
            const dh = document.createElement("div");
            dh.className = "day-header";
            dh.textContent = d;
            this.elements.calendar.appendChild(dh);
        });

        // Empty cells for desktop
        if (!isMobile) {
            for (let i = 0; i < firstDay; i++) {
                const ev = document.createElement("div");
                ev.className = "day-cell empty";
                this.elements.calendar.appendChild(ev);
            }
        }

        // Days of the month
        for (let d = 1; d <= lastDate; d++) {
            this.elements.calendar.appendChild(this.createDayCell(d, m, y));
        }
    }

    createDayCell(day, month, year) {
        const cell = document.createElement("div");
        cell.className = "day-cell";
        
        const lbl = document.createElement("span");
        lbl.className = "date-label";
        lbl.textContent = day;
        cell.appendChild(lbl);

        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        let daily = this.state.appointments.filter(a => a.data === dateStr);
        
        if (daily.length) {
            daily.sort((a, b) => {
                if (a.status === 'realizado' && b.status !== 'realizado') return 1;
                if (b.status === 'realizado' && a.status !== 'realizado') return -1;
                return a.horainicio.localeCompare(b.horainicio);
            });
            
            const ul = document.createElement("ul");
            ul.className = "lista-reservas";
            daily.forEach(app => {
                ul.appendChild(this.createAppointmentItem(app));
            });
            cell.appendChild(ul);
        }
        
        return cell;
    }

    createAppointmentItem(app) {
        const li = document.createElement("li");
        const origem = this.state.currentBarber === 'todos' ? app._barber : this.state.currentBarber;
        
        li.className = `lista-reservas-item ${origem}` +
            (app.status === 'realizado' ? ' status-realizado' : '') +
            (app.status === 'cancelado' ? ' status-cancelado' : '');
            
        const icon = origem === 'lele' ? '🧔' : '✂️';
        li.textContent = `${icon} ${Utils.formatTime(app.horainicio)} - ${app.clientenome}`;
        
        li.onclick = e => {
            e.stopPropagation();
            this.showAppointmentDetails(app);
        };
        
        return li;
    }

    showAppointmentDetails(app) {
        const barber = app._barber || this.state.currentBarber;
        
        this.elements.modalContent.innerHTML = `
            <h2>Detalhes do Agendamento</h2>
            <form id="appointment-form">
                <div class="input-group">
                    <label for="status-input">Status:</label>
                    <select id="status-input">
                        <option value="agendado" ${app.status === 'agendado' ? 'selected' : ''}>Agendado</option>
                        <option value="realizado" ${app.status === 'realizado' ? 'selected' : ''}>Realizado</option>
                        <option value="cancelado" ${app.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                        <option value="" ${!app.status ? 'selected' : ''}>-</option>
                    </select>
                </div>
                
                <div class="input-group">
                    <label for="nome-input">Cliente:</label>
                    <input type="text" id="nome-input" value="${app.clientenome || ''}" required>
                </div>
                
                <div class="input-group">
                    <label for="telefone-input">Telefone:</label>
                    <input type="tel" id="telefone-input" value="${app.clientetelefone || ''}">
                </div>
                
                <div class="input-group">
                    <label for="data-input">Data:</label>
                    <input type="date" id="data-input" value="${app.data}" required>
                </div>
                
                <div class="input-group">
                    <label for="inicio-input">Início:</label>
                    <input type="time" id="inicio-input" value="${app.horainicio}" required>
                </div>
                
                <div class="input-group">
                    <label for="fim-input">Fim:</label>
                    <input type="time" id="fim-input" value="${app.horafim}" required>
                </div>
                
                <div class="input-group">
                    <label for="servico-input">Serviço:</label>
                    <input type="text" id="servico-input" value="${app.servico || ''}">
                </div>
                
                <div class="input-group">
                    <label for="valor-input">Valor:</label>
                    <input type="number" step="0.01" id="valor-input" value="${app.valor || 0}">
                </div>
                
                <div class="input-group">
                    <label for="pagamento-input">Forma de Pagamento:</label>
                    <input type="text" id="pagamento-input" value="${app.forma_pagamento || ''}">
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="primary-btn">
                        <i data-feather="save"></i>
                        Salvar Alterações
                    </button>
                    <button type="button" class="secondary-btn" onclick="deleteAppointment(${app.agendamentoid},'${barber}')">
                        <i data-feather="trash-2"></i>
                        Excluir
                    </button>
                    <button type="button" class="secondary-btn" onclick="closeModal()">
                        <i data-feather="x"></i>
                        Fechar
                    </button>
                </div>
            </form>
        `;
        
        // Setup form submission
        const form = document.getElementById('appointment-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarAlteracoes(app.agendamentoid, barber);
        });
        
        Utils.showModal('modal');
        feather.replace();
    }

    async salvarAlteracoes(id, barber) {
        try {
            const upd = {
                clientenome: document.getElementById("nome-input").value,
                clientetelefone: document.getElementById("telefone-input").value,
                data: document.getElementById("data-input").value,
                horainicio: document.getElementById("inicio-input").value,
                horafim: document.getElementById("fim-input").value,
                servico: document.getElementById("servico-input").value,
                valor: parseFloat(document.getElementById("valor-input").value) || 0,
                forma_pagamento: document.getElementById("pagamento-input").value,
                status: document.getElementById("status-input").value || null
            };

            const { error } = await this.supabase
                .from(`agendamentos_${barber}`)
                .update(upd)
                .eq('agendamentoid', id);

            if (error) throw error;

            Utils.showToast("Alterações salvas com sucesso!", 'success');
            this.closeModal();
            this.loadAppointments();
        } catch (error) {
            Utils.handleError(error, 'salvarAlteracoes');
        }
    }

    async deleteAppointment(id, barber) {
        if (!confirm("Deseja realmente excluir este agendamento?")) return;

        try {
            const { error } = await this.supabase
                .from(`agendamentos_${barber}`)
                .delete()
                .eq('agendamentoid', id);

            if (error) throw error;

            Utils.showToast("Agendamento excluído com sucesso!", 'success');
            this.closeModal();
            this.loadAppointments();
        } catch (error) {
            Utils.handleError(error, 'deleteAppointment');
        }
    }

    openNewModal() {
        this.elements.modalContent.innerHTML = `
            <h2>Novo Agendamento</h2>
            <form id="new-appointment-form">
                <div class="input-group">
                    <label for="barber-select">Barbeiro:</label>
                    <select id="barber-select" required>
                        <option value="">Selecione um barbeiro</option>
                        <option value="renne">Renne</option>
                        <option value="lele">Lele</option>
                    </select>
                </div>
                
                <div class="input-group">
                    <label for="new-nome">Cliente:</label>
                    <input type="text" id="new-nome" required>
                </div>
                
                <div class="input-group">
                    <label for="new-telefone">Telefone:</label>
                    <input type="tel" id="new-telefone">
                </div>
                
                <div class="input-group">
                    <label for="new-data">Data:</label>
                    <input type="date" id="new-data" required>
                </div>
                
                <div class="input-group">
                    <label for="new-inicio">Início:</label>
                    <input type="time" id="new-inicio" required>
                </div>
                
                <div class="input-group">
                    <label for="new-fim">Fim:</label>
                    <input type="time" id="new-fim" required>
                </div>
                
                <div class="input-group">
                    <label for="new-servico">Serviço:</label>
                    <input type="text" id="new-servico" placeholder="Ex: Corte + Barba">
                </div>
                
                <div class="input-group">
                    <label for="new-valor">Valor:</label>
                    <input type="number" step="0.01" id="new-valor" placeholder="0.00">
                </div>
                
                <div class="input-group">
                    <label for="new-pagamento">Forma de Pagamento:</label>
                    <select id="new-pagamento">
                        <option value="">Selecione</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Cartão">Cartão</option>
                        <option value="PIX">PIX</option>
                    </select>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="primary-btn">
                        <i data-feather="plus"></i>
                        Criar Agendamento
                    </button>
                    <button type="button" class="secondary-btn" onclick="closeModal()">
                        <i data-feather="x"></i>
                        Cancelar
                    </button>
                </div>
            </form>
        `;

        // Setup form submission
        const form = document.getElementById('new-appointment-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createAppointment();
        });

        Utils.showModal('modal');
        feather.replace();
    }

    async createAppointment() {
        try {
            const barber = document.getElementById("barber-select").value;
            const payload = {
                clientenome: document.getElementById("new-nome").value,
                clientetelefone: document.getElementById("new-telefone").value,
                data: document.getElementById("new-data").value,
                horainicio: document.getElementById("new-inicio").value,
                horafim: document.getElementById("new-fim").value,
                servico: document.getElementById("new-servico").value,
                valor: parseFloat(document.getElementById("new-valor").value) || 0,
                forma_pagamento: document.getElementById("new-pagamento").value,
                status: 'agendado'
            };

            const { error } = await this.supabase
                .from(`agendamentos_${barber}`)
                .insert(payload);

            if (error) throw error;

            Utils.showToast("Agendamento criado com sucesso!", 'success');
            this.closeModal();
            this.loadAppointments();
        } catch (error) {
            Utils.handleError(error, 'createAppointment');
        }
    }

    closeModal() {
        Utils.hideModal('modal');
    }

    setBarbeiro(barber) {
        this.state.currentBarber = barber;
        this.updateBarberButtons();
        this.loadAppointments();
    }

    updateBarberButtons() {
        this.elements.btnRenne?.classList.toggle('active', this.state.currentBarber === 'renne');
        this.elements.btnLele?.classList.toggle('active', this.state.currentBarber === 'lele');
        this.elements.btnTodos?.classList.toggle('active', this.state.currentBarber === 'todos');
    }

    changeMonth(step) {
        this.state.currentDate.setMonth(this.state.currentDate.getMonth() + step);
        this.loadAppointments();
    }

    // Public method to get appointments for other modules
    getAppointments() {
        return this.state.appointments;
    }

    getCurrentBarber() {
        return this.state.currentBarber;
    }
}

// Create global instance
window.Agenda = new Agenda();
