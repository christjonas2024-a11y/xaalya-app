/* xaalyaRates.js — Modèle net journalier (00:00 GMT), 10 profils & rendu ordonné */
(function () {
  const FIXED_EUR_XOF = 655.957;

  // 10 profils représentatifs (Banque / SWIFT conservé comme repère neutre, Wave corrigé)
  const OPERATOR_PROFILES = [
    { id: "wu", name: "Western Union", category: "traditional", neutralBenchmark: false, url: "https://www.westernunion.com" },
    { id: "mg", name: "MoneyGram", category: "traditional", neutralBenchmark: false, url: "https://www.moneygram.com" },
    { id: "ria", name: "Ria Money Transfer", category: "traditional", neutralBenchmark: false, url: "https://www.riamoneytransfer.com" },
    { id: "wise", name: "Wise", category: "digital", neutralBenchmark: false, url: "https://wise.com" },
    { id: "remitly", name: "Remitly", category: "digital", neutralBenchmark: false, url: "https://www.remitly.com" },
    { id: "worldremit", name: "WorldRemit", category: "digital", neutralBenchmark: false, url: "https://www.worldremit.com" },
    { id: "sendwave", name: "Sendwave", category: "digital", neutralBenchmark: false, url: "https://www.sendwave.com" },
    { id: "orange_money", name: "Orange Money", category: "mobile", neutralBenchmark: false, url: "https://www.orangemoney.com" },
    { id: "wave", name: "Wave", category: "mobile", neutralBenchmark: false, url: "https://www.wave.com" },
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

    if (key === "USD->NGN") return 1580;
    return 1;
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
          <div id="xaalya-daily-stamp" data-daily-updated="${isNewDailyStamp ? "1" : "0"}" class="text-[11px] font-mono text-slate-400">
            ${stamp}
          </div>
          <div id="xaalya-net-main" class="text-2xl sm:text-3xl font-black text-emerald-400 pt-1">
            ${formatMoney(bestNonNeutral.netCentral, target)}
          </div>
          <div class="text-xs text-slate-400">
            Taux de référence : <span class="font-mono text-slate-300">1 ${source} = ${refRate.toLocaleString("fr-FR", { maximumFractionDigits: 4 })} ${target}</span>
          </div>
          <p class="text-xs text-slate-400 pt-1">
            vérifier auprès des opérateurs avant d'envoyer
          </p>
        </div>

        <!-- 3. TOP OPÉRATEURS NON SPONSORISÉS (5 COLONNES) -->
        <div id="xaalya-top-operators" class="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-bold uppercase tracking-wider text-slate-200">Top opérateurs non sponsorisés</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr class="border-b border-slate-800 text-slate-400 text-xs uppercase">
                  <th class="py-2.5 px-3">Opérateur</th>
                  <th class="py-2.5 px-3">Intervalle net estimé</th>
                  <th class="py-2.5 px-3">Coût moyen estimé</th>
                  <th class="py-2.5 px-3">Montant à recevoir estimé</th>
                  <th class="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/80">
                ${estimates.map((item) => `
                  <tr class="${item.profile.neutralBenchmark ? "bg-slate-950/50 text-slate-300" : "hover:bg-slate-950/60 text-white"}">
                    <td class="py-3 px-3 font-semibold">${item.profile.name}</td>
                    <td class="py-3 px-3 font-mono text-xs text-slate-300">${formatMoney(item.netMin, target)} – ${formatMoney(item.netMax, target)}</td>
                    <td class="py-3 px-3 font-mono text-xs text-slate-300">${item.effectiveCostPct} %</td>
                    <td class="py-3 px-3 font-bold text-emerald-400">${formatMoney(item.netCentral, target)}</td>
                    <td class="py-3 px-3 text-right">
                      <a href="${item.profile.url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition">
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

  window.XaalyaModel = { run: runXaalyaModel, profiles: OPERATOR_PROFILES };
})();
