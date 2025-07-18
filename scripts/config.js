// Configuration module for environment variables and constants

window.CONFIG = {
    // Supabase configuration - these will be injected by the server
    SUPABASE_URL: 'https://ojbgkckqertayszeeysk.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qYmdrY2txZXJ0YXlzemVleXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1OTg3NTUsImV4cCI6MjA2NTE3NDc1NX0.U01u90qtqPKYQu87snwCsOZEmIFxiw6hRVLj61xRIpY',


    // Application constants
    APP_NAME: 'Sistema de Gestão - Barbearia',
    VERSION: '1.0.0',
    
    // Default barbers for the system
    DEFAULT_BARBERS: ['renne', 'lele'],
    
    // Month names in Portuguese
    MONTH_NAMES: [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ],
    
    // Week days in Portuguese (short)
    WEEK_DAYS: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
    
    // API endpoints and table names
    TABLES: {
        APPOINTMENTS_RENNE: 'agendamentos_renne',
        APPOINTMENTS_LELE: 'agendamentos_lele',
        BARBERS: 'barbeiros',
        NOTICES: 'avisos'
    },
    
    // Status options
    APPOINTMENT_STATUS: {
        SCHEDULED: 'agendado',
        COMPLETED: 'realizado',
        CANCELLED: 'cancelado'
    },
    
    // Payment methods
    PAYMENT_METHODS: ['Dinheiro', 'Cartão', 'PIX'],
    
    // Theme options
    THEMES: ['dark', 'light', 'colorful'],
    
    // Font size options
    FONT_SIZES: ['small', 'normal', 'large', 'extra-large'],
    
    // Auto-refresh intervals (in milliseconds)
    REFRESH_INTERVALS: {
        DASHBOARD: 5 * 60 * 1000, // 5 minutes
        AGENDA: 2 * 60 * 1000,    // 2 minutes
        REPORTS: 10 * 60 * 1000   // 10 minutes
    }
};

// Initialize configuration with environment variables
(function initConfig() {
    // Replace template variables with actual environment variables
    if (typeof window.SUPABASE_URL !== 'undefined') {
        window.CONFIG.SUPABASE_URL = window.SUPABASE_URL;
    }
    if (typeof window.SUPABASE_ANON_KEY !== 'undefined') {
        window.CONFIG.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;
    }
    
    // Validate configuration
    if (!window.CONFIG.SUPABASE_URL || window.CONFIG.SUPABASE_URL.includes('{{')) {
        console.warn('SUPABASE_URL not properly configured');
    }
    if (!window.CONFIG.SUPABASE_ANON_KEY || window.CONFIG.SUPABASE_ANON_KEY.includes('{{')) {
        console.warn('SUPABASE_ANON_KEY not properly configured');
    }
    
    console.log('✅ Configuration initialized:', {
        hasSupabaseUrl: !!window.CONFIG.SUPABASE_URL,
        hasSupabaseKey: !!window.CONFIG.SUPABASE_ANON_KEY
    });
    
})();