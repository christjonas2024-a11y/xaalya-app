// update-rates.js - Agrégation multi-sources de taux publics ouverts (Zéro scraping commercial)
const fs = require('fs');

// Parités fixes officielles garanties par traité monétaire (Zone Franc CFA)
const FIXED_EUR_PEGS = {
  XOF: 655.957,
  XAF: 655.957,
  KMF: 491.96775
};

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Xaalya-OpenRates-Bot/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} sur ${url}`);
  return res.json();
}

async function buildRates() {
  const sourcesUsed = [];
  let primaryRates = null;
  let backupRates = null;
  let ecbRates = null;

  // 1. Source Principale : Fawaz Ahmed Open Currency API (CDN jsDelivr)
  try {
    const data = await fetchJson('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json');
    if (data && data.eur) {
      primaryRates = Object.fromEntries(
        Object.entries(data.eur).map(([k, v]) => [k.toUpperCase(), Number(v)])
      );
      sourcesUsed.push('FawazAhmed-OpenCurrencyAPI');
    }
  } catch (e) {
    console.warn('Source 1 (jsDelivr) indisponible, bascule vers le miroir...', e.message);
    try {
      const dataMirror = await fetchJson('https://latest.currency-api.pages.dev/v1/currencies/eur.json');
      if (dataMirror && dataMirror.eur) {
        primaryRates = Object.fromEntries(
          Object.entries(dataMirror.eur).map(([k, v]) => [k.toUpperCase(), Number(v)])
        );
        sourcesUsed.push('FawazAhmed-CloudflareMirror');
      }
    } catch (e2) {
      console.warn('Miroir Source 1 indisponible :', e2.message);
    }
  }

  // 2. Source Secondaire : Open Exchange Rates (open.er-api.com)
  try {
    const dataEr = await fetchJson('https://open.er-api.com/v6/latest/EUR');
    if (dataEr && dataEr.rates) {
      backupRates = dataEr.rates;
      sourcesUsed.push('Open-ER-API');
    }
  } catch (e) {
    console.warn('Source 2 (Open ER-API) indisponible :', e.message);
  }

  // 3. Source Institutionnelle : Frankfurter API (Banque Centrale Européenne)
  try {
    const dataEcb = await fetchJson('https://api.frankfurter.app/latest?from=EUR');
    if (dataEcb && dataEcb.rates) {
      ecbRates = dataEcb.rates;
      sourcesUsed.push('ECB-Frankfurter');
    }
  } catch (e) {
    console.warn('Source 3 (Frankfurter/BCE) indisponible :', e.message);
  }

  if (!primaryRates && !backupRates) {
    throw new Error('Échec critique : aucune source publique de devises joignable.');
  }

  // Fusion intelligente des sources publiques
  const basePool = { ...(backupRates || {}), ...(primaryRates || {}) };
  basePool.EUR = 1;

  if (ecbRates) {
    for (const [code, rate] of Object.entries(ecbRates)) {
      basePool[code] = rate;
    }
  }

  // Application des parités fixes officielles (BCEAO / BEAC)
  for (const [code, fixedRate] of Object.entries(FIXED_EUR_PEGS)) {
    basePool[code] = fixedRate;
  }
  sourcesUsed.push('BCEAO-BEAC-FixedParity');

  const output = {
    base: 'EUR',
    updatedAt: new Date().toISOString(),
    methodology: 'Multi-source public mid-market aggregation (Zero commercial scraping)',
    sources: sourcesUsed,
    currencyCount: Object.keys(basePool).length,
    rates: basePool
  };

  fs.writeFileSync('rates.json', JSON.stringify(output, null, 2), 'utf-8');
  console.log(`Succès : ${output.currencyCount} devises mises à jour via [${sourcesUsed.join(', ')}]`);
}

buildRates().catch((err) => {
  console.error(err);
  process.exit(1);
});