// Ajustado para usar apenas a tabela 'agendamento_todos'

class DataService {
    constructor() {
        this.isDemo = false;
        this.supabase = null;
        this.initializeSupabase();
    }

    initializeSupabase() {
        try {
            const url = window.CONFIG.SUPABASE_URL;
            const key = window.CONFIG.SUPABASE_ANON_KEY;

            if (!url || !key) {
                console.warn('❌ Supabase URL ou Key ausente');
                this.isDemo = true;
                return;
            }

            this.supabase = supabase.createClient(url, key);
            this.isDemo = false;
            console.log('✅ Supabase client criado com sucesso');
        } catch (error) {
            console.error('📊 Erro ao inicializar Supabase. Rodando em modo demo:', error);
            this.isDemo = true;
        }
    }

    async getAppointments(barber = null) {
        if (this.isDemo) {
            return DemoData.getAppointments(barber);
        }

        try {
            const { data, error } = await this.supabase
                .from('agendamento_todos')
                .select('*')
                .order('data', { ascending: true });

            if (error) throw error;

            if (barber && barber !== 'todos') {
                return data.filter(app => app.barbeiro === barber);
            }

            return data || [];
        } catch (error) {
            console.log('Using demo data due to API error');
            return DemoData.getAppointments(barber);
        }
    }

    async createAppointment(appointment, barber) {
        if (this.isDemo) {
            return DemoData.addAppointment(appointment, barber);
        }

        try {
            const { data, error } = await this.supabase
                .from('agendamento_todos')
                .insert([{ ...appointment, barbeiro: barber }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating appointment:', error);
            return DemoData.addAppointment(appointment, barber);
        }
    }

    async updateAppointment(id, updates, barber) {
        if (this.isDemo) {
            return DemoData.updateAppointment(id, updates, barber);
        }

        try {
            const { data, error } = await this.supabase
                .from('agendamento_todos')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating appointment:', error);
            return DemoData.updateAppointment(id, updates, barber);
        }
    }

    async deleteAppointment(id, barber) {
        if (this.isDemo) {
            return DemoData.deleteAppointment(id, barber);
        }

        try {
            const { error } = await this.supabase
                .from('agendamento_todos')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting appointment:', error);
            return DemoData.deleteAppointment(id, barber);
        }
    }

    async getBarbers() {
        if (this.isDemo) {
            return DemoData.getBarbers();
        }

        try {
            const { data, error } = await this.supabase
                .from('barbeiros')
                .select('*')
                .order('nome', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.log('Using demo barbers data');
            return DemoData.getBarbers();
        }
    }

    async getNotices() {
        if (this.isDemo) {
            return DemoData.getNoticesHistory();
        }

        try {
            const { data, error } = await this.supabase
                .from('avisos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.log('Using demo notices data');
            return DemoData.getNoticesHistory();
        }
    }

    async getCurrentNotice() {
        if (this.isDemo) {
            return DemoData.getCurrentNotice();
        }

        try {
            const { data, error } = await this.supabase
                .from('avisos')
                .select('*')
                .eq('ativo', true)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } catch (error) {
            return DemoData.getCurrentNotice();
        }
    }

    isDemoMode() {
        return this.isDemo;
    }
}

// Criar instância global
window.dataService = new DataService();
