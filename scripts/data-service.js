// Unified data service that handles both demo and real data

class DataService {
    constructor() {
        this.isDemo = true; // Start with demo mode by default
        this.supabase = null;
        this.initializeSupabase();
    }

    initializeSupabase() {
        try {
            if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY && 
                window.SUPABASE_URL !== 'your-supabase-url' && 
                window.SUPABASE_ANON_KEY !== 'your-supabase-anon-key') {
                
                this.supabase = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
                this.isDemo = false;
                console.log('📡 Connected to Supabase');
            } else {
                console.log('📊 Running in demo mode - configure Supabase for live data');
                this.isDemo = true;
            }
        } catch (error) {
            console.log('📊 Running in demo mode - Supabase configuration error');
            this.isDemo = true;
        }
    }

    // Appointments
    async getAppointments(barber = null) {
        if (this.isDemo) {
            return DemoData.getAppointments(barber);
        }

        try {
            if (barber && barber !== 'todos') {
                const { data, error } = await this.supabase
                    .from(`agendamentos_${barber}`)
                    .select('*')
                    .order('data', { ascending: true });
                
                if (error) throw error;
                return data || [];
            } else {
                // Get all appointments
                const [renneData, leleData] = await Promise.all([
                    this.supabase.from('agendamentos_renne').select('*'),
                    this.supabase.from('agendamentos_lele').select('*')
                ]);
                
                return [...(renneData.data || []), ...(leleData.data || [])];
            }
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
                .from(`agendamentos_${barber}`)
                .insert([appointment])
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
                .from(`agendamentos_${barber}`)
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
                .from(`agendamentos_${barber}`)
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting appointment:', error);
            return DemoData.deleteAppointment(id, barber);
        }
    }

    // Barbers
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

    // Notices
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

    // Status check
    isDemoMode() {
        return this.isDemo;
    }
}

// Create global instance
window.dataService = new DataService();