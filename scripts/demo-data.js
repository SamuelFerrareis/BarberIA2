// Demo data for the barbershop management system
// This provides local data while Supabase is not configured

class DemoData {
    static appointments = {
        renne: [
            {
                id: 1,
                nome: 'João Silva',
                telefone: '(11) 99999-1111',
                servico: 'Corte + Barba',
                data: '2025-06-26',
                horario: '09:00',
                preco: 45.00,
                status: 'confirmado',
                observacoes: 'Cliente preferencial'
            },
            {
                id: 2,
                nome: 'Pedro Santos',
                telefone: '(11) 99999-2222',
                servico: 'Corte',
                data: '2025-06-26',
                horario: '13:10',
                preco: 25.00,
                status: 'agendado',
                observacoes: ''
            },
            {
                id: 3,
                nome: 'Carlos Lima',
                telefone: '(11) 99999-3333',
                servico: 'Barba',
                data: '2025-06-26',
                horario: '15:45',
                preco: 20.00,
                status: 'confirmado',
                observacoes: ''
            },
            {
                id: 4,
                nome: 'Roberto Oliveira',
                telefone: '(11) 99999-4444',
                servico: 'Corte + Barba',
                data: '2025-06-27',
                horario: '14:30',
                preco: 45.00,
                status: 'agendado',
                observacoes: ''
            }
        ],
        lele: [
            {
                id: 5,
                nome: 'Ana Costa',
                telefone: '(11) 99999-5555',
                servico: 'Corte Feminino',
                data: '2025-06-26',
                horario: '11:20',
                preco: 35.00,
                status: 'confirmado',
                observacoes: 'Cliente VIP'
            },
            {
                id: 6,
                nome: 'Ricardo Mendes',
                telefone: '(11) 99999-6666',
                servico: 'Corte + Barba',
                data: '2025-06-26',
                horario: '16:15',
                preco: 45.00,
                status: 'agendado',
                observacoes: ''
            },
            {
                id: 7,
                nome: 'Maria Oliveira',
                telefone: '(11) 99999-3333',
                servico: 'Corte Feminino',
                data: '2025-06-27',
                horario: '10:00',
                preco: 35.00,
                status: 'confirmado',
                observacoes: 'Primeira vez'
            }
        ]
    };

    static barbers = [
        {
            id: 1,
            nome: 'Renne',
            email: 'renne@barbearia.com',
            telefone: '(11) 99999-5555',
            status: 'ativo',
            horario_inicio: '08:00',
            horario_fim: '18:00',
            comissao: 60,
            cor_tema: '#00d4ff',
            especialidades: ['Corte Masculino', 'Barba', 'Degradê'],
            horarios_personalizados: {
                segunda: { ativo: true, inicio: '08:00', fim: '17:00' },
                terca: { ativo: true, inicio: '08:00', fim: '17:00' },
                quarta: { ativo: true, inicio: '08:00', fim: '17:00' },
                quinta: { ativo: true, inicio: '08:00', fim: '17:00' },
                sexta: { ativo: true, inicio: '08:00', fim: '18:00' },
                sabado: { ativo: true, inicio: '08:00', fim: '16:00' },
                domingo: { ativo: false, inicio: '08:00', fim: '18:00' }
            }
        },
        {
            id: 2,
            nome: 'Lele',
            email: 'lele@barbearia.com',
            telefone: '(11) 99999-6666',
            status: 'ativo',
            horario_inicio: '09:00',
            horario_fim: '17:00',
            comissao: 55,
            cor_tema: '#ff6b35',
            especialidades: ['Corte Feminino', 'Corte Infantil', 'Escova'],
            horarios_personalizados: {
                segunda: { ativo: true, inicio: '09:00', fim: '17:00' },
                terca: { ativo: true, inicio: '09:00', fim: '17:00' },
                quarta: { ativo: false, inicio: '09:00', fim: '17:00' },
                quinta: { ativo: true, inicio: '09:00', fim: '17:00' },
                sexta: { ativo: true, inicio: '09:00', fim: '17:00' },
                sabado: { ativo: true, inicio: '09:00', fim: '15:00' },
                domingo: { ativo: false, inicio: '09:00', fim: '17:00' }
            }
        }
    ];

    static notices = [
        {
            id: 1,
            conteudo: 'Estamos funcionando normalmente! Agende seu horário.',
            ativo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ];

    static getAppointments(barber = null) {
        if (barber && barber !== 'todos') {
            return this.appointments[barber] || [];
        }
        return [...this.appointments.renne, ...this.appointments.lele];
    }

    static getBarbers() {
        return this.barbers;
    }

    static getCurrentNotice() {
        return this.notices.find(n => n.ativo) || null;
    }

    static getNoticesHistory() {
        return this.notices;
    }

    static addAppointment(appointment, barber) {
        const newId = Math.max(...Object.values(this.appointments).flat().map(a => a.id), 0) + 1;
        const newAppointment = { ...appointment, id: newId };
        
        if (!this.appointments[barber]) {
            this.appointments[barber] = [];
        }
        
        this.appointments[barber].push(newAppointment);
        return newAppointment;
    }

    static updateAppointment(id, data, barber) {
        const appointments = this.appointments[barber];
        if (appointments) {
            const index = appointments.findIndex(a => a.id === id);
            if (index !== -1) {
                appointments[index] = { ...appointments[index], ...data };
                return appointments[index];
            }
        }
        return null;
    }

    static deleteAppointment(id, barber) {
        const appointments = this.appointments[barber];
        if (appointments) {
            const index = appointments.findIndex(a => a.id === id);
            if (index !== -1) {
                return appointments.splice(index, 1)[0];
            }
        }
        return null;
    }
}

// Make demo data globally available
window.DemoData = DemoData;