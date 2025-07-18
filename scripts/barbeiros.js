

class DataService {
  constructor() {
    this.supabase = window.supabase;
  }

  async updateBarber(id, updates) {
    const { data, error } = await this.supabase
      .from('barbeiros')
      .update(updates)
      .eq('id', id);

    return { data, error };
  }

  async getBarbers() {
    const { data, error } = await this.supabase
      .from('barbeiros')
      .select('*');
    return data || [];
  }
}

const dataService = new DataService();



class Barbeiros {
  constructor() {
    this.dataService = dataService;
    this.barbeiros = [];
  }

  async init() {
    this.setupEventListeners();
    try {
      this.barbeiros = await this.dataService.getBarbers();
      console.log('📦 Barbeiros recebidos:', this.barbeiros);
    } catch (err) {
      console.error('Erro ao carregar barbeiros via DataService:', err);
      //this.barbeiros = this.getDefaultBarbeiros();
    }
    this.renderBarbeiros();
  }

  setupEventListeners() {
    document.getElementById('add-barber-btn')?.addEventListener('click', () => this.showAddBarberModal());
    document.getElementById('add-primary-barber')?.addEventListener('click', () => this.showAddBarberModal());
  }

  renderBarbeiros() {
    const container = document.getElementById('barbeiros-list');
    if (!container) return;

    if (!this.barbeiros.length) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-feather="users"></i>
          <h3>Nenhum barbeiro cadastrado</h3>
          <p>Adicione barbeiros para começar a gerenciar a equipe</p>
          <button class="primary-btn" id="add-primary-barber">
            <i data-feather="plus"></i> Adicionar Primeiro Barbeiro
          </button>
        </div>`;
      feather.replace();
      this.setupEventListeners();
      return;
    }

    const html = this.barbeiros.map(b => {
      const days = b.dias_disponiveis || [];
      const scheduleHtml = [
        'domingo','segunda','terca','quarta','quinta','sexta','sabado'
      ].map(day => `
        <div class="day-indicator ${days.includes(day) ? 'available' : 'unavailable'}" title="${day}">
          ${day.slice(0,3).charAt(0).toUpperCase()+day.slice(1,3)}
        </div>
      `).join('');

      return `
        <div class="barber-card" data-barber-id="${b.id}">
          <div class="barber-header">
            <div class="barber-avatar" style="background-color: ${b.cor_tema || '#00d4ff'}20; border: 2px solid ${b.cor_tema || '#00d4ff'}">
              <i data-feather="user"></i>
            </div>
            <div class="barber-info">
              <h3>${b.nome}</h3>
              <p>${b.email || ''}</p>
              <p>${b.telefone || ''}</p>
            </div>
            <span class="status-badge status-${b.status}">${b.status === 'ativo' ? 'Ativo' : 'Inativo'}</span>
          </div>

          <div class="barber-details">
            <div class="detail-section">
              <h4><i data-feather="clock"></i> Horário de Trabalho</h4>
              <p>${b.horario_inicio} às ${b.horario_fim}</p>
            </div>
            <div class="detail-section">
              <h4><i data-feather="calendar"></i> Dias Disponíveis</h4>
              <div class="days-grid">${scheduleHtml}</div>
            </div>
            <div class="detail-section">
              <h4><i data-feather="percent"></i> Comissão</h4>
              <p>${b.comissao}%</p>
            </div>
          </div>

          <div class="barber-actions">
            <button onclick="window.Barbeiros.editarBarbeiro('${b.id}')">Editar</button>
            <button class="secondary-btn ${b.status === 'ativo' ? 'danger' : 'success'}" onclick="window.Barbeiros.toggleBarberStatus('${b.id}')">
              <i data-feather="${b.status === 'ativo' ? 'user-x' : 'user-check'}"></i> ${b.status === 'ativo' ? 'Desativar' : 'Ativar'}
            </button>
          </div>
        </div>`;
    }).join('');

    container.innerHTML = html;
    feather.replace();
  }

  getDefaultBarbeiros() {
    return [
      { id: '1', nome: 'Renne', email: 'renne@barbearia.com', telefone: '(11) 99999-9999', status: 'ativo', cor_tema: '#00d4ff', horario_inicio: '08:00', horario_fim: '18:00', dias_disponiveis: ['segunda','terca','quarta','quinta','sexta','sabado'], comissao: 50 },
      { id: '2', nome: 'Lele', email: 'lele@barbearia.com', telefone: '(11) 99999-9998', status: 'ativo', cor_tema: '#ffc107', horario_inicio: '09:00', horario_fim: '19:00', dias_disponiveis: ['segunda','terca','quarta','quinta','sexta'], comissao: 50 }
    ];
  }

  showBarberModal(barbeiro) {
  // Exemplo simples — você pode adaptar para abrir um modal real
  const formHtml = `
    <h2>Editar Barbeiro</h2>
    <label>Nome:</label><input id="edit-nome" value="${barbeiro.nome}">
    <label>Email:</label><input id="edit-email" value="${barbeiro.email}">
    <label>Telefone:</label><input id="edit-telefone" value="${barbeiro.telefone}">
    <label>Comissão:</label><input id="edit-comissao" value="${barbeiro.comissao}">
    <button id="save-edicao-btn" class="primary-btn">Salvar</button>
  `;

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = formHtml;
  document.body.appendChild(modal);
}

async salvarEdicao(id) {
  const barbeiro = this.barbeiros.find(b => b.id === id);
  if (!barbeiro) return;

  const nome = document.getElementById('edit-nome').value;
  const email = document.getElementById('edit-email').value;
  const telefone = document.getElementById('edit-telefone').value;
  const comissao = document.getElementById('edit-comissao').value;

  // Atualiza os dados localmente
  barbeiro.nome = nome;
  barbeiro.email = email;
  barbeiro.telefone = telefone;
  barbeiro.comissao = parseInt(comissao);

  try {
    await this.dataService.updateBarber(id, {
      nome,
      email,
      telefone,
      comissao: parseInt(comissao)
    });
    Utils.showToast('Barbeiro atualizado com sucesso!', 'success');
    this.renderBarbeiros();
    document.querySelector('.modal')?.remove(); // fecha o modal
  } catch (error) {
    Utils.showToast('Erro ao salvar barbeiro.', 'error');
    console.error(error);
  }
}




 editarBarbeiro(id) {
  const barbeiro = this.barbeiros.find(b => b.id === id);
  if (!barbeiro) return;

  this.showBarberModal(barbeiro);

  // Preenche os campos do modal
  document.getElementById('edit-nome').value = barbeiro.nome || '';
  document.getElementById('edit-email').value = barbeiro.email || '';
  document.getElementById('edit-telefone').value = barbeiro.telefone || '';
  document.getElementById('edit-comissao').value = barbeiro.comissao || 0;

  // Armazena o ID para usar ao salvar
  document.getElementById('save-edicao-btn').onclick = () => {
  this.salvarEdicao(id);
};


  // Mostra o modal (certifique-se que #modal-editar exista no HTML)
  document.getElementById('modal-editar').style.display = 'flex';
}



async toggleBarberStatus(id) {
  const barbeiro = this.barbeiros.find(b => b.id === id);
  if (!barbeiro) {
    console.error('Barbeiro não encontrado para ID:', id);
    return;
  }

  const novoStatus = barbeiro.status === 'ativo' ? 'inativo' : 'ativo';
  const updates = { status: novoStatus };

  try {
    const { data, error } = await this.dataService.updateBarber(barbeiro.id, updates);

    if (error) {
      console.error("Erro ao atualizar status do barbeiro:", error);
    } else {
      barbeiro.status = novoStatus;
      this.renderBarbeiros(); // ← função correta
    }
  } catch (err) {
    console.error('Erro inesperado:', err);
  }
}






}

const app = new Barbeiros();
window.Barbeiros = app;

document.addEventListener('DOMContentLoaded', () => {
  app.init();

  const saveBtn = document.getElementById('save-edicao-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const id = saveBtn.dataset.barbeiroId;
      if (id) app.salvarEdicao(id);
    });
  }
});


