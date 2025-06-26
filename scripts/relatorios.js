// Reports module with Chart.js integration

class Relatorios {
    constructor() {
        this.supabase = null;
        this.charts = {};
        this.appointments = [];
    }

    init() {
        // Use demo data only to prevent errors
        this.setupEventListeners();
        this.loadReportsData();
    }

    setupEventListeners() {
        const periodSelect = document.getElementById('report-period');
        const barberSelect = document.getElementById('report-barber');

        if (periodSelect) {
            periodSelect.addEventListener('change', () => {
                this.loadReportsData();
            });
        }

        if (barberSelect) {
            barberSelect.addEventListener('change', () => {
                this.loadReportsData();
            });
        }
    }

    async loadReportsData() {
        try {
            // Show loading for all charts
            this.showChartsLoading();

            // Use demo data directly to prevent errors
            const renneApps = DemoData.getAppointments('renne');
            const leleApps = DemoData.getAppointments('lele');

            // Combine and mark appointments with barber info
            this.appointments = [
                ...renneApps.map(app => ({ ...app, _barber: 'renne' })),
                ...leleApps.map(app => ({ ...app, _barber: 'lele' }))
            ];

            // Filter by selected period and barber
            const filteredAppointments = this.filterAppointments();

            // Generate all charts
            this.generateAppointmentsChart(filteredAppointments);
            this.generateRevenueChart(filteredAppointments);
            this.generateStatusChart(filteredAppointments);
            this.generateHoursChart(filteredAppointments);

        } catch (error) {
            console.error('Error in loadReportsData:', error);
            this.showChartsError();
        }
    }

    // Removed fetchAppointments - using demo data directly in loadReportsData

    filterAppointments() {
        const period = document.getElementById('report-period')?.value || 'month';
        const barber = document.getElementById('report-barber')?.value || 'all';
        
        let filtered = [...this.appointments];

        // Filter by barber
        if (barber !== 'all') {
            filtered = filtered.filter(app => app._barber === barber);
        }

        // Filter by period
        const now = new Date();
        let startDate;

        switch (period) {
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                const currentQuarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const startDateStr = Utils.formatDate(startDate, 'YYYY-MM-DD');
        filtered = filtered.filter(app => app.data >= startDateStr);

        return filtered;
    }

    generateAppointmentsChart(appointments) {
        const ctx = document.getElementById('appointments-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.appointments) {
            this.charts.appointments.destroy();
        }

        // Group by barber
        const renneApps = appointments.filter(app => app._barber === 'renne');
        const leleApps = appointments.filter(app => app._barber === 'lele');

        // Group by month
        const months = this.getMonthsInPeriod();
        const renneData = months.map(month => 
            renneApps.filter(app => app.data.startsWith(month)).length
        );
        const leleData = months.map(month => 
            leleApps.filter(app => app.data.startsWith(month)).length
        );

        this.charts.appointments = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months.map(month => this.formatMonthLabel(month)),
                datasets: [
                    {
                        label: 'Renne',
                        data: renneData,
                        backgroundColor: Utils.getBarberColor('renne') + '80',
                        borderColor: Utils.getBarberColor('renne'),
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false,
                    },
                    {
                        label: 'Lele',
                        data: leleData,
                        backgroundColor: Utils.getBarberColor('lele') + '80',
                        borderColor: Utils.getBarberColor('lele'),
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: 'rgb(255, 255, 255)',
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 31, 46, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#00d4ff',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(136, 146, 176, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(136, 146, 176, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    generateRevenueChart(appointments) {
        const ctx = document.getElementById('revenue-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.revenue) {
            this.charts.revenue.destroy();
        }

        // Only count completed appointments
        const completedApps = appointments.filter(app => app.status === 'realizado');

        // Group by month and calculate revenue
        const months = this.getMonthsInPeriod();
        const revenueData = months.map(month => {
            const monthApps = completedApps.filter(app => app.data.startsWith(month));
            return monthApps.reduce((total, app) => total + (parseFloat(app.valor) || 0), 0);
        });

        this.charts.revenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months.map(month => this.formatMonthLabel(month)),
                datasets: [{
                    label: 'Faturamento',
                    data: revenueData,
                    borderColor: Utils.getBarberColor('all'),
                    backgroundColor: Utils.getBarberColor('all') + '20',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: Utils.getBarberColor('all'),
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 31, 46, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#00d4ff',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return 'Faturamento: ' + Utils.formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(136, 146, 176, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(136, 146, 176, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            callback: function(value) {
                                return Utils.formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }

    generateStatusChart(appointments) {
        const ctx = document.getElementById('status-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.status) {
            this.charts.status.destroy();
        }

        // Count by status
        const statusCounts = {
            agendado: appointments.filter(app => app.status === 'agendado' || !app.status).length,
            realizado: appointments.filter(app => app.status === 'realizado').length,
            cancelado: appointments.filter(app => app.status === 'cancelado').length
        };

        const data = Object.values(statusCounts);
        const labels = ['Agendados', 'Realizados', 'Cancelados'];
        const colors = [
            Utils.getStatusColor('agendado'),
            Utils.getStatusColor('realizado'),
            Utils.getStatusColor('cancelado')
        ];

        this.charts.status = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.map(color => color + '80'),
                    borderColor: colors,
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 31, 46, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#00d4ff',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    generateHoursChart(appointments) {
        const ctx = document.getElementById('hours-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.hours) {
            this.charts.hours.destroy();
        }

        // Group by hour
        const hourCounts = {};
        for (let hour = 8; hour <= 19; hour++) {
            hourCounts[`${hour}:00`] = 0;
        }

        appointments.forEach(app => {
            if (app.horainicio) {
                const hour = app.horainicio.slice(0, 2) + ':00';
                if (hourCounts.hasOwnProperty(hour)) {
                    hourCounts[hour]++;
                }
            }
        });

        const hours = Object.keys(hourCounts);
        const counts = Object.values(hourCounts);

        this.charts.hours = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: hours,
                datasets: [{
                    label: 'Agendamentos',
                    data: counts,
                    backgroundColor: Utils.getBarberColor('all') + '60',
                    borderColor: Utils.getBarberColor('all'),
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 31, 46, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#00d4ff',
                        borderWidth: 1,
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(136, 146, 176, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(136, 146, 176, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    getMonthsInPeriod() {
        const period = document.getElementById('report-period')?.value || 'month';
        const now = new Date();
        const months = [];

        switch (period) {
            case 'month':
                // Current month only
                const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                months.push(currentMonth);
                break;
                
            case 'quarter':
                // Last 3 months
                for (let i = 2; i >= 0; i--) {
                    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    months.push(monthStr);
                }
                break;
                
            case 'year':
                // Last 12 months
                for (let i = 11; i >= 0; i--) {
                    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    months.push(monthStr);
                }
                break;
        }

        return months;
    }

    formatMonthLabel(monthStr) {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        
        return date.toLocaleDateString('pt-BR', { 
            month: 'short',
            year: '2-digit'
        });
    }

    showChartsLoading() {
        const chartIds = ['appointments-chart', 'revenue-chart', 'status-chart', 'hours-chart'];
        
        chartIds.forEach(id => {
            const container = document.querySelector(`#${id}`).parentElement;
            Utils.showLoading(container, 'Carregando gráfico...');
        });
    }

    showChartsError() {
        const chartIds = ['appointments-chart', 'revenue-chart', 'status-chart', 'hours-chart'];
        
        chartIds.forEach(id => {
            const container = document.querySelector(`#${id}`).parentElement;
            container.innerHTML = `
                <div class="chart-error">
                    <i data-feather="alert-triangle"></i>
                    <p>Erro ao carregar gráfico</p>
                    <button class="secondary-btn" onclick="window.Relatorios.loadReportsData()">
                        <i data-feather="refresh-cw"></i>
                        Tentar Novamente
                    </button>
                </div>
            `;
        });
        
        feather.replace();
        this.addChartsStyles();
    }

    setBarberFilter(barber) {
        const barberSelect = document.getElementById('report-barber');
        if (barberSelect) {
            barberSelect.value = barber;
            this.loadReportsData();
        }
    }

    addChartsStyles() {
        if (document.getElementById('charts-styles')) return;

        const style = document.createElement('style');
        style.id = 'charts-styles';
        style.textContent = `
            .reports-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                gap: 24px;
                margin-top: 24px;
            }
            
            .report-card {
                background: var(--card-bg);
                border: 1px solid var(--border-color);
                border-radius: 16px;
                padding: 24px;
                transition: all 0.3s ease;
            }
            
            .report-card:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-lg);
                border-color: var(--accent-primary);
            }
            
            .report-card h3 {
                margin: 0 0 20px 0;
                color: var(--text-primary);
                font-size: 1.2rem;
                font-weight: 600;
                padding-bottom: 12px;
                border-bottom: 1px solid var(--border-color);
            }
            
            .chart-container {
                position: relative;
                height: 300px;
                width: 100%;
            }
            
            .chart-error {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 300px;
                gap: 16px;
                color: var(--text-secondary);
            }
            
            .chart-error i {
                width: 48px;
                height: 48px;
                color: var(--error-text);
            }
            
            .report-filters {
                display: flex;
                gap: 16px;
                align-items: center;
                flex-wrap: wrap;
            }
            
            .report-filters select {
                padding: 8px 16px;
                border: 1px solid var(--border-color);
                border-radius: 8px;
                background: var(--input-bg);
                color: var(--text-primary);
                font-size: 0.9rem;
            }
            
            .report-filters select:focus {
                outline: none;
                border-color: var(--accent-primary);
                box-shadow: 0 0 0 2px var(--accent-glow);
            }
            
            .relatorios-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 32px;
                flex-wrap: wrap;
                gap: 20px;
            }
            
            .relatorios-header h2 {
                font-size: 2rem;
                font-weight: 700;
                color: var(--text-primary);
                margin: 0;
            }
            
            @media (max-width: 1024px) {
                .reports-grid {
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                }
            }
            
            @media (max-width: 768px) {
                .reports-grid {
                    grid-template-columns: 1fr;
                    gap: 16px;
                }
                
                .report-card {
                    padding: 16px;
                }
                
                .chart-container {
                    height: 250px;
                }
                
                .relatorios-header {
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .report-filters {
                    width: 100%;
                    justify-content: flex-start;
                }
            }
            
            @media (max-width: 480px) {
                .chart-container {
                    height: 200px;
                }
                
                .report-filters {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .report-filters select {
                    width: 100%;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    refresh() {
        this.loadReportsData();
    }

    handleResize() {
        // Resize all charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }

    destroy() {
        // Destroy all charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}

// Create global instance
window.Relatorios = new Relatorios();

