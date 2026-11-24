/* xaalyaRates.js — Modèle net journalier (00:00 GMT), taux croisés rates.json & 5 colonnes */
(function () {
  const FIXED_CFA_PER_EUR = 655.957;

  const OPERATOR_PROFILES = [
    { id: "nala", name: "Nala", category: "digital", neutralBenchmark: false, url: "https://www.nala.money/" },
    { id: "sendwave", name: "Sendwave", category: "digital", neutralBenchmark: false, url: "https://www.sendwave.com/fr" },
    { id: "taptap", name: "Taptap Send", category: "digital", neutralBenchmark: false, url: "https://www.taptapsend.com/" },
    { id: "lemfi", name: "Lemfi", category: "digital", neutralBenchmark: false, url: "https://lemfi.com/" },
    { id: "paysend", name: "Paysend", category: "digital", neutralBenchmark: false, url: "https://paysend.com/" },
    { id: "wise", name: "Wise", category: "digital", neutralBenchmark: false, url: "https://wise.com/fr/send-money/" },
    { id: "remitly", name: "Remitly", category: "digital", neutralBenchmark: false, url: "https://www.remitly.com/fr/home" },
    { id: "worldremit", name: "WorldRemit", category: "digital", neutralBenchmark: false, url: "https://www.worldremit.com/fr" },
    { id: "wu", name: "Western Union", category: "traditional", neutralBenchmark: false, url: "https://www.westernunion.com/fr/fr/web/send-money.html" },
    { id: "mg", name: "MoneyGram", category: "traditional", neutralBenchmark: false, url: "https://www.moneygram.com/m/fr/fr/send.html" },
    { id: "ria", name: "Ria Money Transfer", category: "traditional", neutralBenchmark: false, url: "https://www.riamoneytransfer.com/fr/fr/" }
  ];

  const CORRIDOR_PRIORS = {
    "EUR->XOF": {
      baseCostByCat: { mobile: 0.014, digital: 0.022, traditional: 0.048, bank_benchmark: 0.065 },
      spreadHalfWidth: { mobile: 0.004, digital: 0.006, traditional: 0.011, bank_benchmark: 0.014 }
    },
    "EUR->XAF": {
      baseCostByCat: { mobile: 0.015, digital: 0.023, traditional: 0.049, bank_benchmark: 0.066 },
      spreadHalfWidth: { mobile: 0.004, digital: 0.006, traditional: 0.011, bank_benchmark: 0.014 }
    },
    "USD->NGN": {
      baseCostByCat: { mobile: 0.025, digital: 0.031, traditional: 0.056, bank_benchmark: 0.074 },
      spreadHalfWidth: { mobile: 0.008, digital: 0.010, traditional: 0.016, bank_benchmark: 0.020 }
    }
  };

  function getDailyMidnightGmtStamp(dateObj = new Date()) {
    const y = dateObj.getUTCFullYear();
    const m = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getUTCDate()).padStart(2, "0");
    return `${d}/${m}/${y} 00:00 GMT`;
  }

  function extractCurrencyCode(rawVal) {
    if (!rawVal) return "";
    const match = String(rawVal).toUpperCase().match(/\b[A-Z]{3}\b/);
    return match ? match[0] : String(rawVal).trim().toUpperCase();
  }

  function computeCompositeRate(source, target, ratesData) {
    if (!source || !target || source === target) return 1;
    if (source === "EUR" && (target === "XOF" || target === "XAF")) {
      return FIXED_CFA_PER_EUR;
    }

    const ratesObj = ratesData && typeof ratesData.rates === "object" ? ratesData.rates : null;
    if (ratesObj) {
      const baseCode = extractCurrencyCode(ratesData.base || "EUR") || "EUR";
      const srcRate = source === baseCode ? 1 : Number(ratesObj[source]);
      const tgtRate = target === baseCode ? 1 : Number(ratesObj[target]);

      if (Number.isFinite(srcRate) && srcRate > 0 && Number.isFinite(tgtRate) && tgtRate > 0) {
        return tgtRate / srcRate;
      }
    }

    // Repli de sécurité uniquement si rates.json ne contient pas la devise
    const fallbackTable = {
      "EUR->NGN": 1700,
      "USD->NGN": 1580,
      "GBP->NGN": 2000,
      "USD->XOF": 605,
      "USD->XAF": 605,
      "CAD->XOF": 430,
      "EUR->MAD": 10.8,
      "EUR->KES": 140,
      "USD->KES": 129,
      "USD->GHS": 16.5,
      "EUR->TND": 3.35
    };
    return fallbackTable[`${source}->${target}`] || 1;
  }

  function estimateChowLinNetForProfile(profile, amount, refRate, corridorKey, ratesData, daySeed) {
    const prior = CORRIDOR_PRIORS[corridorKey] || {
      baseCostByCat: { mobile: 0.02, digital: 0.028, traditional: 0.052, bank_benchmark: 0.07 },
      spreadHalfWidth: { mobile: 0.006, digital: 0.008, traditional: 0.014, bank_benchmark: 0.018 }
    };

    const sizeFactor = Math.max(0.75, Math.min(1.25, 300 / Math.max(1, amount)));
    const chowLinAdjustment = Number(ratesData?.chowLinDelta?.[corridorKey]?.[profile.id] || 0);
    const seasonalityWave = Math.sin(((daySeed % 30) / 30) * Math.PI * 2) * 0.002;

    const baseCost = prior.baseCostByCat[profile.category] ?? 0.035;
    const netCostRatio = Math.max(
      0.003,
      Math.min(0.25, baseCost * sizeFactor + chowLinAdjustment + seasonalityWave)
    );

    const halfSpread = prior.spreadHalfWidth[profile.category] ?? 0.01;
    const netCentral = amount * refRate * (1 - netCostRatio);
    const netMin = amount * refRate * (1 - Math.min(0.30, netCostRatio + halfSpread));
    const netMax = amount * refRate * (1 - Math.max(0.001, netCostRatio - halfSpread));

    return {
      profile,
      netCentral,
      netMin,
      netMax,
      effectiveCostPct: (netCostRatio * 100).toFixed(2).replace(".", ",")
    };
  }

  function formatMoney(val, currency) {
    return `${Number(val).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} ${currency}`;
  }

  function renderOrderedSections(container, payload) {
    const { source, target, refRate, stamp, estimates, isNewDailyStamp } = payload;
    const bestNonNeutral = estimates.find((e) => !e.profile.neutralBenchmark) || estimates[0];

    container.innerHTML = `
      <div class="space-y-6" data-xaalya-ordered="true">
        <!-- 2. ESTIMATION NETTE XAALYA (MODÈLE CHOW-LIN) — CENTRÉ -->
        <div id="xaalya-result-block" class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
          <div class="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Estimation nette Xaalya (modèle Chow-Lin)
          </div>
<div id="xaalya-net-main" class="text-2xl sm:text-3xl font-black text-emerald-400 pt-1">
            ${formatMoney(bestNonNeutral.netCentral, target)}
          </div>
          <div class="text-xs text-slate-400">
            Taux de référence : <span class="font-mono text-slate-300">1 ${source} = ${refRate.toLocaleString("fr-FR", { maximumFractionDigits: 4 })} ${target}</span>
          </div>
          <p class="text-xs text-emerald-400 pt-1">
            vérifier auprès des opérateurs avant d'envoyer
          </p>
        </div>

        <!-- 3. TOP OPÉRATEURS NON SPONSORISÉS (5 COLONNES — LISIBLE MOBILE) -->
        <div id="xaalya-top-operators" class="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 sm:p-5 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">Top opérateurs non sponsorisés</h3>
          </div>
          <div class="overflow-x-auto -mx-1 sm:mx-0">
            <table class="w-full text-left border-collapse text-[11px] sm:text-sm">
              <thead>
                <tr class="border-b border-slate-800 text-slate-400 text-[10px] sm:text-xs uppercase">
                  <th class="py-2 px-1.5 sm:px-3">Opérateur</th>
                  <th class="py-2 px-1.5 sm:px-3">Intervalle net estimé</th>
                  <th class="py-2 px-1.5 sm:px-3">Coût moyen estimé</th>
                  <th class="py-2 px-1.5 sm:px-3">Montant à recevoir estimé</th>
                  <th class="py-2 px-1.5 sm:px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/80">
                ${estimates.map((item) => `
                  <tr class="${item.profile.neutralBenchmark ? "bg-slate-950/50 text-slate-300" : "hover:bg-slate-950/60 text-white"}">
                    <td class="py-2.5 px-1.5 sm:px-3 font-semibold leading-tight">${item.profile.name}</td>
                    <td class="py-2.5 px-1.5 sm:px-3 font-mono text-[10px] sm:text-xs text-slate-300 leading-tight">${formatMoney(item.netMin, target)} – ${formatMoney(item.netMax, target)}</td>
                    <td class="py-2.5 px-1.5 sm:px-3 font-mono text-[10px] sm:text-xs text-slate-300 whitespace-nowrap">${item.effectiveCostPct} %</td>
                    <td class="py-2.5 px-1.5 sm:px-3 font-bold text-emerald-400 whitespace-nowrap">${formatMoney(item.netCentral, target)}</td>
                    <td class="py-2.5 px-1.5 sm:px-3 text-right whitespace-nowrap">
                      <a href="${item.profile.url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition">
                        Envoyer
                      </a>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <!-- ESPACE PUB -->
        <aside id="xaalya-ad-space" aria-label="Espace publicitaire" class="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 text-center">
          <div class="text-[11px] uppercase tracking-widest text-slate-500">Espace pub</div>
          <div class="text-xs text-slate-400 mt-1">Emplacement réservé — Partenariat / annonce neutre</div>
        </aside>
      </div>
    `;
  }

  async function runXaalyaModel() {
    const srcEl = document.getElementById("sourceCurrency");
    const tgtEl = document.getElementById("targetCurrency");
    const amtEl = document.getElementById("sendAmount");
    const container = document.getElementById("resultsContainer");
    if (!container) return;

    const source = extractCurrencyCode(srcEl?.value || "EUR") || "EUR";
    const target = extractCurrencyCode(tgtEl?.value || "XOF") || "XOF";
    const amount = Math.max(1, Number(amtEl?.value || 300));
    const corridorKey = `${source}->${target}`;

    let ratesData = window.__XAALYA_RATES_CACHE__ || null;
    if (!ratesData) {
      try {
        const res = await fetch(`rates.json?day=${getDailyMidnightGmtStamp().slice(0, 10)}`, { cache: "no-store" });
        if (res.ok) {
          ratesData = await res.json();
          window.__XAALYA_RATES_CACHE__ = ratesData;
        }
      } catch (_) {
        // Repli silencieux sur les valeurs de référence locales
      }
    }

    const refRate = computeCompositeRate(source, target, ratesData);
    const midnightStamp = getDailyMidnightGmtStamp();
    const daySeed = Math.floor(Date.now() / 86400000);

    const prevStamp = window.__XAALYA_LAST_MIDNIGHT_STAMP__ || "";
    const isNewDailyStamp = prevStamp !== midnightStamp;
    if (isNewDailyStamp) {
      window.__XAALYA_LAST_MIDNIGHT_STAMP__ = midnightStamp;
    }

    const estimates = OPERATOR_PROFILES
      .map((p) => estimateChowLinNetForProfile(p, amount, refRate, corridorKey, ratesData, daySeed))
      .sort((a, b) => {
        if (a.profile.neutralBenchmark !== b.profile.neutralBenchmark) {
          return a.profile.neutralBenchmark ? 1 : -1;
        }
        return b.netCentral - a.netCentral;
      });

    const best = estimates.find((e) => !e.profile.neutralBenchmark) || estimates[0];

    const lastUpdatedEl = document.getElementById("lastUpdatedInfo");
    if (lastUpdatedEl && isNewDailyStamp) {
      lastUpdatedEl.textContent = midnightStamp;
    }
    const simNetEl = document.getElementById("sim-net-display");
    if (simNetEl) simNetEl.textContent = formatMoney(best.netCentral, target);
    const simRangeEl = document.getElementById("sim-range-watermark");
    if (simRangeEl) simRangeEl.textContent = `${formatMoney(best.netMin, target)} – ${formatMoney(best.netMax, target)}`;
    const simRateEl = document.getElementById("sim-rate-display");
    if (simRateEl) simRateEl.textContent = `1 ${source} = ${refRate.toLocaleString("fr-FR", { maximumFractionDigits: 4 })} ${target}`;

    renderOrderedSections(container, {
      corridorKey,
      source,
      target,
      amount,
      refRate,
      stamp: window.__XAALYA_LAST_MIDNIGHT_STAMP__,
      estimates,
      isNewDailyStamp
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    ["sourceCurrency", "targetCurrency", "sendAmount"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("change", runXaalyaModel);
        el.addEventListener("input", runXaalyaModel);
      }
    });
    runXaalyaModel();
  });


  function bindTopCorridors() {
    const origSelect = window.selectCorridor;
    window.selectCorridor = function (src, tgt) {
      if (typeof origSelect === "function") {
        origSelect(src, tgt);
      }
      const srcEl = document.getElementById("sourceCurrency");
      const tgtEl = document.getElementById("targetCurrency");
      if (srcEl && src) srcEl.value = extractCurrencyCode(src);
      if (tgtEl && tgt) tgtEl.value = extractCurrencyCode(tgt);
      runXaalyaModel();
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindTopCorridors);
  } else {
    bindTopCorridors();
  }
  window.XaalyaModel = { run: runXaalyaModel, profiles: OPERATOR_PROFILES, bindCorridors: bindTopCorridors };
})();
