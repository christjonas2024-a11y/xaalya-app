// xaalyaRates.js - Gestion globale des taux et du simulateur d'écart de change
let xaalyaRatesData = { base: 'EUR', updatedAt: null, rates: {} };

async function loadXaalyaReferenceRates() {
  const updateEl = document.getElementById('ref-last-update');
  try {
    const res = await fetch('rates.json?' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();

    xaalyaRatesData = {
      base: json.base || 'EUR',
      updatedAt: json.updatedAt || null,
      rates: json.rates || {}
    };

    if (updateEl && json.updatedAt) {
      const d = new Date(json.updatedAt);
      updateEl.textContent = isNaN(d.getTime())
        ? json.updatedAt
        : `${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (updateEl) {
      updateEl.textContent = 'À jour';
    }
  } catch (err) {
    console.warn('Chargement rates.json impossible, repli partiel :', err);
    // Parités de secours minimales si rates.json est absent en local
    xaalyaRatesData.rates = {
      EUR: 1,
      XOF: 655.957,
      XAF: 655.957,
      ...xaalyaRatesData.rates
    };
    if (updateEl) updateEl.textContent = 'Mode secours';
  }

  refreshReferenceCompartment();
}

// Conversion croisée propre même si la devise source n'est pas EUR (ex: CAD -> XOF ou USD -> GHS)
function getCrossRate(fromCurr, toCurr) {
  if (fromCurr === toCurr) return 1;
  const rates = xaalyaRatesData.rates || {};
  const base = xaalyaRatesData.base || 'EUR';

  const fromInBase = fromCurr === base ? 1 : rates[fromCurr];
  const toInBase = toCurr === base ? 1 : rates[toCurr];

  if (!fromInBase || !toInBase) return null;
  return toInBase / fromInBase;
}

function refreshReferenceCompartment() {
  const amountEl = document.getElementById('sim-amount') || document.querySelector('input[type="number"]');
  const fromEl = document.getElementById('from-currency') || document.querySelectorAll('select')[0];
  const toEl = document.getElementById('to-currency') || document.querySelectorAll('select')[1];

  const corridorLabel = document.getElementById('ref-corridor-label');
  const netDisplay = document.getElementById('ref-net-display');
  const rateDisplay = document.getElementById('ref-rate-display');
  const pegNotice = document.getElementById('ref-peg-notice');

  const amount = parseFloat(amountEl?.value) || 0;
  const fromCurr = (fromEl?.value || 'EUR').toUpperCase();
  const toCurr = (toEl?.value || 'XOF').toUpperCase();

  const rate = getCrossRate(fromCurr, toCurr);
  if (corridorLabel) corridorLabel.textContent = `Corridor actif : ${fromCurr} → ${toCurr}`;

  if (!rate) {
    if (rateDisplay) rateDisplay.textContent = `Indisponible (${fromCurr} → ${toCurr})`;
    if (netDisplay) netDisplay.textContent = '-';
    return;
  }

  const converted = amount * rate;
  if (rateDisplay) rateDisplay.textContent = `1 ${fromCurr} = ${rate.toFixed(4)} ${toCurr}`;
  if (netDisplay) {
    netDisplay.textContent = `${converted.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${toCurr}`;
  }

  if (pegNotice) {
    const isCfa = toCurr === 'XOF' || toCurr === 'XAF';
    pegNotice.classList.toggle('hidden', !isCfa);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadXaalyaReferenceRates();

  // Écoute des champs principaux
  ['input', 'change'].forEach((evt) => {
    document.addEventListener(evt, (e) => {
      if (e.target && (e.target.matches('input[type="number"]') || e.target.matches('select'))) {
        refreshReferenceCompartment();
      }
    });
  });

  // Clic sur un bouton "Corridors les plus populaires" (ex: data-from="CAD" data-to="XOF")
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-from][data-to], .corridor-card, .corridor-btn');
    if (!btn) return;

    const fromEl = document.getElementById('from-currency') || document.querySelectorAll('select')[0];
    const toEl = document.getElementById('to-currency') || document.querySelectorAll('select')[1];

    if (btn.dataset.from && fromEl) fromEl.value = btn.dataset.from;
    if (btn.dataset.to && toEl) toEl.value = btn.dataset.to;

    refreshReferenceCompartment();
  });
});