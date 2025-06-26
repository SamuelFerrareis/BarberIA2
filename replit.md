# Sistema de Gestão - Barbearia

## Overview

This is a barbershop management system built with vanilla HTML, CSS, and JavaScript. The system serves as an admin panel for a barbershop that works in conjunction with a booking chatbot. It provides comprehensive management features including appointment scheduling, reporting, barber management, and bot communication.

## System Architecture

### Frontend Architecture
- **Vanilla JavaScript**: Modular architecture using ES6 classes
- **CSS Custom Properties**: Theme system with dark mode support
- **Mobile-First Design**: Responsive layout optimized for mobile devices
- **Accessibility Features**: Font scaling, theme switching, and high contrast support

### Backend Architecture
- **Supabase Integration**: Authentication and database services
- **Real-time Data**: Live updates for appointments and notifications
- **Local Storage**: Session persistence and user preferences
- **Python HTTP Server**: Simple static file serving for development

## Key Components

### Authentication System (`scripts/auth.js`)
- Supabase Auth integration for user authentication
- Session management with local storage persistence
- Auto-login functionality for returning users
- Secure token handling and refresh

### Agenda Management (`scripts/agenda.js`)
- Interactive calendar system with monthly navigation
- Appointment CRUD operations
- Barber filtering (Renne, Lele, or all)
- Modal-based appointment editing
- Real-time appointment status updates

### Dashboard (`scripts/dashboard.js`)
- Key metrics display (daily/monthly statistics)
- Next appointments overview
- Barber status monitoring
- Auto-refresh functionality (5-minute intervals)

### Reports System (`scripts/relatorios.js`)
- Chart.js integration for data visualization
- Performance metrics by barber and time period
- Revenue tracking and analysis
- Exportable report data

### Barber Management (`scripts/barbeiros.js`)
- Barber profile management
- Working hours configuration
- Availability scheduling
- Service pricing management

### Bot Communication (`scripts/avisos.js`)
- Manual notice system for bot integration
- Real-time message updates
- Notice history tracking
- Bot status monitoring

### Utility Functions (`scripts/utils.js`)
- Date/time formatting utilities
- Currency formatting (Brazilian Real)
- Local storage management
- Error handling and toast notifications
- Theme and accessibility controls

## Data Flow

1. **User Authentication**: Login via Supabase Auth → Session stored locally
2. **Data Loading**: Parallel fetching from Supabase tables for appointments, barbers, and notices
3. **Real-time Updates**: Supabase real-time subscriptions for live data synchronization
4. **Local Caching**: Critical data cached in localStorage for offline functionality
5. **Bot Integration**: Notice system provides communication channel with booking bot

## External Dependencies

### Core Services
- **Supabase**: Backend-as-a-Service for authentication and database
  - Tables: `agendamentos_renne`, `agendamentos_lele`, `barbeiros`, `avisos`
  - Real-time subscriptions for live updates
  - Row Level Security (RLS) for data protection

### Frontend Libraries
- **Chart.js**: Data visualization for reports and analytics
- **Feather Icons**: Icon library for UI elements
- **Supabase JavaScript Client**: Official client library

### Development Environment
- **Python HTTP Server**: Local development server (port 5000)
- **Node.js Runtime**: For potential future enhancements

## Deployment Strategy

### Current Setup
- Static file serving via Python HTTP server
- Environment variables for Supabase configuration
- Replit-optimized workflow configuration

### Production Considerations
- CDN deployment for static assets
- HTTPS enforcement for security
- Environment-specific configuration management
- Performance monitoring and error tracking

### Database Schema
```sql
-- Appointments tables (one per barber)
agendamentos_renne (id, nome, telefone, servico, data, horario, preco, status, observacoes)
agendamentos_lele (id, nome, telefone, servico, data, horario, preco, status, observacoes)

-- Barbers management
barbeiros (id, nome, status, horarios, servicos, foto_url)

-- Bot communication
avisos (id, conteudo, ativo, created_at, updated_at)
```

## Changelog
- June 26, 2025. Initial setup
- June 26, 2025. Integrated existing agenda code with new system architecture
- June 26, 2025. Implemented Supabase authentication and database connectivity
- June 26, 2025. Added comprehensive theme system with dark mode default
- June 26, 2025. Created mobile-first responsive design with accessibility features

## Integration Notes

### Existing Agenda Code Integration
The existing HTML, CSS, and JavaScript agenda code has been successfully integrated into the new modular system:

**Preserved Features:**
- Complete calendar functionality with monthly navigation
- Appointment creation, editing, and deletion
- Barber filtering (Renne, Lele, Todos)
- Mobile-responsive grid layout
- Status-based appointment styling

**Enhanced Features:**
- Integrated with new theme system (dark, light, colorful)
- Improved accessibility with ARIA labels
- Better error handling and loading states
- Toast notifications for user feedback
- Consistent styling with other modules

**Technical Implementation:**
- Original calendar logic preserved in `scripts/agenda.js`
- Enhanced styling in `styles/agenda.css` that integrates with CSS variables
- Global functions maintained for onclick handlers
- Supabase integration added while keeping original structure

## User Preferences

Preferred communication style: Simple, everyday language.

### System Requirements Completed
- ✅ Sistema web completo com HTML, CSS e JavaScript puro
- ✅ Painel administrativo de barbearia integrado com chatbot
- ✅ Conexão com Supabase (Auth + banco de dados)
- ✅ Interface mobile-first, acessível e responsiva
- ✅ Armazenamento local (localStorage) para sessão e preferências
- ✅ Login com Supabase Auth e persistência de sessão
- ✅ Dashboard com agenda e calendário mensal interativo
- ✅ Sistema de relatórios com gráficos (Chart.js)
- ✅ Gestão de barbeiros com horários e disponibilidade
- ✅ Sistema de avisos para comunicação com bot
- ✅ Controles de acessibilidade (fonte e temas)
- ✅ Design futurístico inspirado em staratlas.com e squadeasy.com
- ✅ Tema escuro como padrão com alternativas (claro/colorido)

### Accessibility Features
- **Font Scaling**: Adjustable text size (14px - 20px range)
- **Theme System**: Dark mode (default), light mode, and high contrast options
- **Mobile Optimization**: Touch-friendly interface with large tap targets
- **Keyboard Navigation**: Full keyboard accessibility support
- **Screen Reader**: ARIA labels and semantic HTML structure

### Browser Compatibility
- Modern browsers with ES6 support
- Progressive Web App capabilities
- Offline functionality through service workers (planned)
- Local storage fallbacks for critical features