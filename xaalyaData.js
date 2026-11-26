/* xaalyaData.js — Socle de donnees & reperes bancaires / SWIFT pour XaalyaData */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.XaalyaData = api;
  }
})(typeof window !== "undefined" ? window : this, function () {
  const FIXED_CFA_PER_EUR = 655.957;

  const SWIFT_BENCHMARKS = {
    "EUR->XOF": {
      corridor: "EUR->XOF",
      label: "Banques / SWIFT (Repere interbancaire)",
      baseCostRatio: 0.062,
      spreadHalfWidth: 0.015,
      fixedFeeHint: "15 EUR - 35 EUR (frais emetteur + correspondants)",
      settlementDays: "2 a 5 jours ouvres"
    },
    "EUR->XAF": {
      corridor: "EUR->XAF",
      label: "Banques / SWIFT (Repere interbancaire)",
      baseCostRatio: 0.064,
      spreadHalfWidth: 0.015,
      fixedFeeHint: "15 EUR - 35 EUR (frais emetteur + correspondants)",
      settlementDays: "2 a 5 jours ouvres"
    },
    "USD->NGN": {
      corridor: "USD->NGN",
      label: "Banques / SWIFT (Repere interbancaire)",
      baseCostRatio: 0.072,
      spreadHalfWidth: 0.020,
      fixedFeeHint: "20 USD - 45 USD (correspondants et change)",
      settlementDays: "2 a 5 jours ouvres"
    },
    "GBP->NGN": {
      corridor: "GBP->NGN",
      label: "Banques / SWIFT (Repere interbancaire)",
      baseCostRatio: 0.074,
      spreadHalfWidth: 0.021,
      fixedFeeHint: "15 GBP - 35 GBP (correspondants et liquidite NGN)",
      settlementDays: "2 a 5 jours ouvres"
    },
    "USD->XOF": {
      corridor: "USD->XOF",
      label: "Banques / SWIFT (Repere interbancaire)",
      baseCostRatio: 0.066,
      spreadHalfWidth: 0.016,
      fixedFeeHint: "20 USD - 40 USD (correspondants et change EUR/USD)",
      settlementDays: "2 a 5 jours ouvres"
    },
    "GBP->XOF": {
      corridor: "GBP->XOF",
      label: "Banques / SWIFT (Repere interbancaire)",
      baseCostRatio: 0.067,
      spreadHalfWidth: 0.017,
      fixedFeeHint: "15 GBP - 35 GBP (correspondants et change EUR/GBP)",
      settlementDays: "2 a 5 jours ouvres"
    },
    "EUR->MAD": {
      corridor: "EUR->MAD",
      label: "Banques / SWIFT (Repere interbancaire)",
      baseCostRatio: 0.056,
      spreadHalfWidth: 0.014,
      fixedFeeHint: "15 EUR - 30 EUR (frais emetteur + correspondants)",
      settlementDays: "2 a 4 jours ouvres"
    },
    "USD->KES": {
      corridor: "USD->KES",
      label: "Banques / SWIFT (Repere interbancaire)",
      baseCostRatio: 0.066,
      spreadHalfWidth: 0.016,
      fixedFeeHint: "20 USD - 40 USD (correspondants et change)",
      settlementDays: "2 a 5 jours ouvres"
    },
    "GBP->GHS": {
      corridor: "GBP->GHS",
      label: "Banques / SWIFT (Repere interbancaire)",
      baseCostRatio: 0.075,
      spreadHalfWidth: 0.022,
      fixedFeeHint: "15 GBP - 35 GBP (correspondants et liquidite GHS)",
      settlementDays: "2 a 5 jours ouvres"
    },
    "EUR->ZAR": {
      corridor: "EUR->ZAR",
      label: "Banques / SWIFT (Repere interbancaire)",
      baseCostRatio: 0.052,
      spreadHalfWidth: 0.013,
      fixedFeeHint: "15 EUR - 30 EUR (frais emetteur + correspondants)",
      settlementDays: "1 a 4 jours ouvres"
    },
    "USD->TZS": {
      corridor: "USD->TZS",
      label: "Banques / SWIFT (Repere interbancaire)",
      baseCostRatio: 0.070,
      spreadHalfWidth: 0.018,
      fixedFeeHint: "20 USD - 40 USD (correspondants et change)",
      settlementDays: "2 a 5 jours ouvres"
    },
    "USD->UGX": {
      corridor: "USD->UGX",
      label: "Banques / SWIFT (Repere interbancaire)",
      baseCostRatio: 0.069,
      spreadHalfWidth: 0.018,
      fixedFeeHint: "20 USD - 40 USD (correspondants et change)",
      settlementDays: "2 a 5 jours ouvres"
    },
    "EUR->RWF": {
      corridor: "EUR->RWF",
      label: "Banques / SWIFT (Repere interbancaire)",
      baseCostRatio: 0.068,
      spreadHalfWidth: 0.017,
      fixedFeeHint: "15 EUR - 35 EUR (correspondants et change)",
      settlementDays: "2 a 5 jours ouvres"
    }
  };

  const DEFAULT_SWIFT_BENCHMARK = {
    corridor: "DEFAULT",
    label: "Banques / SWIFT (Repere interbancaire)",
    baseCostRatio: 0.068,
    spreadHalfWidth: 0.018,
    fixedFeeHint: "Variable selon banque et correspondants",
    settlementDays: "2 a 5 jours ouvres"
  };

  function extractCurrencyCode(rawVal) {
    if (!rawVal) return "";
    const match = String(rawVal).toUpperCase().match(/\b[A-Z]{3}\b/);
    return match ? match[0] : String(rawVal).trim().toUpperCase();
  }

  function getReferenceRate(source, target, ratesData) {
    const src = extractCurrencyCode(source) || "EUR";
    const tgt = extractCurrencyCode(target) || "XOF";
    if (src === tgt) return 1;
    if (src === "EUR" && (tgt === "XOF" || tgt === "XAF")) {
      return FIXED_CFA_PER_EUR;
    }

    const ratesObj = ratesData && typeof ratesData.rates === "object" ? ratesData.rates : null;
    if (ratesObj) {
      const baseCode = extractCurrencyCode(ratesData.base || "EUR") || "EUR";
      const srcRate = src === baseCode ? 1 : Number(ratesObj[src]);
      const tgtRate = tgt === baseCode ? 1 : Number(ratesObj[tgt]);
      if (Number.isFinite(srcRate) && srcRate > 0 && Number.isFinite(tgtRate) && tgtRate > 0) {
        return tgtRate / srcRate;
      }
    }

    return 1;
  }

  function getSwiftBenchmark(corridorKey) {
    return SWIFT_BENCHMARKS[corridorKey] || {
      ...DEFAULT_SWIFT_BENCHMARK,
      corridor: corridorKey || "DEFAULT"
    };
  }

  function computeBankBenchmark({ source, target, amount, ratesData, bestConsumerNet = null }) {
    const src = extractCurrencyCode(source) || "EUR";
    const tgt = extractCurrencyCode(target) || "XOF";
    const amt = Math.max(1, Number(amount || 0));
    const corridorKey = `${src}->${tgt}`;
    const bench = getSwiftBenchmark(corridorKey);
    const refRate = getReferenceRate(src, tgt, ratesData);

    const sizeFactor = Math.max(0.7, Math.min(1.2, 500 / Math.max(1, amt)));
    const effectiveCostRatio = Math.max(0.015, Math.min(0.25, bench.baseCostRatio * sizeFactor));

    const netCentral = amt * refRate * (1 - effectiveCostRatio);
    const netMin = amt * refRate * (1 - Math.min(0.30, effectiveCostRatio + bench.spreadHalfWidth));
    const netMax = amt * refRate * (1 - Math.max(0.005, effectiveCostRatio - bench.spreadHalfWidth));

    const deltaVsBestConsumer =
      typeof bestConsumerNet === "number" && Number.isFinite(bestConsumerNet)
        ? bestConsumerNet - netCentral
        : null;

    return {
      corridor: corridorKey,
      source: src,
      target: tgt,
      amount: amt,
      refRate,
      label: bench.label,
      effectiveCostPct: Number((effectiveCostRatio * 100).toFixed(2)),
      netCentral,
      netMin,
      netMax,
      deltaVsBestConsumer,
      fixedFeeHint: bench.fixedFeeHint,
      settlementDays: bench.settlementDays
    };
  }

  
  function buildFxSnapshot({ source, target, ratesData, amount = 1000 }) {
    const src = extractCurrencyCode(source) || "EUR";
    const tgt = extractCurrencyCode(target) || "XOF";
    const pivotCurrency = extractCurrencyCode(ratesData && ratesData.base) || "EUR";
    const ratesObj = ratesData && typeof ratesData.rates === "object" ? ratesData.rates : {};

    const pivotToSourceRate = src === pivotCurrency
      ? 1
      : (Number.isFinite(Number(ratesObj[src])) && Number(ratesObj[src]) > 0 ? Number(ratesObj[src]) : null);

    const pivotToTargetRate = tgt === pivotCurrency
      ? 1
      : (Number.isFinite(Number(ratesObj[tgt])) && Number(ratesObj[tgt]) > 0 ? Number(ratesObj[tgt]) : null);

    const midMarketCrossRate = getReferenceRate(src, tgt, ratesData);
    const hasRatesPayload = Boolean(ratesData && typeof ratesData.rates === "object");
    const rateSourceLabel = ratesData && ratesData.source
      ? String(ratesData.source)
      : (hasRatesPayload ? "rates.json / fallback" : "fallback");
    const timestamp = ratesData && (ratesData.timestamp || ratesData.updatedAt || ratesData.date)
      ? String(ratesData.timestamp || ratesData.updatedAt || ratesData.date)
      : null;

    const bench = computeBankBenchmark({ source: src, target: tgt, amount, ratesData });
    const impliedNetRate = amount > 0 ? bench.netCentral / amount : midMarketCrossRate;
    const spreadRatio = midMarketCrossRate > 0 ? (midMarketCrossRate - impliedNetRate) / midMarketCrossRate : 0;
    const spreadPct = Number((spreadRatio * 100).toFixed(2));
    const spreadBps = Math.round(spreadRatio * 10000);

    return {
      pivotCurrency,
      source: src,
      target: tgt,
      pivotToSourceRate,
      pivotToTargetRate,
      midMarketCrossRate,
      impliedNetRate,
      spreadPct,
      spreadBps,
      rateSourceLabel,
      timestamp
    };
  }

  function buildDegressivityCurve({ source, target, ratesData, tiers = [500, 1000, 5000, 10000] }) {
    const src = extractCurrencyCode(source) || "EUR";
    const tgt = extractCurrencyCode(target) || "XOF";
    const midRate = getReferenceRate(src, tgt, ratesData);

    return tiers.map((tierAmount) => {
      const b = computeBankBenchmark({
        source: src,
        target: tgt,
        amount: tierAmount,
        ratesData
      });
      const impliedRate = tierAmount > 0 ? b.netCentral / tierAmount : midRate;
      const spreadBps = midRate > 0 ? Math.round(((midRate - impliedRate) / midRate) * 10000) : 0;
      return {
        amount: tierAmount,
        effectiveCostPct: b.effectiveCostPct,
        spreadBps,
        netCentral: b.netCentral
      };
    });
  }

  
  const CORRIDOR_PROFILES = {
    "EUR->XOF": {
      fxRegime: "Parité fixe (Zone CFA — 655,957 XOF/EUR)",
      payoutMethods: ["Mobile Money", "Compte bancaire", "Cash pickup"],
      digitalCostFactor: 0.34,
      digitalSettlement: "Instantané à 24 h ouvrées"
    },
    "EUR->XAF": {
      fxRegime: "Parité fixe (Zone CEMAC — 655,957 XAF/EUR)",
      payoutMethods: ["Compte bancaire", "Mobile Money", "Cash pickup"],
      digitalCostFactor: 0.38,
      digitalSettlement: "Instantané à 24 h ouvrées"
    },
    "USD->NGN": {
      fxRegime: "Change flottant / liquidité locale NGN",
      payoutMethods: ["Compte bancaire", "Mobile wallet", "Cash pickup"],
      digitalCostFactor: 0.42,
      digitalSettlement: "Quelques minutes à 1 jour ouvré"
    },
    "GBP->NGN": {
      fxRegime: "Change flottant / liquidité locale NGN",
      payoutMethods: ["Compte bancaire", "Mobile wallet", "Cash pickup"],
      digitalCostFactor: 0.42,
      digitalSettlement: "Quelques minutes à 1 jour ouvré"
    },
    "USD->XOF": {
      fxRegime: "Croisé USD/EUR + parité fixe XOF",
      payoutMethods: ["Mobile Money", "Compte bancaire", "Cash pickup"],
      digitalCostFactor: 0.38,
      digitalSettlement: "Instantané à 24 h ouvrées"
    },
    "GBP->XOF": {
      fxRegime: "Croisé GBP/EUR + parité fixe XOF",
      payoutMethods: ["Mobile Money", "Compte bancaire", "Cash pickup"],
      digitalCostFactor: 0.38,
      digitalSettlement: "Instantané à 24 h ouvrées"
    },
    "EUR->MAD": {
      fxRegime: "Panier géré (EUR/USD) — MAD",
      payoutMethods: ["Compte bancaire", "Cash pickup", "Wallet"],
      digitalCostFactor: 0.36,
      digitalSettlement: "Instantané à 24 h ouvrées"
    },
    "USD->KES": {
      fxRegime: "Change flottant géré — KES",
      payoutMethods: ["Mobile Money (M-Pesa)", "Compte bancaire", "Cash pickup"],
      digitalCostFactor: 0.35,
      digitalSettlement: "Instantané à 24 h ouvrées"
    },
    "GBP->GHS": {
      fxRegime: "Change flottant / liquidité locale GHS",
      payoutMethods: ["Mobile Money", "Compte bancaire", "Cash pickup"],
      digitalCostFactor: 0.44,
      digitalSettlement: "Quelques minutes à 1 jour ouvré"
    },
    "EUR->ZAR": {
      fxime: "Change flottant liquide — ZAR",
      payoutMethods: ["Compte bancaire", "Instant EFT / Wallet"],
      digitalCostFactor: 0.33,
      digitalSettlement: "Instantané à 24 h ouvrées"
    },
    "USD->TZS": {
      fxRegime: "Change flottant — TZS",
      payoutMethods: ["Mobile Money", "Compte bancaire", "Cash pickup"],
      digitalCostFactor: 0.39,
      digitalSettlement: "Instantané à 24 h ouvrées"
    },
    "USD->UGX": {
      fxRegime: "Change flottant — UGX",
      payoutMethods: ["Mobile Money", "Compte bancaire", "Cash pickup"],
      digitalCostFactor: 0.39,
      digitalSettlement: "Instantané à 24 h ouvrées"
    },
    "EUR->RWF": {
      fxRegime: "Change flottant géré — RWF",
      payoutMethods: ["Mobile Money", "Compte bancaire", "Cash pickup"],
      digitalCostFactor: 0.38,
      digitalSettlement: "Instantané à 24 h ouvrées"
    }
  };

  const DEFAULT_CORRIDOR_PROFILE = {
    fxRegime: "Change de marché / liquidité corridor",
    payoutMethods: ["Compte bancaire", "Mobile Money", "Cash pickup"],
    digitalCostFactor: 0.38,
    digitalSettlement: "Instantané à 24 h ouvrées"
  };

  function getCorridorProfile(corridorKey) {
    const raw = CORRIDOR_PROFILES[corridorKey] || DEFAULT_CORRIDOR_PROFILE;
    return {
      fxRegime: raw.fxRegime || DEFAULT_CORRIDOR_PROFILE.fxRegime,
      payoutMethods: Array.isArray(raw.payoutMethods) ? raw.payoutMethods : DEFAULT_CORRIDOR_PROFILE.payoutMethods,
      digitalCostFactor: typeof raw.digitalCostFactor === "number" ? raw.digitalCostFactor : DEFAULT_CORRIDOR_PROFILE.digitalCostFactor,
      digitalSettlement: raw.digitalSettlement || DEFAULT_CORRIDOR_PROFILE.digitalSettlement
    };
  }

  function buildChannelComparison({ source, target, amount, ratesData }) {
    const src = extractCurrencyCode(source) || "EUR";
    const tgt = extractCurrencyCode(target) || "XOF";
    const amt = Math.max(1, Number(amount || 1000));
    const corridorKey = `${src}->${tgt}`;
    const bench = computeBankBenchmark({ source: src, target: tgt, amount: amt, ratesData });
    const profile = getCorridorProfile(corridorKey);

    const digitalCostRatio = Math.max(0.006, Math.min(0.08, (bench.effectiveCostPct / 100) * profile.digitalCostFactor));
    const digitalEstimatedCostPct = Number((digitalCostRatio * 100).toFixed(2));
    const digitalEstimatedNet = amt * bench.refRate * (1 - digitalCostRatio);

    const deltaVsDigitalPct = Number((bench.effectiveCostPct - digitalEstimatedCostPct).toFixed(2));
    const deltaVsDigitalAmount = digitalEstimatedNet - bench.netCentral;

    return {
      corridor: corridorKey,
      fxRegime: profile.fxRegime,
      payoutMethods: profile.payoutMethods,
      bankEffectiveCostPct: bench.effectiveCostPct,
      bankNetCentral: bench.netCentral,
      bankSettlement: bench.settlementDays,
      digitalEstimatedCostPct,
      digitalEstimatedNet,
      digitalSettlement: profile.digitalSettlement,
      deltaVsDigitalPct,
      deltaVsDigitalAmount
    };
  }

  
  function buildGovernanceMetadata({ source, target, amount, ratesData }) {
    const src = extractCurrencyCode(source) || "EUR";
    const tgt = extractCurrencyCode(target) || "XOF";
    const amt = Math.max(1, Number(amount || 1000));
    const corridorKey = `${src}->${tgt}`;
    const bench = computeBankBenchmark({ source: src, target: tgt, amount: amt, ratesData });
    const sizeFactor = Number(Math.max(0.7, Math.min(1.2, 500 / amt)).toFixed(4));
    const isFallback = Boolean(!ratesData || ratesData.__isFallback === true);
    const freshnessStatus = isFallback ? "fallback" : "live";

    return {
      schemaVersion: "1.3",
      freshnessStatus,
      freshnessLabel: isFallback ? "Repli secours (fallback)" : "En direct (rates.json)",
      privacyMode: "zero-trace",
      modelAssumptions: {
        methodology: "Chow-Lin econometric estimation + SWIFT corridor benchmarks",
        sizeFactor,
        baseCostRatio: bench.effectiveCostPct ? Number((bench.effectiveCostPct / 100 / (sizeFactor || 1)).toFixed(4)) : null,
        fixedCfaPerEur: FIXED_CFA_PER_EUR,
        corridor: corridorKey
      }
    };
  }

  
  function computeAllCorridors({ amount = 1000, ratesData } = {}) {
    const keys = Object.keys(SWIFT_BENCHMARKS || {});
    return keys.map((corridorKey) => {
      const [source, target] = corridorKey.split("->");
      const b = computeBankBenchmark({ source, target, amount, ratesData });
      return {
        corridor: corridorKey,
        source,
        target,
        refRate: b.refRate,
        effectiveCostPct: b.effectiveCostPct,
        netCentral: b.netCentral,
        netMin: b.netMin,
        netMax: b.netMax,
        settlementDays: b.settlementDays,
        fixedFeeHint: b.fixedFeeHint
      };
    });
  }

  return {
    FIXED_CFA_PER_EUR,
    SWIFT_BENCHMARKS,
    extractCurrencyCode,
    getReferenceRate,
    getSwiftBenchmark,
    computeBankBenchmark,
    buildFxSnapshot,
    buildDegressivityCurve,
    getCorridorProfile,
    buildChannelComparison,
    buildGovernanceMetadata,
    computeAllCorridors
  };
});
