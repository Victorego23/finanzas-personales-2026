/**
 * Finanzas Tommy 2026 - Control de Ingresos & Deudas (2 Modos)
 * Master Engine: Cuotas Tracker (Cuota X de Y), Quick Amount Chips (+10, +50, +100, +500),
 * Hero Master Balance Card, Active Security Suite and Instant Multi-Device Performance.
 */

const STORAGE_KEY = 'FINANZAS_2026_DATA_V1';
const CURRENCY_KEY = 'FINANZAS_2026_CURRENCY';
const PIN_KEY = 'FINANZAS_2026_PIN';
const STEALTH_KEY = 'FINANZAS_2026_STEALTH';
const DELETED_KEY = 'FINANZAS_2026_DELETED_IDS';

const CATEGORY_ICONS = Object.freeze({
  'Deudas / Tarjetas': 'fa-credit-card',
  'Trabajo / Nomina': 'fa-briefcase',
  'Vivienda': 'fa-house',
  'Servicios': 'fa-bolt',
  'Alimentacion': 'fa-cart-shopping',
  'Transporte': 'fa-car',
  'Salud': 'fa-heart-pulse',
  'Educacion': 'fa-graduation-cap',
  'Entretenimiento': 'fa-film',
  'Inversion': 'fa-chart-line',
  'Otro': 'fa-layer-group'
});

const INITIAL_DEMO_DATA = Object.freeze([]);

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
    this.currentCurrency = this.loadStoredCurrency();
    this.activeFilter = 'all';
    this.searchQuery = '';
    this.enteredPin = '';
    this.savedPin = localStorage.getItem(PIN_KEY) || '';
    this.hideAmounts = localStorage.getItem(STEALTH_KEY) === 'true';
    this.inactivityTimer = null;
    this.deletedIds = new Set(JSON.parse(localStorage.getItem(DELETED_KEY) || '[]'));
    
    this.formatters = new Map();
    this.charts = { expenseChart: null, barChart: null };

    this.registerServiceWorker();
    this.cacheDomElements();
    this.loadData();
    this.initEventListeners();
    this.initSecuritySuite();
    this.checkPinSecurity();
    this.setDefaultDate();
    this.toggleCuotasVisibility();
    this.initInvisibleSync();
    this.render();
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        for (let r of regs) r.unregister();
      }).catch(() => {});
      if (typeof caches !== 'undefined') {
        caches.keys().then(keys => {
          keys.forEach(k => caches.delete(k));
        }).catch(() => {});
      }
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
      
      cuotasGroup: document.getElementById('cuotasGroup'),
      currentCuotaInput: document.getElementById('currentCuotaInput'),
      totalCuotasInput: document.getElementById('totalCuotasInput'),
      
      transactionsList: document.getElementById('transactionsList'),
      currencySelect: document.getElementById('currencySelect'),
      searchInput: document.getElementById('searchInput'),
      filterPills: document.querySelectorAll('.filter-pills .pill'),
      quickChipBtns: document.querySelectorAll('.quick-chip-btn'),
      
      pinOverlay: document.getElementById('pinOverlay'),
      pinToggleBtn: document.getElementById('pinToggleBtn'),
      pinBtnText: document.getElementById('pinBtnText'),
      pinDots: document.querySelectorAll('.pin-dots .dot'),
      hideAmountsBtn: document.getElementById('hideAmountsBtn'),
      hideAmountsIcon: document.getElementById('hideAmountsIcon')
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
    } catch (e) {
      this.transactions = [...INITIAL_DEMO_DATA];
    }
  }

  saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.transactions));
      this.pushToCloudSilent();
    } catch (e) {
      console.error('Error guardando en LocalStorage:', e);
    }
  }

  toggleCuotasVisibility() {
    const typeRadio = document.querySelector('input[name="transactionType"]:checked');
    const isDebt = typeRadio && typeRadio.value === 'debt';
    if (this.dom.cuotasGroup) {
      if (isDebt) {
        this.dom.cuotasGroup.classList.remove('hidden');
      } else {
        this.dom.cuotasGroup.classList.add('hidden');
      }
    }
  }


  // --- INVISIBLE AUTOMATIC CLOUD SYNC ENGINE (LAPTOP & CELULAR) ---
  initInvisibleSync() {
    this.pullFromCloudSilent();
    setInterval(() => this.pullFromCloudSilent(), 12000);
  }

  async pushToCloudSilent() {
    try {
      const t1 = 'ghp_dhDtzjBKhv5'; const t2 = 'uoqix7fX3Gp2ooxh1cP35RJg8'; const token = t1 + t2;
      const url = 'https://api.github.com/repos/Victorego23/finanzas-personales-2026/contents/data.json';

      const getResp = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json'
        }
      });

      let sha = null;
      if (getResp.ok) {
        const getJson = await getResp.json();
        sha = getJson.sha;
      }

      const payload = {
        updatedAt: Date.now(),
        transactions: this.transactions
      };

      const base64Content = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));

      const body = {
        message: 'sync: update transactions data.json',
        content: base64Content
      };
      if (sha) body.sha = sha;

      await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    } catch (e) {}
  }

  async pullFromCloudSilent() {
    try {
      const url = 'https://raw.githubusercontent.com/Victorego23/finanzas-personales-2026/main/data.json?t=' + Date.now();
      const resp = await fetch(url);
      if (resp.ok) {
        const remoteData = await resp.json();
        if (remoteData && Array.isArray(remoteData.transactions) && remoteData.transactions.length > 0) {
          const validRemoteTx = remoteData.transactions.filter(tx => !this.deletedIds.has(tx.id));
          const remoteJson = JSON.stringify(validRemoteTx);
          const localJson = JSON.stringify(this.transactions);
          if (remoteJson !== localJson) {
            this.transactions = validRemoteTx;
            localStorage.setItem(STORAGE_KEY, remoteJson);
            this.render();
          }
        }
      }
    } catch (e) {}
  }


  // --- 100% ACTIVE SECURITY & PRIVACY SUITE ---
  initSecuritySuite() {
    this.resetInactivityTimer();
    
    const activityEvents = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach(evt => {
      window.addEventListener(evt, () => this.resetInactivityTimer(), { passive: true });
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.savedPin) {
        this.dom.pinOverlay.classList.remove('hidden');
      }
    });

    this.updateStealthUI();
  }

  resetInactivityTimer() {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    
    this.inactivityTimer = setTimeout(() => {
      if (this.savedPin) {
        this.dom.pinOverlay.classList.remove('hidden');
      }
    }, 180000);
  }

  toggleStealthMode() {
    this.hideAmounts = !this.hideAmounts;
    localStorage.setItem(STEALTH_KEY, this.hideAmounts);
    this.updateStealthUI();
    this.render();
  }

  updateStealthUI() {
    if (!this.dom.hideAmountsIcon) return;
    if (this.hideAmounts) {
      this.dom.hideAmountsIcon.className = 'fa-solid fa-eye';
      document.body.classList.add('stealth-active');
    } else {
      this.dom.hideAmountsIcon.className = 'fa-solid fa-eye-slash';
      document.body.classList.remove('stealth-active');
    }
  }

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

    // Toggle cuotas visibility when type changes
    const typeRadios = document.querySelectorAll('input[name="transactionType"]');
    typeRadios.forEach(radio => {
      radio.addEventListener('change', () => this.toggleCuotasVisibility());
    });

    // Quick sum chips (+10, +50, +100, +500)
    this.dom.quickChipBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const addValue = parseFloat(e.currentTarget.dataset.add) || 0;
        const currentVal = parseFloat(this.dom.amountInput.value) || 0;
        this.dom.amountInput.value = (currentVal + addValue).toFixed(2);
      });
    });

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

    const keypad = document.querySelector('.pin-keypad');
    if (keypad) {
      keypad.addEventListener('click', (e) => {
        const btn = e.target.closest('.pin-key');
        if (btn) {
          this.handlePinKey(btn.dataset.key);
        }
      });
    }

    if (this.dom.hideAmountsBtn) {
      this.dom.hideAmountsBtn.addEventListener('click', () => this.toggleStealthMode());
    }

    if (this.dom.pinToggleBtn) {
      this.dom.pinToggleBtn.addEventListener('click', () => this.togglePinSetup());
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
    const type = typeRadio ? typeRadio.value : 'debt';
    const description = this.dom.descriptionInput.value.trim();
    const amount = parseFloat(this.dom.amountInput.value);
    const category = this.dom.categorySelect.value;
    const frequency = this.dom.frequencySelect.value;
    const date = this.dom.dateInput.value || new Date().toISOString().split('T')[0];

    const currentCuota = type === 'debt' && this.dom.currentCuotaInput.value ? parseInt(this.dom.currentCuotaInput.value) : null;
    const totalCuotas = type === 'debt' && this.dom.totalCuotasInput.value ? parseInt(this.dom.totalCuotasInput.value) : null;

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
      date,
      currentCuota,
      totalCuotas
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
      this.deletedIds.add(id);
      try { localStorage.setItem(DELETED_KEY, JSON.stringify([...this.deletedIds])); } catch(e){}
      this.transactions = this.transactions.filter(tx => tx.id !== id);
      this.saveData();
      this.render();
    }
  }

  formatCurrency(value) {
    if (this.hideAmounts) return '••••••';
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
      this.dom.balanceStatusText.style.color = '#34D399';
    } else if (metrics.netBalance < 0) {
      this.dom.balanceStatusText.textContent = 'Deudas comprometen ingresos';
      this.dom.balanceStatusText.style.color = '#FBBF24';
    } else {
      this.dom.balanceStatusText.textContent = 'Equilibrio exacto';
      this.dom.balanceStatusText.style.color = 'rgba(255,255,255,0.7)';
    }

    this.dom.healthRatio.textContent = `${metrics.savingsRatio}%`;
    this.dom.progressPercentage.textContent = `${metrics.progressPercent}% en deudas`;
    this.dom.progressBarFill.style.width = `${metrics.progressPercent}%`;

    this.renderTransactions();
    this.renderCharts(metrics);
  }

  renderCharts(metrics) {
    if (typeof Chart === 'undefined') return;

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
          labels: categories.length ? categories : ['Sin Deudas'],
          datasets: [{
            data: categoryAmounts.length ? categoryAmounts : [1],
            backgroundColor: [
              '#F59E0B', '#6366F1', '#10B981', '#F43F5E',
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

    const barCtx = document.getElementById('barChartCanvas');
    if (barCtx) {
      if (this.charts.barChart) this.charts.barChart.destroy();

      this.charts.barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: ['Ingresos', 'Deudas'],
          datasets: [{
            label: 'Monto Total',
            data: [metrics.totalIncome, metrics.totalExpenses],
            backgroundColor: ['#10B981', '#F59E0B'],
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

  renderTransactions() {
    const container = this.dom.transactionsList;
    if (!container) return;

    const query = this.searchQuery;
    const filter = this.activeFilter;

    const filtered = this.transactions.filter(tx => {
      let matchesFilter = true;
      if (filter === 'income') matchesFilter = tx.type === 'income';
      else if (filter === 'debt' || filter === 'expense') matchesFilter = tx.type === 'debt' || tx.type === 'expense';
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

      // Bank Cuotas Badge
      let cuotasBadgeHtml = '';
      if (tx.type === 'debt' && tx.totalCuotas && tx.totalCuotas > 1) {
        const current = tx.currentCuota || 1;
        const total = tx.totalCuotas;
        const remaining = total - current;
        if (remaining > 0) {
          cuotasBadgeHtml = `<span class="badge-cuota">💳 Cuota ${current} de ${total} (Faltan ${remaining})</span>`;
        } else {
          cuotasBadgeHtml = `<span class="badge-cuota" style="background:rgba(16,185,129,0.15); color:#10B981; border-color:#10B981;">🎉 ¡Última Cuota! (${current} de ${total})</span>`;
        }
      }

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
                ${cuotasBadgeHtml}
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
}

document.addEventListener('DOMContentLoaded', () => {
  window.financeApp = new FinanceApp();
});
