// Fallback system to handle Supabase errors gracefully

class FallbackSystem {
    static isSupabaseAvailable = null;
    static hasChecked = false;

    static async checkSupabaseConnection() {
        if (this.hasChecked) {
            return this.isSupabaseAvailable;
        }

        try {
            // Try a simple request to check if Supabase is working
            if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
                throw new Error('Supabase credentials not configured');
            }

            const client = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
            await client.from('barbeiros').select('count').limit(1);
            
            this.isSupabaseAvailable = true;
            console.log('✅ Supabase connection verified');
        } catch (error) {
            this.isSupabaseAvailable = false;
            console.log('📊 Using demo data (Supabase not configured)');
        }

        this.hasChecked = true;
        return this.isSupabaseAvailable;
    }

    static async safeSupabaseCall(callback, fallbackData = []) {
        const isAvailable = await this.checkSupabaseConnection();
        
        if (!isAvailable) {
            return fallbackData;
        }

        try {
            return await callback();
        } catch (error) {
            console.log('Using fallback data due to API error');
            return fallbackData;
        }
    }

    // Safe wrapper for appointments
    static async getAppointments(barber) {
        return this.safeSupabaseCall(
            async () => {
                const client = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
                const { data, error } = await client
                    .from(`agendamentos_${barber}`)
                    .select('*')
                    .order('data', { ascending: true });
                
                if (error) throw error;
                return data || [];
            },
            window.DemoData ? DemoData.getAppointments(barber) : []
        );
    }

    // Safe wrapper for barbers
    static async getBarbers() {
        return this.safeSupabaseCall(
            async () => {
                const client = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
                const { data, error } = await client
                    .from('barbeiros')
                    .select('*')
                    .order('nome', { ascending: true });
                
                if (error) throw error;
                return data || [];
            },
            window.DemoData ? DemoData.getBarbers() : []
        );
    }

    // Safe wrapper for notices
    static async getNotices() {
        return this.safeSupabaseCall(
            async () => {
                const client = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
                const { data, error } = await client
                    .from('avisos')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                return data || [];
            },
            window.DemoData ? DemoData.getNoticesHistory() : []
        );
    }

    static async getCurrentNotice() {
        return this.safeSupabaseCall(
            async () => {
                const client = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
                const { data, error } = await client
                    .from('avisos')
                    .select('*')
                    .eq('ativo', true)
                    .single();
                
                if (error && error.code !== 'PGRST116') throw error;
                return data;
            },
            window.DemoData ? DemoData.getCurrentNotice() : null
        );
    }
}

// Make available globally
window.FallbackSystem = FallbackSystem;