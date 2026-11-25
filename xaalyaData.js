/* xaalyaData.js — Socle de données & repères bancaires / SWIFT pour XaalyaData */
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
      label: "Banques / SWIFT (Repère interbancaire)",
      baseCostRatio: 0.062,
      spreadHalfWidth: 0.015,
      fixedFeeHint: "15 € – 35 € (frais émetteur + correspondants)",
      settlementDays: "2 à 5 jours ouvrés"
    },
    "EUR->XAF": {
      corridor: "EUR->XAF",
      label: "Banques / SWIFT (Repère interbancaire)",
      baseCostRatio: 0.064,
      spreadHalfWidth: 0.015,
      fixedFeeHint: "15 € – 35 € (frais émetteur + correspondants)",
      settlementDays: "2 à 5 jours ouvrés"
    },
    "USD->NGN": {
      corridor: "USD->NGN",
      label: "Banques / SWIFT (Repère interbancaire)",
      baseCostRatio: 0.072,
      spreadHalfWidth: 0.020,
      fixedFeeHint: "$20 – $45 (correspondants & change)",
      settlementDays: "2 à 5 jours ouvrés"
    }
  };

  const DEFAULT_SWIFT_BENCHMARK = {
    corridor: "DEFAULT",
    label: "Banques / SWIFT (Repère interbancaire)",
    baseCostRatio: 0.068,
    spreadHalfWidth: 0.018,
    fixedFeeHint: "Variable selon banque et correspondants",
    settlementDays: "2 à 5 jours ouvrés"
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

  return {
    FIXED_CFA_PER_EUR,
    SWIFT_BENCHMARKS,
    extractCurrencyCode,
    getReferenceRate,
    getSwiftBenchmark,
    computeBankBenchmark
  };
});
