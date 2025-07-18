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
        const { data, error } = await window.dataService.supabase
            .from('agendamentos_todos')
            .select('*');

        if (error) throw error;

        // Marcar o barbeiro corretamente
        this.appointments = (data || []).map(app => ({
            ...app,
            _barber: app.barbeiro
        }));

        this.updateMetrics();
        this.updateNextAppointments();
        this.updateBarbersStatus();
        this.generateMiniCharts();

    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        Utils.showToast('Erro ao carregar dados do dashboard', 'error');
        this.appointments = [];
        this.updateMetrics();
        this.updateNextAppointments();
        this.updateBarbersStatus();
    }
}


    // Removed fetchAppointments - using demo data directly in loadDashboardData

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
    const dateTime = new Date(`${app.data}T${app.horainicio}`);
    return app.status !== 'realizado'; // mostra tudo que ainda não foi feito
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

    generateMiniCharts() {
        this.generateWeekChart();
        this.generateBarberPerformanceChart();
    }

    generateWeekChart() {
        const ctx = document.getElementById('week-chart');
        if (!ctx) return;

        const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const today = new Date();
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        
        const weekData = weekDays.map((day, index) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + index);
            const dateStr = Utils.formatDate(date, 'YYYY-MM-DD');
            
            return this.appointments.filter(app => app.data === dateStr).length;
        });

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: weekDays,
                datasets: [{
                    label: 'Agendamentos',
                    data: weekData,
                    borderColor: 'var(--chart-primary)',
                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: 'var(--chart-primary)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        display: true,
                        grid: { display: false },
                        ticks: { color: 'var(--text-secondary)', font: { size: 10 } }
                    },
                    y: {
                        display: false,
                        beginAtZero: true
                    }
                }
            }
        });
    }

    generateBarberPerformanceChart() {
        const ctx = document.getElementById('barber-performance-chart');
        if (!ctx) return;

        const renneApps = this.appointments.filter(app => app._barber === 'renne');
        const leleApps = this.appointments.filter(app => app._barber === 'lele');

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Renne', 'Lele'],
                datasets: [{
                    data: [renneApps.length, leleApps.length],
                    backgroundColor: ['var(--chart-primary)', 'var(--chart-secondary)'],
                    borderWidth: 0,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'var(--text-secondary)',
                            font: { size: 10 },
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    }
                }
            }
        });
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

// Create global instance
window.Dashboard = new Dashboard();
