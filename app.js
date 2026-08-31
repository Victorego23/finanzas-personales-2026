/**
 * Finanzas Tommy 2026 - Versión Fintech PWA Completa
 * Incluye: Visual Analytics (Chart.js), Presupuestos, Metas de Ahorro,
 * Calculadora de Deudas, PWA Offline, Exportación Excel CSV y PIN Local.
 */

const STORAGE_KEY = 'FINANZAS_2026_DATA_V1';
const CURRENCY_KEY = 'FINANZAS_2026_CURRENCY';
const BUDGETS_KEY = 'FINANZAS_2026_BUDGETS';
const GOALS_KEY = 'FINANZAS_2026_GOALS';
const PIN_KEY = 'FINANZAS_2026_PIN';

const CATEGORY_ICONS = Object.freeze({
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
});

const INITIAL_DEMO_DATA = Object.freeze([
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
]);

const INITIAL_BUDGETS = Object.freeze({
  'Vivienda': 1500,
  'Alimentacion': 800,
  'Servicios': 400,
  'Transporte': 300
});

const INITIAL_GOALS = Object.freeze([
  { id: 'goal-1', title: 'Fondo de Emergencia 2026', target: 5000, current: 1800 },
  { id: 'goal-2', title: 'Viaje Fin de Año', target: 3000, current: 750 }
]);

function debounce(func, wait = 150) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

class FinanceApp {
  constructor() {
    this.transactions = [];
    this.budgets = {};
    this.goals = [];
    this.currentCurrency = this.loadStoredCurrency();
    this.activeFilter = 'all';
    this.searchQuery = '';
    this.enteredPin = '';
    this.savedPin = localStorage.getItem(PIN_KEY) || '';
    
    this.formatters = new Map();
    this.charts = { expenseChart: null, barChart: null };

    this.registerServiceWorker();
    this.cacheDomElements();
    this.loadData();
    this.initEventListeners();
    this.checkPinSecurity();
    this.setDefaultDate();
    this.render();
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(() => console.log('Service Worker registrado correctamente'))
        .catch(err => console.log('Error registrando Service Worker:', err));
    }
  }

  loadStoredCurrency() {
    try {
      return localStorage.getItem(CURRENCY_KEY) || 'PEN';
    } catch (e) {
      return 'PEN';
    }
  }

  cacheDomElements() {
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
      budgetsList: document.getElementById('budgetsList'),
      goalsList: document.getElementById('goalsList'),
      
      currencySelect: document.getElementById('currencySelect'),
      searchInput: document.getElementById('searchInput'),
      filterPills: document.querySelectorAll('.filter-pills .pill'),
      
      exportCsvBtn: document.getElementById('exportCsvBtn'),
      exportBtn: document.getElementById('exportBtn'),
      importFile: document.getElementById('importFile'),
      clearAllBtn: document.getElementById('clearAllBtn'),
      
      // Debt Calculator
      calcAmount: document.getElementById('calcAmount'),
      calcRate: document.getElementById('calcRate'),
      calcPayment: document.getElementById('calcPayment'),
      calcMonthsResult: document.getElementById('calcMonthsResult'),
      calcInterestResult: document.getElementById('calcInterestResult'),
      
      // PIN
      pinOverlay: document.getElementById('pinOverlay'),
      pinToggleBtn: document.getElementById('pinToggleBtn'),
      pinBtnText: document.getElementById('pinBtnText'),
      pinDots: document.querySelectorAll('.pin-dots .dot'),
      setBudgetBtn: document.getElementById('setBudgetBtn'),
      addGoalBtn: document.getElementById('addGoalBtn')
    };

    if (this.dom.currencySelect) {
      this.dom.currencySelect.value = this.currentCurrency;
    }
    this.updatePinBtnLabel();
  }

  loadData() {
    try {
      const storedTx = localStorage.getItem(STORAGE_KEY);
      this.transactions = storedTx ? JSON.parse(storedTx) : [...INITIAL_DEMO_DATA];

      const storedBudgets = localStorage.getItem(BUDGETS_KEY);
      this.budgets = storedBudgets ? JSON.parse(storedBudgets) : { ...INITIAL_BUDGETS };

      const storedGoals = localStorage.getItem(GOALS_KEY);
      this.goals = storedGoals ? JSON.parse(storedGoals) : [...INITIAL_GOALS];
    } catch (e) {
      this.transactions = [...INITIAL_DEMO_DATA];
      this.budgets = { ...INITIAL_BUDGETS };
      this.goals = [...INITIAL_GOALS];
    }
  }

  saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.transactions));
      localStorage.setItem(BUDGETS_KEY, JSON.stringify(this.budgets));
      localStorage.setItem(GOALS_KEY, JSON.stringify(this.goals));
    } catch (e) {
      console.error('Error guardando en LocalStorage:', e);
    }
  }

  // --- PIN SECURITY LOCK SYSTEM ---
  checkPinSecurity() {
    if (this.savedPin) {
      this.dom.pinOverlay.classList.remove('hidden');
    }
  }

  updatePinBtnLabel() {
    if (this.dom.pinBtnText) {
      this.dom.pinBtnText.textContent = this.savedPin ? 'PIN: Activo' : 'Configurar PIN';
    }
  }

  handlePinKey(key) {
    if (key === 'clear') {
      this.enteredPin = '';
    } else if (key === 'del') {
      this.enteredPin = this.enteredPin.slice(0, -1);
    } else if (this.enteredPin.length < 4 && !isNaN(key)) {
      this.enteredPin += key;
    }

    this.updatePinDots();

    if (this.enteredPin.length === 4) {
      setTimeout(() => this.verifyPin(), 100);
    }
  }

  updatePinDots() {
    this.dom.pinDots.forEach((dot, idx) => {
      if (idx < this.enteredPin.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  }

  verifyPin() {
    if (this.enteredPin === this.savedPin) {
      this.dom.pinOverlay.classList.add('hidden');
      this.enteredPin = '';
      this.updatePinDots();
    } else {
      alert('PIN Incorrecto. Intenta de nuevo.');
      this.enteredPin = '';
      this.updatePinDots();
    }
  }

  togglePinSetup() {
    if (this.savedPin) {
      if (confirm('¿Deseas desactivar la protección por PIN?')) {
        this.savedPin = '';
        localStorage.removeItem(PIN_KEY);
        this.updatePinBtnLabel();
        alert('Protección por PIN desactivada.');
      }
    } else {
      const pin = prompt('Ingresa un nuevo PIN de 4 dígitos (solo números):');
      if (pin && /^\d{4}$/.test(pin)) {
        this.savedPin = pin;
        localStorage.setItem(PIN_KEY, pin);
        this.updatePinBtnLabel();
        alert('¡PIN activado con éxito!');
      } else if (pin) {
        alert('El PIN debe ser exactamente de 4 dígitos numéricos.');
      }
    }
  }

  initEventListeners() {
    if (this.dom.transactionForm) {
      this.dom.transactionForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    if (this.dom.currencySelect) {
      this.dom.currencySelect.addEventListener('change', (e) => {
        this.currentCurrency = e.target.value;
        try { localStorage.setItem(CURRENCY_KEY, this.currentCurrency); } catch(e){}
        this.render();
      });
    }

    this.dom.filterPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        this.dom.filterPills.forEach(p => {
          p.classList.remove('active');
          p.setAttribute('aria-selected', 'false');
        });
        e.currentTarget.classList.add('active');
        e.currentTarget.setAttribute('aria-selected', 'true');
        this.activeFilter = e.currentTarget.dataset.filter;
        this.renderTransactions();
      });
    });

    if (this.dom.searchInput) {
      const debouncedSearch = debounce((e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderTransactions();
      }, 150);
      this.dom.searchInput.addEventListener('input', debouncedSearch);
    }

    if (this.dom.transactionsList) {
      this.dom.transactionsList.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.btn-delete');
        if (deleteBtn) {
          const id = deleteBtn.dataset.id;
          if (id) this.deleteTransaction(id);
        }
      });
    }

    // PIN Keypad Delegation
    const keypad = document.querySelector('.pin-keypad');
    if (keypad) {
      keypad.addEventListener('click', (e) => {
        const btn = e.target.closest('.pin-key');
        if (btn) {
          this.handlePinKey(btn.dataset.key);
        }
      });
    }

    if (this.dom.pinToggleBtn) {
      this.dom.pinToggleBtn.addEventListener('click', () => this.togglePinSetup());
    }

    // Debt Calculator Auto-computation
    const calcInputs = [this.dom.calcAmount, this.dom.calcRate, this.dom.calcPayment];
    calcInputs.forEach(input => {
      if (input) input.addEventListener('input', () => this.computeDebtPayoff());
    });

    // Budget & Goals Actions
    if (this.dom.setBudgetBtn) {
      this.dom.setBudgetBtn.addEventListener('click', () => this.promptSetBudget());
    }

    if (this.dom.addGoalBtn) {
      this.dom.addGoalBtn.addEventListener('click', () => this.promptAddGoal());
    }

    if (this.dom.goalsList) {
      this.dom.goalsList.addEventListener('click', (e) => {
        const contributeBtn = e.target.closest('.btn-contribute');
        if (contributeBtn) {
          this.promptContributeGoal(contributeBtn.dataset.id);
        }
      });
    }

    // Data Export
    if (this.dom.exportCsvBtn) {
      this.dom.exportCsvBtn.addEventListener('click', () => this.exportCSV());
    }

    if (this.dom.exportBtn) {
      this.dom.exportBtn.addEventListener('click', () => this.exportBackup());
    }

    if (this.dom.importFile) {
      this.dom.importFile.addEventListener('change', (e) => this.importBackup(e));
    }

    if (this.dom.clearAllBtn) {
      this.dom.clearAllBtn.addEventListener('click', () => this.clearAllData());
    }
  }

  setDefaultDate() {
    if (this.dom.dateInput) {
      this.dom.dateInput.value = new Date().toISOString().split('T')[0];
    }
  }

  handleFormSubmit(e) {
    e.preventDefault();

    const typeRadio = document.querySelector('input[name="transactionType"]:checked');
    const type = typeRadio ? typeRadio.value : 'income';
    const description = this.dom.descriptionInput.value.trim();
    const amount = parseFloat(this.dom.amountInput.value);
    const category = this.dom.categorySelect.value;
    const frequency = this.dom.frequencySelect.value;
    const date = this.dom.dateInput.value || new Date().toISOString().split('T')[0];

    if (!description || isNaN(amount) || amount <= 0) {
      alert('Por favor, ingresa una descripción válida y un monto mayor a 0.');
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

    this.dom.descriptionInput.value = '';
    this.dom.amountInput.value = '';
    this.setDefaultDate();
    this.dom.descriptionInput.focus();
  }

  deleteTransaction(id) {
    if (confirm('¿Estás seguro de eliminar este registro?')) {
      this.transactions = this.transactions.filter(tx => tx.id !== id);
      this.saveData();
      this.render();
    }
  }

  formatCurrency(value) {
    if (!this.formatters.has(this.currentCurrency)) {
      const currencyMap = {
        PEN: { locale: 'es-PE', currency: 'PEN', decimals: 2 },
        USD: { locale: 'en-US', currency: 'USD', decimals: 2 },
        EUR: { locale: 'de-DE', currency: 'EUR', decimals: 2 },
        COP: { locale: 'es-CO', currency: 'COP', decimals: 0 },
        MXN: { locale: 'es-MX', currency: 'MXN', decimals: 2 }
      };
      const config = currencyMap[this.currentCurrency] || currencyMap.PEN;
      this.formatters.set(this.currentCurrency, new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: config.currency,
        maximumFractionDigits: config.decimals
      }));
    }

    return this.formatters.get(this.currentCurrency).format(value);
  }

  calculateMetrics() {
    let totalIncome = 0;
    let incomeCount = 0;
    let totalExpenses = 0;
    let expenseCount = 0;

    for (let i = 0; i < this.transactions.length; i++) {
      const tx = this.transactions[i];
      if (tx.type === 'income') {
        totalIncome += tx.amount;
        incomeCount++;
      } else {
        totalExpenses += tx.amount;
        expenseCount++;
      }
    }

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

  render() {
    const metrics = this.calculateMetrics();

    this.dom.totalIncome.textContent = this.formatCurrency(metrics.totalIncome);
    this.dom.incomeCount.textContent = metrics.incomeCount;

    this.dom.totalExpenses.textContent = this.formatCurrency(metrics.totalExpenses);
    this.dom.expenseCount.textContent = metrics.expenseCount;

    this.dom.netBalance.textContent = this.formatCurrency(metrics.netBalance);
    
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
    this.renderCharts(metrics);
    this.renderBudgets();
    this.renderGoals();
  }

  // --- CHART.JS VISUAL ANALYTICS ENGINE ---
  renderCharts(metrics) {
    if (typeof Chart === 'undefined') return;

    // 1. Donut Chart: Expenses by Category
    const categoryTotals = {};
    this.transactions.forEach(tx => {
      if (tx.type !== 'income') {
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
      }
    });

    const categories = Object.keys(categoryTotals);
    const categoryAmounts = Object.values(categoryTotals);

    const donutCtx = document.getElementById('expenseChartCanvas');
    if (donutCtx) {
      if (this.charts.expenseChart) this.charts.expenseChart.destroy();

      this.charts.expenseChart = new Chart(donutCtx, {
        type: 'doughnut',
        data: {
          labels: categories.length ? categories : ['Sin Gastos'],
          datasets: [{
            data: categoryAmounts.length ? categoryAmounts : [1],
            backgroundColor: [
              '#F43F5E', '#6366F1', '#F59E0B', '#10B981',
              '#8B5CF6', '#EC4899', '#3B82F6', '#14B8A6'
            ],
            borderWidth: 2,
            borderColor: '#121828'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#94A3B8', font: { family: 'Plus Jakarta Sans', size: 11 } }
            }
          }
        }
      });
    }

    // 2. Bar Chart: Income vs Expenses Balance
    const barCtx = document.getElementById('barChartCanvas');
    if (barCtx) {
      if (this.charts.barChart) this.charts.barChart.destroy();

      this.charts.barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: ['Ingresos', 'Gastos / Deudas'],
          datasets: [{
            label: 'Monto Total',
            data: [metrics.totalIncome, metrics.totalExpenses],
            backgroundColor: ['#10B981', '#F43F5E'],
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { ticks: { color: '#94A3B8' }, grid: { display: false } },
            y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
    }
  }

  // --- CATEGORY BUDGETS ---
  promptSetBudget() {
    const category = prompt('Ingresa la categoría a presupuestar (ej. Vivienda, Alimentacion, Servicios):');
    if (!category) return;

    const limit = parseFloat(prompt(`Límite mensual para "${category}":`));
    if (isNaN(limit) || limit <= 0) {
      alert('Monto no válido.');
      return;
    }

    this.budgets[category] = limit;
    this.saveData();
    this.render();
  }

  renderBudgets() {
    const container = this.dom.budgetsList;
    if (!container) return;

    const categorySpent = {};
    this.transactions.forEach(tx => {
      if (tx.type !== 'income') {
        categorySpent[tx.category] = (categorySpent[tx.category] || 0) + tx.amount;
      }
    });

    const entries = Object.entries(this.budgets);

    if (entries.length === 0) {
      container.innerHTML = '<p class="text-muted" style="font-size:0.85rem">No has fijado ningún límite de presupuesto.</p>';
      return;
    }

    container.innerHTML = entries.map(([cat, limit]) => {
      const spent = categorySpent[cat] || 0;
      const pct = Math.min(100, Math.round((spent / limit) * 100));
      let statusClass = 'normal';
      if (pct >= 90) statusClass = 'danger';
      else if (pct >= 70) statusClass = 'warning';

      return `
        <div class="budget-item">
          <div class="budget-info">
            <span>${this.escapeHtml(cat)}</span>
            <span>${this.formatCurrency(spent)} / ${this.formatCurrency(limit)} (${pct}%)</span>
          </div>
          <div class="budget-bar">
            <div class="budget-fill ${statusClass}" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- SAVINGS GOALS ---
  promptAddGoal() {
    const title = prompt('Nombre de la Meta (ej. Fondo de Emergencia):');
    if (!title) return;

    const target = parseFloat(prompt('Monto Meta Total:'));
    if (isNaN(target) || target <= 0) {
      alert('Monto no válido.');
      return;
    }

    this.goals.push({
      id: 'goal-' + Date.now(),
      title,
      target,
      current: 0
    });

    this.saveData();
    this.render();
  }

  promptContributeGoal(id) {
    const goal = this.goals.find(g => g.id === id);
    if (!goal) return;

    const amount = parseFloat(prompt(`Abonar a "${goal.title}":`));
    if (isNaN(amount) || amount <= 0) return;

    goal.current += amount;
    this.saveData();
    this.render();
  }

  renderGoals() {
    const container = this.dom.goalsList;
    if (!container) return;

    if (this.goals.length === 0) {
      container.innerHTML = '<p class="text-muted" style="font-size:0.85rem">No tienes metas de ahorro activas.</p>';
      return;
    }

    container.innerHTML = this.goals.map(goal => {
      const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));

      return `
        <div class="goal-item">
          <div class="goal-info">
            <span>${this.escapeHtml(goal.title)}</span>
            <span>${this.formatCurrency(goal.current)} / ${this.formatCurrency(goal.target)} (${pct}%)</span>
          </div>
          <div class="goal-bar">
            <div class="goal-fill" style="width: ${pct}%"></div>
          </div>
          <div class="goal-actions">
            <button type="button" class="btn btn-secondary btn-sm btn-contribute" data-id="${goal.id}">
              <i class="fa-solid fa-plus-circle"></i> Abonar
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- DEBT AMORTIZATION CALCULATOR ---
  computeDebtPayoff() {
    const amount = parseFloat(this.dom.calcAmount.value);
    const rate = parseFloat(this.dom.calcRate.value) / 100 / 12;
    const payment = parseFloat(this.dom.calcPayment.value);

    if (isNaN(amount) || isNaN(rate) || isNaN(payment) || amount <= 0 || payment <= 0) {
      this.dom.calcMonthsResult.textContent = '-- meses';
      this.dom.calcInterestResult.textContent = '$ --';
      return;
    }

    const minPaymentNeeded = amount * rate;
    if (payment <= minPaymentNeeded) {
      this.dom.calcMonthsResult.textContent = 'Pago insuficiente';
      this.dom.calcInterestResult.textContent = 'Deuda infinita';
      return;
    }

    let months = 0;
    let balance = amount;
    let totalInterest = 0;

    while (balance > 0 && months < 360) {
      const interestMonth = balance * rate;
      totalInterest += interestMonth;
      balance = balance + interestMonth - payment;
      months++;
    }

    this.dom.calcMonthsResult.textContent = `${months} meses`;
    this.dom.calcInterestResult.textContent = this.formatCurrency(totalInterest);
  }

  renderTransactions() {
    const container = this.dom.transactionsList;
    if (!container) return;

    const query = this.searchQuery;
    const filter = this.activeFilter;

    const filtered = this.transactions.filter(tx => {
      let matchesFilter = true;
      if (filter === 'income') matchesFilter = tx.type === 'income';
      else if (filter === 'expense') matchesFilter = tx.type === 'expense';
      else if (filter === 'debt') matchesFilter = tx.type === 'debt';
      else if (filter === 'fixed') matchesFilter = tx.frequency === 'Fijo';

      let matchesSearch = true;
      if (query) {
        matchesSearch = tx.description.toLowerCase().includes(query) ||
                        tx.category.toLowerCase().includes(query);
      }

      return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-folder-open" aria-hidden="true"></i>
          <p>No se encontraron movimientos registrados con los filtros actuales.</p>
        </div>
      `;
      return;
    }

    const htmlBuffer = filtered.map(tx => {
      const iconClass = CATEGORY_ICONS[tx.category] || 'fa-receipt';
      const typeSign = tx.type === 'income' ? '+' : '-';
      const formattedAmount = this.formatCurrency(tx.amount);

      return `
        <div class="tx-item tx-${tx.type}">
          <div class="tx-left">
            <div class="tx-icon" aria-hidden="true">
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
            <span class="tx-amount">${typeSign} ${formattedAmount}</span>
            <button type="button" class="btn-delete" data-id="${tx.id}" title="Eliminar registro" aria-label="Eliminar ${this.escapeHtml(tx.description)}">
              <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = htmlBuffer;
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Export CSV with UTF-8 BOM for Excel
  exportCSV() {
    const headers = ['ID', 'Tipo', 'Concepto', 'Monto', 'Moneda', 'Categoria', 'Frecuencia', 'Fecha'];
    const rows = this.transactions.map(tx => [
      tx.id,
      tx.type,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.amount,
      this.currentCurrency,
      `"${tx.category.replace(/"/g, '""')}"`,
      tx.frequency,
      tx.date
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Finanzas_Tommy_2026_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  exportBackup() {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      currency: this.currentCurrency,
      transactions: this.transactions,
      budgets: this.budgets,
      goals: this.goals
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = `Finanzas_Tommy_2026_Respaldo_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

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
          if (imported.budgets) this.budgets = imported.budgets;
          if (imported.goals) this.goals = imported.goals;
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

    e.target.value = '';
  }

  clearAllData() {
    if (confirm('⚠️ ¡ATENCIÓN! ¿Quieres borrar TODOS los datos de Finanzas Tommy 2026? Esta acción no se puede deshacer.')) {
      this.transactions = [];
      this.budgets = {};
      this.goals = [];
      this.saveData();
      this.render();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.financeApp = new FinanceApp();
});
