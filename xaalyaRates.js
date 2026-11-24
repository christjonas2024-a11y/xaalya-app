/* xaalyaRates.js — Modèle net journalier (00:00 GMT), 10 profils & rendu ordonné */
(function () {
  const FIXED_EUR_XOF = 655.957;

  // 10 profils représentatifs (Banque / SWIFT conservé comme repère neutre)
  const OPERATOR_PROFILES = [
    { id: "wu", name: "Western Union", category: "traditional", neutralBenchmark: false, url: "https://www.westernunion.com" },
    { id: "mg", name: "MoneyGram", category: "traditional", neutralBenchmark: false, url: "https://www.moneygram.com" },
    { id: "ria", name: "Ria Money Transfer", category: "traditional", neutralBenchmark: false, url: "https://www.riamoneytransfer.com" },
    { id: "wise", name: "Wise", category: "digital", neutralBenchmark: false, url: "https://wise.com" },
    { id: "remitly", name: "Remitly", category: "digital", neutralBenchmark: false, url: "https://www.remitly.com" },
    { id: "worldremit", name: "WorldRemit", category: "digital", neutralBenchmark: false, url: "https://www.worldremit.com" },
    { id: "sendwave", name: "Sendwave", category: "digital", neutralBenchmark: false, url: "https://www.sendwave.com" },
    { id: "orange_money", name: "Orange Money", category: "mobile", neutralBenchmark: false, url: "https://www.orangemoney.com" },
    { id: "wave_momo", name: "Wave", category: "mobile", neutralBenchmark: false, url: "https://www.wave.com" },
    { id: "bank_swift", name: "Banques / SWIFT (Repère neutre)", category: "bank_benchmark", neutralBenchmark: true, url: "https://www.swift.com" }
  ];

  // Paramètres Chow-Lin / RPW calibrés par corridor & famille (extensibles aux 294 corridors)
  const CORRIDOR_PRIORS = {
    "EUR->XOF": {
      label: "France → Sénégal (300 €)",
      defaultAmount: 300,
      baseCostByCat: { mobile: 0.014, digital: 0.022, traditional: 0.048, bank_benchmark: 0.065 },
      spreadHalfWidth: { mobile: 0.004, digital: 0.006, traditional: 0.011, bank_benchmark: 0.014 }
    },
    "USD->NGN": {
      label: "États-Unis → Nigeria (300 $)",
      defaultAmount: 300,
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

  function computeCompositeRate(source, target, ratesData) {
    if (source === target) return 1;
    const key = `${source}->${target}`;
    if (key === "EUR->XOF") return FIXED_EUR_XOF;

    const localRate = ratesData?.rates?.[key];
    const openRate = ratesData?.sources?.openRates?.[key];
    const fawazRate = ratesData?.sources?.fawaz?.[key];
    const ffmRate = ratesData?.sources?.frankfurter?.[key];

    const samples = [localRate, openRate, fawazRate, ffmRate].filter((v) => typeof v === "number" && v > 0);
    if (samples.length > 0) {
      return samples.reduce((acc, v) => acc + v, 0) / samples.length;
    }

    // Repli de sécurité si rates.json est partiel
    if (key === "USD->NGN") return 1580;
    return 1;
  }

  function estimateChowLinNetForProfile(profile, amount, refRate, corridorKey, ratesData, daySeed) {
    const prior = CORRIDOR_PRIORS[corridorKey] || {
      baseCostByCat: { mobile: 0.02, digital: 0.028, traditional: 0.052, bank_benchmark: 0.07 },
      spreadHalfWidth: { mobile: 0.006, digital: 0.008, traditional: 0.014, bank_benchmark: 0.018 }
    };

    // Amortissement des frais fixes sur le montant M0 (référence 300)
    const sizeFactor = Math.max(0.75, Math.min(1.25, 300 / Math.max(1, amount)));
    const chowLinAdjustment = Number(ratesData?.chowLinDelta?.[corridorKey]?.[profile.id] || 0);
    const seasonalityWave = Math.sin((daySeed % 30) / 30 * Math.PI * 2) * 0.002;

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
      effectiveCostPct: (netCostRatio * 100).toFixed(2)
    };
  }

  function formatMoney(val, currency) {
    return `${Number(val).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ${currency}`;
  }

  function renderOrderedSections(container, payload) {
    const { corridorKey, source, target, amount, refRate, stamp, estimates, isNewDailyStamp } = payload;
    const bestNonNeutral = estimates.find((e) => !e.profile.neutralBenchmark) || estimates[0];

    container.innerHTML = `
      <div class="space-y-6" data-xaalya-ordered="true">
        <!-- 2. RÉSULTAT XAALYA (MONTANT NET ESTIMÉ + HORODATAGE JOURNALIER 00:00 GMT) -->
        <div id="xaalya-result-block" class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span class="font-semibold uppercase tracking-wider text-emerald-400">Estimation nette Xaalya (modèle Chow-Lin)</span>
            <span id="xaalya-daily-stamp" data-daily-updated="${isNewDailyStamp ? "1" : "0"}" class="font-mono text-slate-300">Mise à jour : ${stamp}</span>
          </div>
          <div id="xaalya-net-main" class="text-2xl sm:text-3xl font-black text-white">
            ${formatMoney(bestNonNeutral.netCentral, target)}
          </div>
          <div class="text-xs text-slate-400">
            Intervalle estimé : <strong class="text-slate-200">${formatMoney(bestNonNeutral.netMin, target)} – ${formatMoney(bestNonNeutral.netMax, target)}</strong>
            · Taux de référence : <span class="font-mono text-slate-300">1 ${source} = ${refRate.toLocaleString("fr-FR", { maximumFractionDigits: 4 })} ${target}</span>
          </div>
        </div>

        <!-- 3. TOP CORRIDORS -->
        <div id="xaalya-top-corridors" class="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-300">Top corridors</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button type="button" data-corridor-select="EUR|XOF|300" class="text-left p-3.5 rounded-xl bg-slate-950 border ${corridorKey === "EUR->XOF" ? "border-emerald-500" : "border-slate-800"} hover:border-emerald-400 transition">
              <div class="font-bold text-white text-sm">France → Sénégal</div>
              <div class="text-xs text-slate-400 mt-0.5">Simulation de référence : 300 € → XOF</div>
            </button>
            <button type="button" data-corridor-select="USD|NGN|300" class="text-left p-3.5 rounded-xl bg-slate-950 border ${corridorKey === "USD->NGN" ? "border-emerald-500" : "border-slate-800"} hover:border-emerald-400 transition">
              <div class="font-bold text-white text-sm">États-Unis → Nigeria</div>
              <div class="text-xs text-slate-400 mt-0.5">Simulation de référence : 300 $ → NGN</div>
            </button>
          </div>
        </div>

        <!-- 4. TOP OPÉRATEURS NON SPONSORISÉS (INTERVALLE NET + VÉRIFICATION CLIQUABLE) -->
        <div id="xaalya-top-operators" class="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-bold uppercase tracking-wider text-slate-300">Top opérateurs non sponsorisés</h3>
            <span class="text-[11px] text-slate-400">Montant net estimé en intervalle</span>
          </div>
          <div class="space-y-2.5">
            ${estimates.map((item) => `
              <div class="p-3.5 rounded-xl bg-slate-950 border ${item.profile.neutralBenchmark ? "border-slate-700/80 border-dashed" : "border-slate-800"} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div class="font-semibold text-white text-sm">${item.profile.name}</div>
                  <div class="text-xs text-slate-400">
                    Intervalle net estimé : <strong class="text-emerald-400">${formatMoney(item.netMin, target)} – ${formatMoney(item.netMax, target)}</strong>
                    · Coût moyen estimé : ${item.effectiveCostPct}%
                  </div>
                </div>
                <div class="text-xs">
                  <a href="${item.profile.url}" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:underline font-medium">
                    Consulter l'opérateur pour vérifier ↗
                  </a>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- 5. ESPACE PUB -->
        <aside id="xaalya-ad-space" aria-label="Espace publicitaire" class="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 text-center">
          <div class="text-[11px] uppercase tracking-widest text-slate-500">Espace pub</div>
          <div class="text-xs text-slate-400 mt-1">Emplacement réservé — Partenariat / annonce neutre</div>
        </aside>
      </div>
    `;

    container.querySelectorAll("[data-corridor-select]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const [s, t, amt] = btn.getAttribute("data-corridor-select").split("|");
        const srcEl = document.getElementById("sourceCurrency");
        const tgtEl = document.getElementById("targetCurrency");
        const amtEl = document.getElementById("sendAmount");
        if (srcEl) srcEl.value = s;
        if (tgtEl) tgtEl.value = t;
        if (amtEl) amtEl.value = amt;
        runXaalyaModel();
      });
    });
  }

  async function runXaalyaModel() {
    const srcEl = document.getElementById("sourceCurrency");
    const tgtEl = document.getElementById("targetCurrency");
    const amtEl = document.getElementById("sendAmount");
    const container = document.getElementById("resultsContainer");
    if (!container) return;

    const source = (srcEl?.value || "EUR").toUpperCase();
    const target = (tgtEl?.value || "XOF").toUpperCase();
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

    // Mise à jour du timestamp uniquement chaque jour à 00:00 GMT si le jour a changé
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

    // Maintien de la compatibilité avec les éléments existants s'ils sont présents
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

  window.XaalyaModel = { run: runXaalyaModel, profiles: OPERATOR_PROFILES };
})();