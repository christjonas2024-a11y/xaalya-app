// xaalyaRates.js - Gestion globale des taux et du compartiment Valeur de Référence Officielle
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

window.xaalyaRatesData = {
  base: 'EUR',
  updatedAt: null,
  rates: { ...XAALYA_FALLBACK_RATES }
};
let xaalyaRatesData = window.xaalyaRatesData;

// Normalise un code pays, libellé ou texte vers un code ISO devise à 3 lettres
function normalizeCurrencyCode(code, fallback = 'EUR') {
  if (!code) return fallback;
  const clean = code.toString().trim().toUpperCase();

  // Correspondances pays / régions fréquentes vers leur devise ISO
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

  // Si le libellé contient directement un code ISO de 3 lettres connu
  const isoMatch = clean.match(/\b(EUR|USD|GBP|CAD|XOF|XAF|NGN|GHS|KES|MAD|ZAR|TND)\b/);
  if (isoMatch) return isoMatch[1];

  const anyIso = clean.match(/\b([A-Z]{3})\b/);
  return anyIso ? anyIso[1] : fallback;
}

async function initXaalyaRates() {
  const updateEls = [
    document.getElementById('last-update-time'),
    document.getElementById('ref-last-update')
  ].filter(Boolean);

  // Premier calcul immédiat avec les taux de repli pour éviter tout affichage figé sur "-"
  updateSimulation();

  try {
    const response = await fetch('rates.json?t=' + Date.now(), { cache: 'no-store' });
    if (!response.ok) throw new Error('HTTP ' + response.status);

    const data = await response.json();
    window.xaalyaRatesData = {
      base: data.base || 'EUR',
      updatedAt: data.updatedAt || null,
      rates: {
        ...XAALYA_FALLBACK_RATES,
        ...(data.rates || {})
      }
    };
    xaalyaRatesData = window.xaalyaRatesData;

    const formatted = data.updatedAt
      ? (() => {
          const d = new Date(data.updatedAt);
          return isNaN(d.getTime())
            ? String(data.updatedAt)
            : `${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
        })()
      : 'À jour';

    updateEls.forEach((el) => {
      el.textContent = formatted;
    });
  } catch (e) {
    console.warn('Repli sur les taux de référence intégrés :', e);
    window.xaalyaRatesData.rates = {
      ...XAALYA_FALLBACK_RATES,
      ...(window.xaalyaRatesData.rates || {})
    };
    xaalyaRatesData = window.xaalyaRatesData;
    updateEls.forEach((el) => {
      el.textContent = 'Mode référence';
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

function updateSimulation() {
  // Récupère l'input montant et les sélecteurs du compartiment du haut
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
  const rateDisplay = document.getElementById('sim-rate-display');
  const netDisplay = document.getElementById('sim-net-display');
  const pegNotice = document.getElementById('peg-notice');

  // Montant par défaut = 300 si vide ou invalide
  const rawAmount = amountInput ? String(amountInput.value).trim() : '';
  const parsedAmount = parseFloat(rawAmount);
  const amount = rawAmount === '' || isNaN(parsedAmount) ? 300 : parsedAmount;

  const fromCurr = normalizeCurrencyCode(fromSelect ? fromSelect.value : 'EUR', 'EUR');
  const toCurr = normalizeCurrencyCode(toSelect ? toSelect.value : 'XOF', 'XOF');

  if (corridorLabel) {
    corridorLabel.textContent = `Corridor actif : ${fromCurr} → ${toCurr}`;
  }

  const rate = getCrossRate(fromCurr, toCurr);

  if (rate === null || rate === undefined) {
    if (rateDisplay) rateDisplay.textContent = `Indisponible (${fromCurr} → ${toCurr})`;
    if (netDisplay) netDisplay.textContent = '-';
  } else {
    const netReceived = amount * rate;
    if (rateDisplay) {
      rateDisplay.textContent = `1 ${fromCurr} = ${rate.toFixed(4)} ${toCurr}`;
    }
    if (netDisplay) {
      netDisplay.textContent = `${netReceived.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${toCurr}`;
    }
  }

  // Affichage conditionnel du badge de parité fixe BCEAO / BEAC
  if (pegNotice) {
    const isCfa = toCurr === 'XOF' || toCurr === 'XAF';
    pegNotice.classList.toggle('hidden', !isCfa);
  }
}

function startXaalyaSync() {
  initXaalyaRates();
  // Deuxième passe courte au cas où un autre script (ex: i18n ou sélecteurs) initialise ses valeurs juste après
  setTimeout(updateSimulation, 150);
  setTimeout(updateSimulation, 600);
}

window.XAALYA_FALLBACK_RATES = XAALYA_FALLBACK_RATES;
window.normalizeCurrencyCode = normalizeCurrencyCode;
window.initXaalyaRates = initXaalyaRates;
window.getCrossRate = getCrossRate;
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