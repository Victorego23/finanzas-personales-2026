/**
 * Control Financiero Personal 2026
 * Arquitectura Limpia - Controlador de Estado y Persistencia Local
 */

// Key para el almacenamiento seguro en localStorage
const STORAGE_KEY = 'FINANZAS_2026_DATA_V1';
const CURRENCY_KEY = 'FINANZAS_2026_CURRENCY';

// Iconos por categoría
const CATEGORY_ICONS = {
  'Trabajo / Nomina': 'fa-briefcase',
  'Vivienda': 'fa-house',
  'Servicios': 'fa-bolt',
  'Alimentacion': 'fa-cart-shopping',
  'Transporte': 'fa-car',
  'Salud': 'fa-heart-pulse',
  'Educacion': 'fa-graduation-cap',
  'Deudas / Tarjetas': 'fa-credit-card',
  'Entretenimiento': 'fa-film',
  'Inversion': 'fa-chart-line',
  'Otro': 'fa-layer-group'
};

// Datos iniciales de demostración para el año 2026 (en Soles Peruanos - PEN S/)
const INITIAL_DEMO_DATA = [
  {
    id: 'demo-1',
    type: 'income',
    description: 'Salario Fijo Mensual 2026',
    amount: 3800.00,
    category: 'Trabajo / Nomina',
    frequency: 'Fijo',
    date: '2026-01-15'
  },
  {
    id: 'demo-2',
    type: 'income',
    description: 'Proyecto Freelance Frontend',
    amount: 1500.00,
    category: 'Inversion',
    frequency: 'Variable',
    date: '2026-01-20'
  },
  {
    id: 'demo-3',
    type: 'expense',
    description: 'Arriendo Vivienda',
    amount: 1400.00,
    category: 'Vivienda',
    frequency: 'Fijo',
    date: '2026-01-05'
  },
  {
    id: 'demo-4',
    type: 'expense',
    description: 'Servicios Públicos (Luz, Agua, Fibra)',
    amount: 320.00,
    category: 'Servicios',
    frequency: 'Fijo',
    date: '2026-01-10'
  },
  {
    id: 'demo-5',
    type: 'debt',
    description: 'Cuota Tarjeta de Crédito 2026',
    amount: 450.00,
    category: 'Deudas / Tarjetas',
    frequency: 'Fijo',
    date: '2026-01-18'
  }
];

class FinanceApp {
  constructor() {
    this.transactions = [];
    this.currentCurrency = localStorage.getItem(CURRENCY_KEY) || 'PEN';
    this.activeFilter = 'all';
    this.searchQuery = '';

    // Referencias a elementos del DOM
    this.dom = {
      totalIncome: document.getElementById('totalIncome'),
      incomeCount: document.getElementById('incomeCount'),
      totalExpenses: document.getElementById('totalExpenses'),
      expenseCount: document.getElementById('expenseCount'),
      netBalance: document.getElementById('netBalance'),
      balanceStatusText: document.getElementById('balanceStatusText'),
      healthRatio: document.getElementById('healthRatio'),
      progressPercentage: document.getElementById('progressPercentage'),
      progressBarFill: document.getElementById('progressBarFill'),
      
      transactionForm: document.getElementById('transactionForm'),
      descriptionInput: document.getElementById('descriptionInput'),
      amountInput: document.getElementById('amountInput'),
      categorySelect: document.getElementById('categorySelect'),
      frequencySelect: document.getElementById('frequencySelect'),
      dateInput: document.getElementById('dateInput'),
      
      transactionsList: document.getElementById('transactionsList'),
      searchInput: document.getElementById('searchInput'),
      filterPills: document.querySelectorAll('.filter-pills .pill'),
      currencySelect: document.getElementById('currencySelect'),
      
      exportBtn: document.getElementById('exportBtn'),
      importFile: document.getElementById('importFile'),
      clearAllBtn: document.getElementById('clearAllBtn')
    };

    this.init();
  }

  init() {
    this.loadData();
    this.setDefaultDate();
    this.bindEvents();
    this.render();
  }

  // Establece la fecha actual por defecto en el formulario
  setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    this.dom.dateInput.value = today;
  }

  // Carga los datos desde localStorage o inicializa con demo
  loadData() {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      try {
        this.transactions = JSON.parse(storedData);
      } catch (e) {
        console.error('Error al cargar datos de localStorage, usando demo:', e);
        this.transactions = [...INITIAL_DEMO_DATA];
      }
    } else {
      this.transactions = [...INITIAL_DEMO_DATA];
      this.saveData();
    }

    if (this.dom.currencySelect) {
      this.dom.currencySelect.value = this.currentCurrency;
    }
  }

  // Guarda el estado actual en localStorage
  saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.transactions));
    localStorage.setItem(CURRENCY_KEY, this.currentCurrency);
  }

  // Event Listeners
  bindEvents() {
    // Formulario de añadir movimiento
    this.dom.transactionForm.addEventListener('submit', (e) => this.handleAddTransaction(e));

    // Filtros por pill
    this.dom.filterPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        this.dom.filterPills.forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        this.activeFilter = e.target.dataset.filter;
        this.renderTransactions();
      });
    });

    // Búsqueda en tiempo real
    this.dom.searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderTransactions();
    });

    // Selector de moneda
    this.dom.currencySelect.addEventListener('change', (e) => {
      this.currentCurrency = e.target.value;
      this.saveData();
      this.render();
    });

    // Delegación de eventos para eliminar
    this.dom.transactionsList.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.btn-delete');
      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        this.deleteTransaction(id);
      }
    });

    // Exportar respaldo JSON
    this.dom.exportBtn.addEventListener('click', () => this.exportBackup());

    // Importar respaldo JSON
    this.dom.importFile.addEventListener('change', (e) => this.importBackup(e));

    // Reiniciar datos
    this.dom.clearAllBtn.addEventListener('click', () => this.clearAllData());
  }

  // Añade una nueva transacción
  handleAddTransaction(e) {
    e.preventDefault();

    const typeEl = document.querySelector('input[name="transactionType"]:checked');
    const type = typeEl ? typeEl.value : 'income';
    const description = this.dom.descriptionInput.value.trim();
    const amount = parseFloat(this.dom.amountInput.value);
    const category = this.dom.categorySelect.value;
    const frequency = this.dom.frequencySelect.value;
    const date = this.dom.dateInput.value || new Date().toISOString().split('T')[0];

    if (!description || isNaN(amount) || amount <= 0) {
      alert('Por favor, ingresa una descripción válida y un monto mayor a cero.');
      return;
    }

    const newTransaction = {
      id: 'tx-' + Date.now(),
      type,
      description,
      amount,
      category,
      frequency,
      date
    };

    this.transactions.unshift(newTransaction);
    this.saveData();
    this.render();

    // Resetear formulario
    this.dom.descriptionInput.value = '';
    this.dom.amountInput.value = '';
    this.setDefaultDate();
  }

  // Elimina una transacción por ID
  deleteTransaction(id) {
    if (confirm('¿Estás seguro de eliminar este registro?')) {
      this.transactions = this.transactions.filter(tx => tx.id !== id);
      this.saveData();
      this.render();
    }
  }

  // Formateador de moneda con Intl
  formatCurrency(value) {
    const currencyMap = {
      PEN: { locale: 'es-PE', currency: 'PEN', decimals: 2 },
      USD: { locale: 'en-US', currency: 'USD', decimals: 2 },
      EUR: { locale: 'de-DE', currency: 'EUR', decimals: 2 },
      COP: { locale: 'es-CO', currency: 'COP', decimals: 0 },
      MXN: { locale: 'es-MX', currency: 'MXN', decimals: 2 }
    };

    const config = currencyMap[this.currentCurrency] || currencyMap.PEN;

    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency,
      maximumFractionDigits: config.decimals
    }).format(value);
  }

  // Calcula métricas financieras
  calculateMetrics() {
    let totalIncome = 0;
    let incomeCount = 0;
    let totalExpenses = 0;
    let expenseCount = 0;

    this.transactions.forEach(tx => {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
        incomeCount++;
      } else {
        totalExpenses += tx.amount;
        expenseCount++;
      }
    });

    const netBalance = totalIncome - totalExpenses;
    const savingsRatio = totalIncome > 0 ? Math.max(0, ((netBalance / totalIncome) * 100)) : 0;
    const progressPercent = totalIncome > 0 ? Math.min(100, Math.round((totalExpenses / totalIncome) * 100)) : 0;

    return {
      totalIncome,
      incomeCount,
      totalExpenses,
      expenseCount,
      netBalance,
      savingsRatio: Math.round(savingsRatio),
      progressPercent
    };
  }

  // Renderiza todo el Dashboard
  render() {
    const metrics = this.calculateMetrics();

    // Actualizar KPIs
    this.dom.totalIncome.textContent = this.formatCurrency(metrics.totalIncome);
    this.dom.incomeCount.textContent = metrics.incomeCount;

    this.dom.totalExpenses.textContent = this.formatCurrency(metrics.totalExpenses);
    this.dom.expenseCount.textContent = metrics.expenseCount;

    this.dom.netBalance.textContent = this.formatCurrency(metrics.netBalance);
    
    // Estado del balance
    if (metrics.netBalance > 0) {
      this.dom.balanceStatusText.textContent = 'Superávit saludable';
      this.dom.balanceStatusText.style.color = 'var(--income-color)';
    } else if (metrics.netBalance < 0) {
      this.dom.balanceStatusText.textContent = 'Déficit presupuestal';
      this.dom.balanceStatusText.style.color = 'var(--expense-color)';
    } else {
      this.dom.balanceStatusText.textContent = 'Equilibrio exacto';
      this.dom.balanceStatusText.style.color = 'var(--text-muted)';
    }

    this.dom.healthRatio.textContent = `${metrics.savingsRatio}%`;
    this.dom.progressPercentage.textContent = `${metrics.progressPercent}% comprometido`;
    this.dom.progressBarFill.style.width = `${metrics.progressPercent}%`;

    this.renderTransactions();
  }

  // Renderiza la lista de transacciones con filtros y búsqueda
  renderTransactions() {
    const container = this.dom.transactionsList;
    container.innerHTML = '';

    const filtered = this.transactions.filter(tx => {
      // Filtro de tipo / fija
      let matchesFilter = true;
      if (this.activeFilter === 'income') matchesFilter = tx.type === 'income';
      else if (this.activeFilter === 'expense') matchesFilter = tx.type === 'expense';
      else if (this.activeFilter === 'debt') matchesFilter = tx.type === 'debt';
      else if (this.activeFilter === 'fixed') matchesFilter = tx.frequency === 'Fijo';

      // Búsqueda
      let matchesSearch = true;
      if (this.searchQuery) {
        matchesSearch = tx.description.toLowerCase().includes(this.searchQuery) ||
                        tx.category.toLowerCase().includes(this.searchQuery);
      }

      return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-folder-open"></i>
          <p>No se encontraron movimientos registrados con los filtros actuales.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(tx => {
      const itemEl = document.createElement('div');
      itemEl.className = `tx-item tx-${tx.type}`;

      const iconClass = CATEGORY_ICONS[tx.category] || 'fa-receipt';
      const typeSign = tx.type === 'income' ? '+' : '-';

      itemEl.innerHTML = `
        <div class="tx-left">
          <div class="tx-icon">
            <i class="fa-solid ${iconClass}"></i>
          </div>
          <div class="tx-details">
            <span class="tx-title">${this.escapeHtml(tx.description)}</span>
            <div class="tx-meta">
              <span class="badge-tag">${this.escapeHtml(tx.category)}</span>
              <span>&bull; ${tx.frequency}</span>
              <span>&bull; ${tx.date}</span>
            </div>
          </div>
        </div>

        <div class="tx-right">
          <span class="tx-amount">${typeSign} ${this.formatCurrency(tx.amount)}</span>
          <button class="btn-delete" data-id="${tx.id}" title="Eliminar registro">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;

      container.appendChild(itemEl);
    });
  }

  // Previene XSS al renderizar texto del usuario
  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Exportar respaldo de seguridad en JSON
  exportBackup() {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      currency: this.currentCurrency,
      transactions: this.transactions
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Finanzas_2026_Respaldo_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  // Importar respaldo JSON
  importBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported && Array.isArray(imported.transactions)) {
          this.transactions = imported.transactions;
          if (imported.currency) this.currentCurrency = imported.currency;
          this.saveData();
          this.render();
          alert('¡Respaldo importado con éxito!');
        } else {
          alert('El archivo no contiene un formato de respaldo válido.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON de respaldo.');
      }
    };
    reader.readAsText(file);

    // Reset file input
    e.target.value = '';
  }

  // Reiniciar todos los datos
  clearAllData() {
    if (confirm('⚠️ ¿ATENCIÓN: Quieres borrar TODOS los datos de tu control financiero 2026? Esta acción no se puede deshacer.')) {
      this.transactions = [];
      this.saveData();
      this.render();
    }
  }
}

// Inicializar la aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  window.financeApp = new FinanceApp();
});
