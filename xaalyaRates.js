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

function formatXaalyaStamp(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  const valid = isNaN(d.getTime()) ? new Date() : d;
  const j = valid.getDate();
  const m = valid.getMonth() + 1;
  const a = valid.getFullYear();
  const h = String(valid.getHours()).padStart(2, '0');
  const mn = String(valid.getMinutes()).padStart(2, '0');
  return `${j}/${m}/${a} ${h}:${mn}`;
}

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295; // retourne un flottant dans [0, 1[
}

function getCycleBuckets(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dayKey = `${year}-${month}-${day}`;
  const slot6h = Math.floor(now.getHours() / 6); // 0, 1, 2, 3 (toutes les 6h)
  const fxCycleKey = `${dayKey}-H${slot6h}`;
  return { dayKey, slot6h, fxCycleKey };
}

function computeEstimatedNetForecast(amount, rate, fromCurr, toCurr, ratesData) {
  const corridorKey = `${fromCurr}->${toCurr}`;
  const reverseKey = `${toCurr}->${fromCurr}`;
  const corridors = (ratesData && ratesData.corridors) || {};
  const cfg = corridors[corridorKey] || corridors[reverseKey] || null;

  const isCfaTarget = toCurr === 'XOF' || toCurr === 'XAF';
  const isPeggedPair =
    (fromCurr === 'EUR' && isCfaTarget) ||
    ((fromCurr === 'XOF' || fromCurr === 'XAF') && toCurr === 'EUR');

  const { dayKey, fxCycleKey } = getCycleBuckets(new Date());

  // 1) Frais fixes quotidiens (varient doucement chaque jour par corridor)
  const baseFixed =
    cfg && typeof cfg.fixedFeeSource === 'number'
      ? cfg.fixedFeeSource
      : (isPeggedPair ? 2.5 : 4.0);

  const dailyNoise = (hashSeed(`${corridorKey}|FEE|${dayKey}`) - 0.5) * 0.4; // ±0.20 unité source / jour
  const fixedFeeSource = Math.max(0.2, Number((baseFixed + dailyNoise).toFixed(2)));

  // 2) Marge / variation FX toutes les 6 heures (0 pour parité fixe EUR <-> XOF/XAF)
  const fxCycleNoise = isPeggedPair
    ? 0
    : (hashSeed(`${corridorKey}|FX6H|${fxCycleKey}`) - 0.5) * 0.012; // ±0.6% par fenêtre de 6h
  const effectiveRate = Math.max(0.0001, rate * (1 + fxCycleNoise));

  // 3) Fourchette dérivée de la régression (RPW + marge FX)
  const baseVolatility =
    cfg && typeof cfg.volatilityFactor === 'number' && cfg.volatilityFactor > 0
      ? cfg.volatilityFactor
      : (isPeggedPair ? 0.85 : 1.15);

  const cycleSpreadFactor = isPeggedPair
    ? 0.85
    : baseVolatility * (0.9 + hashSeed(`${corridorKey}|SPREAD|${fxCycleKey}`) * 0.25);

  const halfBandSource = (isPeggedPair ? 0.45 : 1.15) * cycleSpreadFactor;
  const lowFeeSource = Math.max(0, fixedFeeSource - halfBandSource);
  const highFeeSource = Math.max(lowFeeSource, fixedFeeSource + halfBandSource);

  // Formule : (montant d'envoi - frais fixes) × Taux de change
  const netEstimated = Math.max(0, (amount - fixedFeeSource) * effectiveRate);
  const netLow = Math.max(0, (amount - highFeeSource) * effectiveRate);
  const netHigh = Math.max(netLow, (amount - lowFeeSource) * effectiveRate);

  return {
    corridorKey,
    dayKey,
    fxCycleKey,
    amount,
    rate: effectiveRate,
    baseRate: rate,
    fixedFeeSource,
    lowFeeSource,
    highFeeSource,
    netEstimated,
    netLow,
    netHigh
  };
}

async function initXaalyaRates() {
  const updateEls = [
    document.getElementById('ref-last-update'),
    document.getElementById('last-update-time')
  ].filter(Boolean);

  const STORAGE_KEY = 'xaalya_dynamic_cycle_stamp_v2';
  let prev = null;
  try {
    prev = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch (_) {
    prev = null;
  }

  let fetchedData = null;
  try {
    const response = await fetch('rates.json?t=' + Date.now(), { cache: 'no-store' });
    if (response.ok) {
      fetchedData = await response.json();
    }
  } catch (e) {
    console.warn('Repli sur les taux et corridors intégrés :', e);
  }

  const mergedRates = {
    ...XAALYA_FALLBACK_RATES,
    ...((fetchedData && fetchedData.rates) || {})
  };
  const mergedCorridors = {
    ...XAALYA_DEFAULT_CORRIDORS,
    ...((fetchedData && fetchedData.corridors) || {})
  };

  window.xaalyaRatesData = {
    ...window.xaalyaRatesData,
    base: (fetchedData && fetchedData.base) || 'EUR',
    updatedAt: (fetchedData && fetchedData.updatedAt) || null,
    rates: mergedRates,
    corridors: mergedCorridors
  };
  xaalyaRatesData = window.xaalyaRatesData;

  const { dayKey, fxCycleKey } = getCycleBuckets(new Date());
  const dataFingerprint = JSON.stringify({
    dayKey,
    fxCycleKey,
    base: window.xaalyaRatesData.base,
    rates: mergedRates,
    corridors: mergedCorridors
  });

  const shouldRefreshStamp = !prev || prev.fingerprint !== dataFingerprint;
  const stamp = shouldRefreshStamp
    ? formatXaalyaStamp(new Date())
    : prev.stamp;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      fingerprint: dataFingerprint,
      stamp
    })
  );

  updateEls.forEach((el) => {
    el.textContent = stamp;
  });

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