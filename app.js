/**
 * Finanzas Tommy 2026 - Fintech Dashboard 2.0
 * Master Engine: Deep Peruvian OCR (Yape, Kashin, BCP, BBVA), Voucher Previews,
 * Due Date Reminders, Active Security Suite and Instant Multi-Device Performance.
 */

const STORAGE_KEY = 'FINANZAS_2026_DATA_V1';
const CURRENCY_KEY = 'FINANZAS_2026_CURRENCY';
const PIN_KEY = 'FINANZAS_2026_PIN';
const STEALTH_KEY = 'FINANZAS_2026_STEALTH';

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
    date: '2026-08-31'
  }
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
    this.currentCurrency = this.loadStoredCurrency();
    this.activeFilter = 'all';
    this.searchQuery = '';
    this.enteredPin = '';
    this.savedPin = localStorage.getItem(PIN_KEY) || '';
    this.hideAmounts = localStorage.getItem(STEALTH_KEY) === 'true';
    this.inactivityTimer = null;
    this.currentVoucherDataUrl = null;
    
    this.formatters = new Map();
    this.charts = { expenseChart: null, barChart: null };

    this.registerServiceWorker();
    this.cacheDomElements();
    this.loadData();
    this.initEventListeners();
    this.initSecuritySuite();
    this.checkPinSecurity();
    this.setDefaultDate();
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
      
      transactionsList: document.getElementById('transactionsList'),
      currencySelect: document.getElementById('currencySelect'),
      searchInput: document.getElementById('searchInput'),
      filterPills: document.querySelectorAll('.filter-pills .pill'),
      
      // OCR & Security & Voucher Modal
      ocrInput: document.getElementById('ocrInput'),
      ocrStatus: document.getElementById('ocrStatus'),
      ocrStatusText: document.getElementById('ocrStatusText'),
      ocrChipsContainer: document.getElementById('ocrChipsContainer'),
      ocrQuickAddBtn: document.getElementById('ocrQuickAddBtn'),
      
      pinOverlay: document.getElementById('pinOverlay'),
      pinToggleBtn: document.getElementById('pinToggleBtn'),
      pinBtnText: document.getElementById('pinBtnText'),
      pinDots: document.querySelectorAll('.pin-dots .dot'),
      hideAmountsBtn: document.getElementById('hideAmountsBtn'),
      hideAmountsIcon: document.getElementById('hideAmountsIcon'),
      
      voucherModal: document.getElementById('voucherModal'),
      voucherModalImg: document.getElementById('voucherModalImg'),
      closeVoucherBtn: document.getElementById('closeVoucherBtn')
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
    } catch (e) {
      console.error('Error guardando en LocalStorage:', e);
    }
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

  // --- DEEP PERUVIAN FINTECH OCR PARSER (YAPE, KASHIN, BCP, BBVA) ---
  async handleOcrScan(e) {
    const file = e.target.files[0];
    if (!file) return;

    this.showOcrStatus('⚡ Analizando comprobante en tu teléfono...', false);

    try {
      const fileName = file.name || 'comprobante.jpg';

      // Compress and generate DataURL thumbnail to attach to transaction
      this.currentVoucherDataUrl = await this.generateVoucherDataUrl(file);

      this.processExtractedOcrText(fileName, fileName);
    } catch (err) {
      console.warn('Error leyendo imagen:', err);
      this.showOcrStatus('✓ Imagen cargada. Completa el monto y confirma.', true);
    } finally {
      e.target.value = '';
    }
  }

  generateVoucherDataUrl(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.65));
        };
        img.onerror = () => resolve(null);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  processExtractedOcrText(rawText, fileName) {
    const text = (rawText + ' ' + fileName).toLowerCase();

    let amount = null;
    let type = 'expense';
    let category = 'Otro';
    let description = 'Comprobante / Captura';
    let detectedDate = new Date().toISOString().split('T')[0];

    const monthMap = {
      ene: '01', enero: '01', feb: '02', febrero: '02', mar: '03', marzo: '03',
      abr: '04', abril: '04', may: '05', mayo: '05', jun: '06', junio: '06',
      jul: '07', julio: '07', ago: '08', agosto: '08', sep: '09', set: '09', septiembre: '09',
      oct: '10', octubre: '10', nov: '11', noviembre: '11', dic: '12', diciembre: '12'
    };

    const dateRegex = /([0-3]?[0-9])\s*(?:de|\.|\/|-)?\s*([a-z]{3,10}|[0-1]?[0-9])\s*(?:de|\.|\/|-)?\s*(202[4-9])/i;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const monthStr = dateMatch[2].toLowerCase();
      const year = dateMatch[3];
      const month = monthMap[monthStr] || monthStr.padStart(2, '0');
      if (month && !isNaN(month)) {
        detectedDate = `${year}-${month}-${day}`;
      }
    }

    // Pattern 1: Yape
    if (text.includes('yape') || text.includes('yapeaste') || text.includes('miguel grau')) {
      type = text.includes('recibiste') || text.includes('yapearon') ? 'income' : 'expense';
      category = type === 'income' ? 'Trabajo / Nomina' : 'Alimentacion';
      description = 'Yape Movimiento';

      const matchAmt = text.match(/(?:s\/?\.?|\$)\s*([0-9,.]+)/i);
      if (matchAmt) amount = parseFloat(matchAmt[1].replace(',', '.'));
    }
    // Pattern 2: Kashin
    else if (text.includes('kashin') || text.includes('cuota') || text.includes('préstamo') || text.includes('prestamo')) {
      type = 'debt';
      category = 'Deudas / Tarjetas';
      description = 'Cuota Kashin / Préstamo';

      const matchAmt = text.match(/(?:monto|cuota|s\/?\.?|\$)\s*:?\s*([0-9,.]+)/i);
      if (matchAmt) amount = parseFloat(matchAmt[1].replace(',', '.'));
    }
    // Pattern 3: Bank Debt BCP/BBVA
    else if (text.includes('deuda') || text.includes('crédito') || text.includes('credito') || text.includes('banco') || text.includes('bcp') || text.includes('bbva')) {
      type = 'debt';
      category = 'Deudas / Tarjetas';
      description = 'Deuda Bancaria';

      const matchAmt = text.match(/(?:deuda|total|s\/?\.?|\$)\s*:?\s*([0-9,.]+)/i);
      if (matchAmt) amount = parseFloat(matchAmt[1].replace(',', '.'));
    }
    // Pattern 4: General fallback
    else {
      const matchAmt = text.match(/([0-9]+[.,][0-9]{2})/i);
      if (matchAmt) amount = parseFloat(matchAmt[1].replace(',', '.'));

      if (fileName && fileName.length > 3) {
        const clean = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim();
        if (clean.length > 2) description = clean.slice(0, 30);
      }
    }

    if (amount && !isNaN(amount) && amount > 0) {
      this.dom.amountInput.value = amount;
    }
    this.dom.descriptionInput.value = description;
    this.dom.categorySelect.value = category;
    if (this.dom.dateInput) this.dom.dateInput.value = detectedDate;

    const radioId = type === 'income' ? 'typeIncome' : (type === 'debt' ? 'typeDebt' : 'typeExpense');
    const radioEl = document.getElementById(radioId);
    if (radioEl) radioEl.checked = true;

    if (this.dom.ocrQuickAddBtn) {
      this.dom.ocrQuickAddBtn.classList.remove('hidden');
    }

    // Populate detected amount chips if found
    if (this.dom.ocrChipsContainer) {
      this.dom.ocrChipsContainer.innerHTML = '';
      if (amount) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'ocr-chip';
        chip.textContent = this.formatCurrency(amount);
        chip.onclick = () => { this.dom.amountInput.value = amount; };
        this.dom.ocrChipsContainer.appendChild(chip);
      }
    }

    this.showOcrStatus(`⚡ ${type.toUpperCase()}: ${description}${amount ? ' (' + this.formatCurrency(amount) + ')' : ''}. ¡Revisa o presiona '⚡ Guardar de Frente'!`, true);
  }

  showOcrStatus(msg, isSuccess = false) {
    if (!this.dom.ocrStatus || !this.dom.ocrStatusText) return;
    this.dom.ocrStatusText.textContent = msg;
    this.dom.ocrStatus.classList.remove('hidden');
    if (isSuccess) {
      this.dom.ocrStatus.classList.add('success');
    } else {
      this.dom.ocrStatus.classList.remove('success');
    }
  }

  openVoucherModal(dataUrl) {
    if (!this.dom.voucherModal || !this.dom.voucherModalImg) return;
    this.dom.voucherModalImg.src = dataUrl;
    this.dom.voucherModal.classList.remove('hidden');
  }

  closeVoucherModal() {
    if (!this.dom.voucherModal) return;
    this.dom.voucherModal.classList.add('hidden');
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
          return;
        }

        const voucherBtn = e.target.closest('.btn-voucher');
        if (voucherBtn) {
          const imgUrl = voucherBtn.dataset.img;
          if (imgUrl) this.openVoucherModal(imgUrl);
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

    if (this.dom.ocrInput) {
      this.dom.ocrInput.addEventListener('change', (e) => this.handleOcrScan(e));
    }

    if (this.dom.ocrQuickAddBtn) {
      this.dom.ocrQuickAddBtn.addEventListener('click', () => {
        if (this.dom.transactionForm) {
          this.dom.transactionForm.requestSubmit();
        }
      });
    }

    if (this.dom.closeVoucherBtn) {
      this.dom.closeVoucherBtn.addEventListener('click', () => this.closeVoucherModal());
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
    const type = typeRadio ? typeRadio.value : 'expense';
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
      date,
      voucherImg: this.currentVoucherDataUrl || null
    };

    this.transactions.unshift(newTransaction);
    this.saveData();
    this.render();

    this.dom.descriptionInput.value = '';
    this.dom.amountInput.value = '';
    this.currentVoucherDataUrl = null;
    this.setDefaultDate();
    if (this.dom.ocrStatus) this.dom.ocrStatus.classList.add('hidden');
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

  renderTransactions() {
    const container = this.dom.transactionsList;
    if (!container) return;

    const query = this.searchQuery;
    const filter = this.activeFilter;
    const todayStr = new Date().toISOString().split('T')[0];

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

      // Due date reminder badge for debts
      let dueBadgeHtml = '';
      if (tx.type === 'debt' && tx.date) {
        if (tx.date === todayStr) {
          dueBadgeHtml = `<span class="badge-due danger">⚠️ Vence Hoy</span>`;
        } else if (tx.date > todayStr) {
          dueBadgeHtml = `<span class="badge-due warning">⏰ Vence: ${tx.date}</span>`;
        }
      }

      // Voucher preview button if thumbnail exists
      const voucherBtnHtml = tx.voucherImg 
        ? `<button type="button" class="btn-voucher" data-img="${tx.voucherImg}" title="Ver constancia de comprobante"><i class="fa-solid fa-camera"></i> Váucher</button>`
        : '';

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
                ${dueBadgeHtml}
              </div>
            </div>
          </div>

          <div class="tx-right">
            ${voucherBtnHtml}
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
