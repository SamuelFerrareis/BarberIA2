// Dashboard module for displaying key metrics and overview

class Dashboard {
    constructor() {
        this.supabase = null;
        this.appointments = [];
        this.refreshInterval = null;
    }

    init() {
        this.supabase = window.Auth.getSupabaseClient();
        this.setupCurrentDate();
        this.loadDashboardData();
        this.setupAutoRefresh();
    }

    setupCurrentDate() {
        const currentDateElement = document.getElementById('current-date');
        if (currentDateElement) {
            currentDateElement.textContent = Utils.formatDate(new Date(), 'readable');
        }
    }

    setupAutoRefresh() {
        // Refresh dashboard every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.loadDashboardData();
        }, 5 * 60 * 1000);
    }

    async loadDashboardData() {
        try {
            // Load appointments from both barbers
            const [renneApps, leleApps] = await Promise.all([
                this.fetchAppointments('renne'),
                this.fetchAppointments('lele')
            ]);

            // Combine and mark appointments with barber info
            this.appointments = [
                ...renneApps.map(app => ({ ...app, _barber: 'renne' })),
                ...leleApps.map(app => ({ ...app, _barber: 'lele' }))
            ];

            this.updateMetrics();
            this.updateNextAppointments();
            this.updateBarbersStatus();
        } catch (error) {
            Utils.handleError(error, 'loadDashboardData');
        }
    }

    async fetchAppointments(barber) {
        try {
            const { data, error } = await this.supabase
                .from(`agendamentos_${barber}`)
                .select('*')
                .order('data', { ascending: true })
                .order('horainicio', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error(`Error fetching appointments for ${barber}:`, error);
            return [];
        }
    }

    updateMetrics() {
        const today = Utils.formatDate(new Date(), 'YYYY-MM-DD');
        const thisWeekStart = this.getWeekStart();
        const thisWeekEnd = this.getWeekEnd();
        const thisMonth = today.slice(0, 7); // YYYY-MM

        // Today's appointments
        const todayApps = this.appointments.filter(app => app.data === today);
        this.updateMetricValue('appointments-today', todayApps.length);

        // This week's appointments
        const weekApps = this.appointments.filter(app => 
            app.data >= thisWeekStart && app.data <= thisWeekEnd
        );
        this.updateMetricValue('appointments-week', weekApps.length);

        // This month's revenue
        const monthApps = this.appointments.filter(app => 
            app.data.startsWith(thisMonth) && app.status === 'realizado'
        );
        const revenue = monthApps.reduce((total, app) => total + (parseFloat(app.valor) || 0), 0);
        this.updateMetricValue('revenue-month', Utils.formatCurrency(revenue));

        // This month's unique clients
        const monthClients = new Set(
            monthApps.map(app => app.clientenome?.toLowerCase()).filter(Boolean)
        );
        this.updateMetricValue('clients-month', monthClients.size);
    }

    updateMetricValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    updateNextAppointments() {
        const container = document.getElementById('next-appointments');
        if (!container) return;

        const now = new Date();
        const today = Utils.formatDate(now, 'YYYY-MM-DD');
        const currentTime = now.toTimeString().slice(0, 5);

        // Get upcoming appointments (today after current time, or future dates)
        const upcoming = this.appointments
            .filter(app => {
                if (app.data > today) return true;
                if (app.data === today && app.horainicio > currentTime) return true;
                return false;
            })
            .filter(app => app.status !== 'cancelado')
            .slice(0, 5);

        if (upcoming.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-feather="calendar"></i>
                    <p>Nenhum agendamento próximo</p>
                </div>
            `;
            feather.replace();
            return;
        }

        container.innerHTML = upcoming.map(app => `
            <div class="appointment-item">
                <div class="appointment-time">
                    <span class="date">${Utils.formatDate(app.data)}</span>
                    <span class="time">${Utils.formatTime(app.horainicio)}</span>
                </div>
                <div class="appointment-details">
                    <div class="client-name">${app.clientenome}</div>
                    <div class="barber-service">
                        <span class="barber barber-${app._barber}">${app._barber === 'renne' ? 'Renne' : 'Lele'}</span>
                        ${app.servico ? `• ${app.servico}` : ''}
                    </div>
                </div>
                <div class="appointment-value">
                    ${app.valor ? Utils.formatCurrency(app.valor) : ''}
                </div>
            </div>
        `).join('');

        // Add CSS for appointment items if not exists
        this.addAppointmentStyles();
        feather.replace();
    }

    updateBarbersStatus() {
        const container = document.getElementById('barbers-status');
        if (!container) return;

        const today = Utils.formatDate(new Date(), 'YYYY-MM-DD');
        const barbers = ['renne', 'lele'];

        const barbersHtml = barbers.map(barber => {
            const todayApps = this.appointments.filter(app => 
                app._barber === barber && app.data === today && app.status !== 'cancelado'
            );
            
            const completedApps = todayApps.filter(app => app.status === 'realizado');
            const nextApp = todayApps.find(app => app.status === 'agendado');
            
            return `
                <div class="barber-status-card">
                    <div class="barber-info">
                        <div class="barber-avatar barber-${barber}">
                            ${barber === 'renne' ? '✂️' : '🧔'}
                        </div>
                        <div class="barber-details">
                            <h4>${barber === 'renne' ? 'Renne' : 'Lele'}</h4>
                            <p>${completedApps.length}/${todayApps.length} atendimentos</p>
                        </div>
                    </div>
                    <div class="barber-next">
                        ${nextApp ? `
                            <div class="next-appointment">
                                <span class="next-time">${Utils.formatTime(nextApp.horainicio)}</span>
                                <span class="next-client">${nextApp.clientenome}</span>
                            </div>
                        ` : `
                            <div class="no-appointments">
                                <i data-feather="check-circle"></i>
                                <span>Livre</span>
                            </div>
                        `}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = barbersHtml;
        feather.replace();
    }

    addAppointmentStyles() {
        if (document.getElementById('dashboard-styles')) return;

        const style = document.createElement('style');
        style.id = 'dashboard-styles';
        style.textContent = `
            .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
                padding: 40px 20px;
                color: var(--text-secondary);
                text-align: center;
            }
            
            .empty-state i {
                width: 48px;
                height: 48px;
                opacity: 0.5;
            }
            
            .appointment-item {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 16px;
                background: var(--input-bg);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                margin-bottom: 12px;
                transition: all 0.3s ease;
            }
            
            .appointment-item:hover {
                border-color: var(--accent-primary);
                transform: translateY(-1px);
            }
            
            .appointment-time {
                display: flex;
                flex-direction: column;
                align-items: center;
                min-width: 80px;
                text-align: center;
            }
            
            .appointment-time .date {
                font-size: 0.85rem;
                color: var(--text-secondary);
                margin-bottom: 4px;
            }
            
            .appointment-time .time {
                font-size: 1.1rem;
                font-weight: 600;
                color: var(--accent-primary);
            }
            
            .appointment-details {
                flex: 1;
            }
            
            .client-name {
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 4px;
            }
            
            .barber-service {
                font-size: 0.9rem;
                color: var(--text-secondary);
            }
            
            .barber {
                font-weight: 500;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 0.8rem;
            }
            
            .barber-renne {
                background: var(--renne-bg);
                color: var(--renne-text);
            }
            
            .barber-lele {
                background: var(--lele-bg);
                color: var(--lele-text);
            }
            
            .appointment-value {
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .barber-status-card {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 20px;
                background: var(--input-bg);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                margin-bottom: 16px;
            }
            
            .barber-info {
                display: flex;
                align-items: center;
                gap: 16px;
            }
            
            .barber-avatar {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
            }
            
            .barber-avatar.barber-renne {
                background: var(--renne-bg);
            }
            
            .barber-avatar.barber-lele {
                background: var(--lele-bg);
            }
            
            .barber-details h4 {
                margin: 0 0 4px 0;
                color: var(--text-primary);
            }
            
            .barber-details p {
                margin: 0;
                color: var(--text-secondary);
                font-size: 0.9rem;
            }
            
            .next-appointment {
                text-align: right;
            }
            
            .next-time {
                display: block;
                font-weight: 600;
                color: var(--accent-primary);
                margin-bottom: 4px;
            }
            
            .next-client {
                display: block;
                font-size: 0.9rem;
                color: var(--text-secondary);
            }
            
            .no-appointments {
                display: flex;
                align-items: center;
                gap: 8px;
                color: var(--success-text);
            }
            
            @media (max-width: 768px) {
                .appointment-item {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 12px;
                }
                
                .appointment-time {
                    flex-direction: row;
                    gap: 12px;
                    min-width: auto;
                }
                
                .barber-status-card {
                    flex-direction: column;
                    gap: 16px;
                    align-items: flex-start;
                }
                
                .barber-next {
                    width: 100%;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    getWeekStart() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset);
        return Utils.formatDate(monday, 'YYYY-MM-DD');
    }

    getWeekEnd() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const sundayOffset = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
        const sunday = new Date(today);
        sunday.setDate(today.getDate() + sundayOffset);
        return Utils.formatDate(sunday, 'YYYY-MM-DD');
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

// Create global instance
window.Dashboard = new Dashboard();
