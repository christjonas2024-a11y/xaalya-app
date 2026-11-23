// xaalyaRates.js - Taux de change, régression prédictive RPW journalière et valeur nette estimée
const XAALYA_FALLBACK_RATES = {
  EUR: 1,
  XOF: 655.957,
  XAF: 655.957,
  NGN: 1700,
  GHS: 16.5,
  KES: 140,
  MAD: 10.8,
  GBP: 0.84,
  USD: 1.08,
  CAD: 1.5,
  TND: 3.35
};

const XAALYA_DEFAULT_CORRIDORS = {
  'EUR->XOF': {
    fixedFeeSource: 2.5,
    feeCiLowSource: 2.0,
    feeCiHighSource: 3.0,
    volatilityFactor: 0.85,
    model: 'Chow-Lin + rolling window (RPW + FX arrimé)'
  },
  'EUR->XAF': {
    fixedFeeSource: 2.6,
    feeCiLowSource: 2.1,
    feeCiHighSource: 3.1,
    volatilityFactor: 0.85,
    model: 'Chow-Lin + rolling window (RPW + FX arrimé)'
  },
  'EUR->NGN': {
    fixedFeeSource: 4.2,
    feeCiLowSource: 3.1,
    feeCiHighSource: 5.5,
    volatilityFactor: 1.2,
    model: 'Chow-Lin + rolling window (RPW + FX volatil)'
  },
  'USD->NGN': {
    fixedFeeSource: 3.9,
    feeCiLowSource: 2.9,
    feeCiHighSource: 5.1,
    volatilityFactor: 1.15,
    model: 'Chow-Lin + rolling window (RPW + FX volatil)'
  },
  'GBP->NGN': {
    fixedFeeSource: 4.5,
    feeCiLowSource: 3.3,
    feeCiHighSource: 5.9,
    volatilityFactor: 1.25,
    model: 'Chow-Lin + rolling window (RPW + FX volatil)'
  }
};

window.xaalyaRatesData = {
  base: 'EUR',
  updatedAt: null,
  rates: { ...XAALYA_FALLBACK_RATES },
  corridors: { ...XAALYA_DEFAULT_CORRIDORS },
  lastForecast: null
};
let xaalyaRatesData = window.xaalyaRatesData;

function normalizeCurrencyCode(code, fallback = 'EUR') {
  if (!code) return fallback;
  const clean = code.toString().trim().toUpperCase();

  const map = {
    FR: 'EUR',
    FRANCE: 'EUR',
    DE: 'EUR',
    ALLEMAGNE: 'EUR',
    IT: 'EUR',
    ITALIE: 'EUR',
    ES: 'EUR',
    ESPAGNE: 'EUR',
    BE: 'EUR',
    BELGIQUE: 'EUR',
    CA: 'CAD',
    CANADA: 'CAD',
    US: 'USD',
    USA: 'USD',
    'ETATS-UNIS': 'USD',
    'ÉTATS-UNIS': 'USD',
    GB: 'GBP',
    UK: 'GBP',
    'ROYAUME-UNI': 'GBP',
    SN: 'XOF',
    CI: 'XOF',
    ML: 'XOF',
    BF: 'XOF',
    BJ: 'XOF',
    TG: 'XOF',
    NE: 'XOF',
    CM: 'XAF',
    GA: 'XAF',
    CG: 'XAF',
    TD: 'XAF',
    CF: 'XAF',
    GQ: 'XAF',
    NG: 'NGN',
    GH: 'GHS',
    KE: 'KES',
    MA: 'MAD',
    TN: 'TND'
  };

  if (map[clean]) return map[clean];

  const isoMatch = clean.match(/\b(EUR|USD|GBP|CAD|XOF|XAF|NGN|GHS|KES|MAD|ZAR|TND)\b/);
  if (isoMatch) return isoMatch[1];

  const anyIso = clean.match(/\b([A-Z]{3})\b/);
  return anyIso ? anyIso[1] : fallback;
}

async function initXaalyaRates() {
  const cadenceLabel = 'Frais : quotidiens · Taux : toutes les 4–6 h';
  const updateEls = [
    document.getElementById('ref-cadence-info'),
    document.getElementById('last-update-time'),
    document.getElementById('ref-last-update')
  ].filter(Boolean);

  updateEls.forEach((el) => {
    el.textContent = cadenceLabel;
  });

  updateSimulation();

  try {
    const response = await fetch('rates.json?t=' + Date.now(), { cache: 'no-store' });
    if (!response.ok) throw new Error('HTTP ' + response.status);

    const data = await response.json();
    window.xaalyaRatesData = {
      ...window.xaalyaRatesData,
      base: data.base || 'EUR',
      updatedAt: data.updatedAt || null,
      rates: {
        ...XAALYA_FALLBACK_RATES,
        ...(data.rates || {})
      },
      corridors: {
        ...XAALYA_DEFAULT_CORRIDORS,
        ...(data.corridors || {})
      }
    };
    xaalyaRatesData = window.xaalyaRatesData;

    updateEls.forEach((el) => {
      el.textContent = cadenceLabel;
    });
  } catch (e) {
    console.warn('Repli sur les taux et corridors intégrés :', e);
    window.xaalyaRatesData.rates = {
      ...XAALYA_FALLBACK_RATES,
      ...(window.xaalyaRatesData.rates || {})
    };
    window.xaalyaRatesData.corridors = {
      ...XAALYA_DEFAULT_CORRIDORS,
      ...(window.xaalyaRatesData.corridors || {})
    };
    xaalyaRatesData = window.xaalyaRatesData;
    updateEls.forEach((el) => {
      el.textContent = cadenceLabel;
    });
  }

  updateSimulation();
}

function getCrossRate(fromCurr, toCurr) {
  if (fromCurr === toCurr) return 1;
  const rates = (window.xaalyaRatesData && window.xaalyaRatesData.rates) || {};
  const base = (window.xaalyaRatesData && window.xaalyaRatesData.base) || 'EUR';

  const fromInBase = fromCurr === base ? 1 : rates[fromCurr];
  const toInBase = toCurr === base ? 1 : rates[toCurr];

  if (!fromInBase || !toInBase) return null;
  return toInBase / fromInBase;
}

/**
 * Valeur nette estimée = (montant d'envoi - frais fixes) × Taux de change
 * Les bornes de la fourchette proviennent de l'intervalle de frais fixes prédit (RPW journalier).
 */
function computeEstimatedNetForecast(amount, rate, fromCurr, toCurr, ratesData) {
  const corridorKey = `${fromCurr}->${toCurr}`;
  const reverseKey = `${toCurr}->${fromCurr}`;
  const corridors = (ratesData && ratesData.corridors) || {};
  const cfg = corridors[corridorKey] || corridors[reverseKey] || null;

  const isCfaTarget = toCurr === 'XOF' || toCurr === 'XAF';
  const isPeggedPair =
    (fromCurr === 'EUR' && isCfaTarget) ||
    ((fromCurr === 'XOF' || fromCurr === 'XAF') && toCurr === 'EUR');

  const defaultFixedSource = isPeggedPair ? 2.5 : 4.0;
  const defaultHalfBandSource = isPeggedPair ? 0.5 : 1.25;

  const fixedFeeSource =
    cfg && typeof cfg.fixedFeeSource === 'number'
      ? cfg.fixedFeeSource
      : defaultFixedSource;

  const ciLowSource =
    cfg && typeof cfg.feeCiLowSource === 'number'
      ? cfg.feeCiLowSource
      : Math.max(0, fixedFeeSource - defaultHalfBandSource);

  const ciHighSource =
    cfg && typeof cfg.feeCiHighSource === 'number'
      ? cfg.feeCiHighSource
      : fixedFeeSource + defaultHalfBandSource;

  const volatilityFactor =
    cfg && typeof cfg.volatilityFactor === 'number' && cfg.volatilityFactor > 0
      ? cfg.volatilityFactor
      : isPeggedPair ? 0.85 : 1.15;

  const halfWidthSource = ((ciHighSource - ciLowSource) / 2) * volatilityFactor;
  const lowFeeSource = Math.max(0, fixedFeeSource - halfWidthSource);
  const highFeeSource = Math.max(lowFeeSource, fixedFeeSource + halfWidthSource);

  // Formule : (montant d'envoi - frais fixes) × Taux de change
  const netEstimated = Math.max(0, (amount - fixedFeeSource) * rate);
  // Frais fixes hauts => net plus bas ; frais fixes bas => net plus haut
  const netLow = Math.max(0, (amount - highFeeSource) * rate);
  const netHigh = Math.max(netLow, (amount - lowFeeSource) * rate);

  return {
    corridorKey,
    amount,
    rate,
    fixedFeeSource,
    lowFeeSource,
    highFeeSource,
    netEstimated,
    netLow,
    netHigh,
    model: (cfg && cfg.model) || 'Chow-Lin + rolling window (RPW + FX)'
  };
}

function findGrossTitleElement() {
  const byId =
    document.getElementById('ref-gross-title') ||
    document.getElementById('gross-value-title') ||
    document.getElementById('ref-gross-label');
  if (byId) return byId;

  return (
    Array.from(document.querySelectorAll('p, h2, h3, h4, span, div, label')).find((el) => {
      if (el.children.length > 0) return false;
      const txt = (el.textContent || '').trim();
      return (
        /Valeur brute convertie au taux interbancaire/i.test(txt) ||
        /^frais de transfert bruts\s*=/i.test(txt)
      );
    }) || null
  );
}

function updateSimulation() {
  const amountInput =
    document.querySelector('input[type="number"]') ||
    document.getElementById('sim-amount');

  const selects = Array.from(document.querySelectorAll('select'));
  const fromSelect =
    document.getElementById('from-currency') ||
    document.getElementById('sourceCurrency') ||
    selects[0] ||
    null;

  const toSelect =
    document.getElementById('to-currency') ||
    document.getElementById('targetCurrency') ||
    document.getElementById('sim-currency') ||
    selects[1] ||
    null;

  const corridorLabel = document.getElementById('ref-corridor-label');
  const grossTitleEl = findGrossTitleElement();
  const rateDisplay = document.getElementById('sim-rate-display');
  const netDisplay = document.getElementById('sim-net-display');
  const rangeWatermark = document.getElementById('sim-range-watermark');
  const pegNotice = document.getElementById('peg-notice');

  const rawAmount = amountInput ? String(amountInput.value).trim() : '';
  const parsedAmount = parseFloat(rawAmount);
  const amount = rawAmount === '' || isNaN(parsedAmount) ? 300 : parsedAmount;

  const fromCurr = normalizeCurrencyCode(fromSelect ? fromSelect.value : 'EUR', 'EUR');
  const toCurr = normalizeCurrencyCode(toSelect ? toSelect.value : 'XOF', 'XOF');

  const rate = getCrossRate(fromCurr, toCurr);
  const calc =
    rate !== null && rate !== undefined
      ? computeEstimatedNetForecast(amount, rate, fromCurr, toCurr, window.xaalyaRatesData)
      : null;

  window.xaalyaRatesData.lastForecast = calc;

  if (corridorLabel) {
    corridorLabel.textContent = `Corridor actif : ${fromCurr} → ${toCurr}`;
  }

  if (grossTitleEl && calc) {
    grossTitleEl.textContent = 'Valeur nette estimée :';
  }

  if (!calc) {
    if (rateDisplay) rateDisplay.textContent = `Indisponible (${fromCurr} → ${toCurr})`;
    if (netDisplay) netDisplay.textContent = '-';
    if (rangeWatermark) rangeWatermark.textContent = '';
  } else {
    const isZeroDec = toCurr === 'XOF' || toCurr === 'XAF';
    const fmtNum = (val) =>
      val.toLocaleString('fr-FR', {
        minimumFractionDigits: isZeroDec ? 0 : 2,
        maximumFractionDigits: isZeroDec ? 0 : 2
      });

    if (netDisplay) {
      netDisplay.textContent = `${fmtNum(calc.netEstimated)} ${toCurr}`;
    }

    if (rangeWatermark) {
      rangeWatermark.textContent = `[${fmtNum(calc.netLow)}${toCurr} – ${fmtNum(calc.netHigh)} ${toCurr}]`;
    }

    if (rateDisplay) {
      rateDisplay.textContent = `1 ${fromCurr} = ${rate.toFixed(4)} ${toCurr}`;
    }
  }

  if (pegNotice) {
    const isCfa = toCurr === 'XOF' || toCurr === 'XAF';
    pegNotice.classList.toggle('hidden', !isCfa);
  }
}

function startXaalyaSync() {
  initXaalyaRates();
  setTimeout(updateSimulation, 150);
  setTimeout(updateSimulation, 600);
}

window.XAALYA_FALLBACK_RATES = XAALYA_FALLBACK_RATES;
window.XAALYA_DEFAULT_CORRIDORS = XAALYA_DEFAULT_CORRIDORS;
window.normalizeCurrencyCode = normalizeCurrencyCode;
window.initXaalyaRates = initXaalyaRates;
window.getCrossRate = getCrossRate;
window.computeEstimatedNetForecast = computeEstimatedNetForecast;
window.updateSimulation = updateSimulation;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startXaalyaSync);
} else {
  startXaalyaSync();
}

document.addEventListener('input', (e) => {
  if (e.target && e.target.matches('input[type="number"], input[id*="amount"], input[id*="montant"]')) {
    updateSimulation();
  }
});

document.addEventListener('change', (e) => {
  if (e.target && e.target.matches('select')) {
    updateSimulation();
  }
});

document.addEventListener('click', (e) => {
  const corridorBtn = e.target.closest('[data-from][data-to], [data-corridor], .corridor-btn, .corridor-card, button, a');
  if (!corridorBtn) return;

  const text = (corridorBtn.textContent || '').trim();
  const hasArrow = /(?:→|->|➔|➜)/.test(text) || corridorBtn.dataset.from || corridorBtn.dataset.corridor;
  if (!hasArrow) return;

  const selects = Array.from(document.querySelectorAll('select'));
  const fromSelect =
    document.getElementById('from-currency') ||
    document.getElementById('sourceCurrency') ||
    selects[0] ||
    null;
  const toSelect =
    document.getElementById('to-currency') ||
    document.getElementById('targetCurrency') ||
    document.getElementById('sim-currency') ||
    selects[1] ||
    null;

  let nextFrom = corridorBtn.dataset.from;
  let nextTo = corridorBtn.dataset.to;

  if ((!nextFrom || !nextTo) && corridorBtn.dataset.corridor) {
    const parts = corridorBtn.dataset.corridor.split(/[^A-Za-z]+/).filter(Boolean);
    if (parts.length >= 2) {
      nextFrom = nextFrom || parts[0];
      nextTo = nextTo || parts[1];
    }
  }

  if (!nextFrom || !nextTo) {
    const match = text.match(/\b([A-Z]{3})\b.*?(?:→|->|➔|➜).*?\b([A-Z]{3})\b/);
    if (match) {
      nextFrom = nextFrom || match[1];
      nextTo = nextTo || match[2];
    }
  }

  if (nextFrom && fromSelect) {
    const normFrom = normalizeCurrencyCode(nextFrom, 'EUR');
    const opt = Array.from(fromSelect.options).find(
      (o) => normalizeCurrencyCode(o.value, '') === normFrom || normalizeCurrencyCode(o.text, '') === normFrom
    );
    if (opt) fromSelect.value = opt.value;
  }

  if (nextTo && toSelect) {
    const normTo = normalizeCurrencyCode(nextTo, 'XOF');
    const opt = Array.from(toSelect.options).find(
      (o) => normalizeCurrencyCode(o.value, '') === normTo || normalizeCurrencyCode(o.text, '') === normTo
    );
    if (opt) toSelect.value = opt.value;
  }

  setTimeout(updateSimulation, 0);
  setTimeout(updateSimulation, 120);
});