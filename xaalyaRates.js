/* xaalyaRates.js — Modèle net journalier (00:00 GMT), taux croisés rates.json & 5 colonnes */
(function () {
  const FIXED_CFA_PER_EUR = 655.957;

  const OPERATOR_PROFILES = [
    { id: "nala", name: "Nala", category: "digital", costOffset: -0.0025, neutralBenchmark: false, url: "https://www.nala.com/" },
    { id: "sendwave", name: "Sendwave", category: "digital", costOffset: -0.0018, neutralBenchmark: false, url: "https://www.sendwave.com/fr" },
    { id: "taptap", name: "Taptap Send", category: "digital", costOffset: -0.0012, neutralBenchmark: false, url: "https://www.taptapsend.com/" },
    { id: "lemfi", name: "Lemfi", category: "digital", costOffset: 0.0000, neutralBenchmark: false, url: "https://lemfi.com/" },
    { id: "paysend", name: "Paysend", category: "digital", costOffset: 0.0012, neutralBenchmark: false, url: "https://paysend.com/" },
    { id: "wise", name: "Wise", category: "digital", costOffset: 0.0020, neutralBenchmark: false, url: "https://wise.com/fr/send-money/" },
    { id: "remitly", name: "Remitly", category: "digital", costOffset: 0.0028, neutralBenchmark: false, url: "https://www.remitly.com/fr/home" },
    { id: "worldremit", name: "WorldRemit", category: "digital", costOffset: 0.0035, neutralBenchmark: false, url: "https://www.worldremit.com/fr" },
    { id: "wu", name: "Western Union", category: "traditional", costOffset: -0.0030, neutralBenchmark: false, url: "https://www.westernunion.com/fr/fr/web/send-money.html" },
    { id: "mg", name: "MoneyGram", category: "traditional", costOffset: 0.0000, neutralBenchmark: false, url: "https://www.moneygram.com/m/fr/fr/send.html" },
    { id: "ria", name: "Ria Money Transfer", category: "traditional", costOffset: 0.0025, neutralBenchmark: false, url: "https://www.riamoneytransfer.com/fr/fr/" }
  ];

  const CORRIDOR_PRIORS = {
    "EUR->XOF": {
      baseCostByCat: { mobile: 0.004, digital: 0.0055, traditional: 0.032, bank_benchmark: 0.055 },
      spreadHalfWidth: { mobile: 0.002, digital: 0.003, traditional: 0.008, bank_benchmark: 0.012 }
    },
    "EUR->XAF": {
      baseCostByCat: { mobile: 0.0045, digital: 0.006, traditional: 0.033, bank_benchmark: 0.056 },
      spreadHalfWidth: { mobile: 0.002, digital: 0.003, traditional: 0.008, bank_benchmark: 0.012 }
    },
    "GBP->XOF": {
      baseCostByCat: { mobile: 0.007, digital: 0.009, traditional: 0.036, bank_benchmark: 0.058 },
      spreadHalfWidth: { mobile: 0.003, digital: 0.004, traditional: 0.009, bank_benchmark: 0.013 }
    },
    "GBP->XAF": {
      baseCostByCat: { mobile: 0.0075, digital: 0.0095, traditional: 0.037, bank_benchmark: 0.059 },
      spreadHalfWidth: { mobile: 0.003, digital: 0.004, traditional: 0.009, bank_benchmark: 0.013 }
    },
    "USD->XOF": {
      baseCostByCat: { mobile: 0.008, digital: 0.010, traditional: 0.038, bank_benchmark: 0.060 },
      spreadHalfWidth: { mobile: 0.003, digital: 0.004, traditional: 0.009, bank_benchmark: 0.013 }
    },
    "USD->XAF": {
      baseCostByCat: { mobile: 0.0085, digital: 0.0105, traditional: 0.039, bank_benchmark: 0.061 },
      spreadHalfWidth: { mobile: 0.003, digital: 0.004, traditional: 0.009, bank_benchmark: 0.013 }
    },
    "CAD->XOF": {
      baseCostByCat: { mobile: 0.009, digital: 0.011, traditional: 0.040, bank_benchmark: 0.062 },
      spreadHalfWidth: { mobile: 0.003, digital: 0.0045, traditional: 0.010, bank_benchmark: 0.014 }
    },
    "EUR->NGN": {
      baseCostByCat: { mobile: 0.009, digital: 0.011, traditional: 0.042, bank_benchmark: 0.068 },
      spreadHalfWidth: { mobile: 0.004, digital: 0.005, traditional: 0.012, bank_benchmark: 0.016 }
    },
    "GBP->NGN": {
      baseCostByCat: { mobile: 0.0085, digital: 0.0105, traditional: 0.041, bank_benchmark: 0.067 },
      spreadHalfWidth: { mobile: 0.004, digital: 0.005, traditional: 0.012, bank_benchmark: 0.016 }
    },
    "USD->NGN": {
      baseCostByCat: { mobile: 0.010, digital: 0.012, traditional: 0.044, bank_benchmark: 0.070 },
      spreadHalfWidth: { mobile: 0.004, digital: 0.006, traditional: 0.013, bank_benchmark: 0.017 }
    },
    "EUR->KES": {
      baseCostByCat: { mobile: 0.008, digital: 0.010, traditional: 0.039, bank_benchmark: 0.063 },
      spreadHalfWidth: { mobile: 0.003, digital: 0.0045, traditional: 0.010, bank_benchmark: 0.014 }
    },
    "GBP->KES": {
      baseCostByCat: { mobile: 0.008, digital: 0.010, traditional: 0.039, bank_benchmark: 0.063 },
      spreadHalfWidth: { mobile: 0.003, digital: 0.0045, traditional: 0.010, bank_benchmark: 0.014 }
    },
    "USD->KES": {
      baseCostByCat: { mobile: 0.0085, digital: 0.0105, traditional: 0.040, bank_benchmark: 0.064 },
      spreadHalfWidth: { mobile: 0.003, digital: 0.005, traditional: 0.011, bank_benchmark: 0.015 }
    },
    "USD->GHS": {
      baseCostByCat: { mobile: 0.010, digital: 0.0125, traditional: 0.043, bank_benchmark: 0.068 },
      spreadHalfWidth: { mobile: 0.004, digital: 0.0055, traditional: 0.012, bank_benchmark: 0.016 }
    },
    "GBP->GHS": {
      baseCostByCat: { mobile: 0.0095, digital: 0.012, traditional: 0.042, bank_benchmark: 0.067 },
      spreadHalfWidth: { mobile: 0.004, digital: 0.0055, traditional: 0.012, bank_benchmark: 0.016 }
    },
    "EUR->GHS": {
      baseCostByCat: { mobile: 0.010, digital: 0.0125, traditional: 0.043, bank_benchmark: 0.068 },
      spreadHalfWidth: { mobile: 0.004, digital: 0.0055, traditional: 0.012, bank_benchmark: 0.016 }
    },
    "EUR->MAD": {
      baseCostByCat: { mobile: 0.007, digital: 0.009, traditional: 0.036, bank_benchmark: 0.058 },
      spreadHalfWidth: { mobile: 0.003, digital: 0.004, traditional: 0.009, bank_benchmark: 0.013 }
    },
    "EUR->TND": {
      baseCostByCat: { mobile: 0.008, digital: 0.010, traditional: 0.038, bank_benchmark: 0.060 },
      spreadHalfWidth: { mobile: 0.003, digital: 0.0045, traditional: 0.010, bank_benchmark: 0.014 }
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
      "EUR->NGN": 1481.5869,
      "USD->NGN": 1348.2454,
      "GBP->NGN": 1778.5089,
      "USD->XOF": 596.9215,
      "USD->XAF": 596.9215,
      "GBP->XOF": 787.4161,
      "GBP->XAF": 787.4161,
      "CAD->XOF": 417.7006,
      "EUR->MAD": 10.9974,
      "EUR->KES": 143.128,
      "GBP->KES": 171.812,
      "USD->KES": 130.2466,
      "EUR->GHS": 12.8845,
      "GBP->GHS": 15.4666,
      "USD->GHS": 11.7249,
      "EUR->TND": 3.32
    };
    return fallbackTable[`${source}->${target}`] || 1;
  }

  function estimateChowLinNetForProfile(profile, amount, refRate, corridorKey, ratesData, daySeed) {
    const prior = CORRIDOR_PRIORS[corridorKey] || {
      baseCostByCat: { mobile: 0.02, digital: 0.028, traditional: 0.052, bank_benchmark: 0.07 },
      spreadHalfWidth: { mobile: 0.006, digital: 0.008, traditional: 0.014, bank_benchmark: 0.018 }
    };

    const sizeFactor = Math.max(0.88, Math.min(1.06, Math.pow(300 / Math.max(1, amount), 0.15)));
    const chowLinAdjustment = Number(ratesData?.chowLinDelta?.[corridorKey]?.[profile.id] || 0);
    const seasonalityWave = Math.sin(((daySeed % 30) / 30) * Math.PI * 2) * 0.002;

    const baseCost = prior.baseCostByCat[profile.category] ?? 0.035;
    const profileOffset = Number(profile.costOffset || 0);
    const netCostRatio = Math.max(
      0.001,
      Math.min(0.25, baseCost * sizeFactor + profileOffset + chowLinAdjustment + seasonalityWave)
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
        <!-- 2. ESTIMATION NETTE XAALYA — CENTRÉ -->
        <div id="xaalya-result-block" class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
          <div class="text-xs font-semibold uppercase tracking-wider text-slate-200">
            ${getRatesI18n().netTitle}
          </div>
<div id="xaalya-net-main" class="text-2xl sm:text-3xl font-black text-emerald-400 pt-1">
            ${formatMoney(bestNonNeutral.netCentral, target)}
          </div>
          <div class="text-xs text-slate-400">
            ${getRatesI18n().refRateLabel} <span class="font-mono text-slate-300">1 ${source} = ${refRate.toLocaleString(getRatesI18n().locale, { maximumFractionDigits: 4 })} ${target}</span>
          </div>
          <p class="text-xs text-emerald-400 pt-1">
            ${getRatesI18n().verifyNotice}
          </p>
        </div>

        <!-- 3. TOP OPÉRATEURS NON SPONSORISÉS (5 COLONNES — LISIBLE MOBILE) -->
        <div id="xaalya-top-operators" class="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 sm:p-5 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">${getRatesI18n().topOpsTitle}</h3>
          </div>
          <div class="overflow-x-auto -mx-1 sm:mx-0">
            <table class="w-full text-left border-collapse text-[11px] sm:text-sm">
              <thead>
                <tr class="border-b border-slate-800 text-slate-400 text-[10px] sm:text-xs uppercase">
                  <th class="py-2 px-1.5 sm:px-3">${getRatesI18n().colOperator}</th>
                  <th class="py-2 px-1.5 sm:px-3">${getRatesI18n().colRange}</th>
                  <th class="py-2 px-1.5 sm:px-3">${getRatesI18n().colCost}</th>
                  <th class="py-2 px-1.5 sm:px-3">${getRatesI18n().colReceive}</th>
                  <th class="py-2 px-1.5 sm:px-3 text-right">${getRatesI18n().colAction}</th>
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
                        ${getRatesI18n().btnSend}
                      </a>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <!-- ESPACE PUB -->
        <aside id="xaalya-ad-space" aria-label="${getRatesI18n().adAria}" class="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 text-center">
          <div class="text-[11px] uppercase tracking-widest text-slate-500">${getRatesI18n().adTitle}</div>
          <div class="text-xs text-slate-400 mt-1">${getRatesI18n().adSub}</div>
        </aside>
      </div>
    `;
  }

  
  const XAALYA_RATES_I18N = {
    fr: {
      locale: "fr-FR",
      netTitle: "Estimation nette Xaalya",
      refRateLabel: "Taux de référence :",
      verifyNotice: "Vérifier auprès des opérateurs avant d'envoyer",
      topOpsTitle: "Top opérateurs non sponsorisés",
      colOperator: "Opérateur",
      colRange: "Intervalle net estimé",
      colCost: "Coût moyen estimé",
      colReceive: "Montant à recevoir estimé",
      colAction: "Action",
      btnSend: "Envoyer",
      adAria: "Espace publicitaire",
      adTitle: "Espace pub",
      adSub: "Emplacement réservé — Partenariat / annonce neutre"
    },
    en: {
      locale: "en-GB",
      netTitle: "Xaalya Net Estimate",
      refRateLabel: "Reference rate:",
      verifyNotice: "Verify with operators before sending",
      topOpsTitle: "Top non-sponsored operators",
      colOperator: "Operator",
      colRange: "Estimated net range",
      colCost: "Estimated avg. cost",
      colReceive: "Estimated amount received",
      colAction: "Action",
      btnSend: "Send",
      adAria: "Advertising space",
      adTitle: "Ad space",
      adSub: "Reserved slot — Neutral partnership / announcement"
    },
    es: {
      locale: "es-ES",
      netTitle: "Estimación neta Xaalya",
      refRateLabel: "Tipo de referencia:",
      verifyNotice: "Verifica con los operadores antes de enviar",
      topOpsTitle: "Principales operadores no patrocinados",
      colOperator: "Operador",
      colRange: "Rango neto estimado",
      colCost: "Coste medio estimado",
      colReceive: "Importe estimado a recibir",
      colAction: "Acción",
      btnSend: "Enviar",
      adAria: "Espacio publicitario",
      adTitle: "Espacio publicitario",
      adSub: "Espacio reservado — Colaboración / anuncio neutral"
    },
    pt: {
      locale: "pt-PT",
      netTitle: "Estimativa líquida Xaalya",
      refRateLabel: "Taxa de referência:",
      verifyNotice: "Verifique com os operadores antes de enviar",
      topOpsTitle: "Principais operadores não patrocinados",
      colOperator: "Operador",
      colRange: "Intervalo líquido estimado",
      colCost: "Custo médio estimado",
      colReceive: "Valor estimado a receber",
      colAction: "Ação",
      btnSend: "Enviar",
      adAria: "Espaço publicitário",
      adTitle: "Espaço publicitário",
      adSub: "Espaço reservado — Parceria / anúncio neutro"
    },
    de: {
      locale: "de-DE",
      netTitle: "Xaalya-Nettoschätzung",
      refRateLabel: "Referenzkurs:",
      verifyNotice: "Vor dem Senden beim Anbieter prüfen",
      topOpsTitle: "Top nicht gesponserte Anbieter",
      colOperator: "Anbieter",
      colRange: "Geschätzter Nettobereich",
      colCost: "Geschätzte Ø-Kosten",
      colReceive: "Geschätzter Empfangsbetrag",
      colAction: "Aktion",
      btnSend: "Senden",
      adAria: "Werbefläche",
      adTitle: "Werbefläche",
      adSub: "Reservierter Platz — Neutrale Partnerschaft / Anzeige"
    },
    it: {
      locale: "it-IT",
      netTitle: "Stima netta Xaalya",
      refRateLabel: "Tasso di riferimento:",
      verifyNotice: "Verifica presso gli operatori prima di inviare",
      topOpsTitle: "Migliori operatori non sponsorizzati",
      colOperator: "Operatore",
      colRange: "Intervallo netto stimato",
      colCost: "Costo medio stimato",
      colReceive: "Importo stimato ricevuto",
      colAction: "Azione",
      btnSend: "Invia",
      adAria: "Spazio pubblicitario",
      adTitle: "Spazio pub",
      adSub: "Spazio riservato — Partnership / annuncio neutrale"
    },
    ar: {
      locale: "en-GB",
      netTitle: "تقدير Xaalya الصافي",
      refRateLabel: "سعر الصرف المرجعي:",
      verifyNotice: "تحقق لدى مزوّدي الخدمة قبل الإرسال",
      topOpsTitle: "أفضل مزوّدي التحويل غير المموّلين",
      colOperator: "المزوّد",
      colRange: "النطاق الصافي المقدّر",
      colCost: "متوسط التكلفة المقدّر",
      colReceive: "المبلغ المقدّر استلامه",
      colAction: "إجراء",
      btnSend: "إرسال",
      adAria: "مساحة إعلانية",
      adTitle: "مساحة إعلانية",
      adSub: "مساحة محجوزة — شراكة أو إعلان محايد"
    },
    zh: {
      locale: "zh-CN",
      netTitle: "Xaalya 净额估算（ 模型）",
      refRateLabel: "参考汇率：",
      verifyNotice: "汇款前请向汇款机构核实",
      topOpsTitle: "热门非赞助汇款机构",
      colOperator: "机构",
      colRange: "预计净收款区间",
      colCost: "预计平均成本",
      colReceive: "预计收款金额",
      colAction: "操作",
      btnSend: "汇款",
      adAria: "广告位",
      adTitle: "广告位",
      adSub: "预留位置 — 中立合作 / 公告"
    },
    sw: {
      locale: "en-GB",
      netTitle: "Makadirio halisi ya Xaalya",
      refRateLabel: "Kiwango cha marejeleo:",
      verifyNotice: "Thibitisha na watoa huduma kabla ya kutuma",
      topOpsTitle: "Watoa huduma bora wasiodhaminiwa",
      colOperator: "Mtoa huduma",
      colRange: "Kiwango halisi kinachokadiriwa",
      colCost: "Gharama ya wastani",
      colReceive: "Kiasi kinachokadiriwa kupokelewa",
      colAction: "Hatua",
      btnSend: "Tuma",
      adAria: "Nafasi ya tangazo",
      adTitle: "Tangazo",
      adSub: "Nafasi iliyohifadhiwa — Ushirikiano / tangazo huru"
    },
    am: {
      locale: "en-GB",
      netTitle: "የXaalya የተጣራ ግምት",
      refRateLabel: "የማጣቀሻ ተመን:",
      verifyNotice: "ከመላክዎ በፊት ከአገልግሎት ሰጪዎች ጋር ያረጋግጡ",
      topOpsTitle: "ያልተደገፉ ዋና አገልግሎት ሰጪዎች",
      colOperator: "አገልግሎት ሰጪ",
      colRange: "የተገመተ የተጣራ ክልል",
      colCost: "አማካይ ወጪ ግምት",
      colReceive: "የሚደርስ መጠን ግምት",
      colAction: "እርምጃ",
      btnSend: "ላክ",
      adAria: "የማስታወቂያ ቦታ",
      adTitle: "ማስታወቂያ",
      adSub: "የተያዘ ቦታ — ገለልተኛ አጋርነት / ማስታወቂያ"
    },
    yo: {
      locale: "en-GB",
      netTitle: "Ìṣírò àpapọ̀ Xaalya",
      refRateLabel: "Oṣùwọ̀n ìtọ́kasí:",
      verifyNotice: "Ṣàyẹ̀wò pẹ̀lú àwọn olùpèsè kí o tó fi ránṣẹ́",
      topOpsTitle: "Àwọn olùpèsè tó dára jù láìní ìpolówó",
      colOperator: "Olùpèsè",
      colRange: "Ìwọ̀n àpapọ̀ tí a fojú bù",
      colCost: "Ìdá iye owó ìnáwó",
      colReceive: "Iye tí a fojú bù pé yóò dé",
      colAction: "Ìgbésẹ̀",
      btnSend: "Fi ránṣẹ́",
      adAria: "Ààyè ìpolówó",
      adTitle: "Ìpolówó",
      adSub: "Ààyè tí a yà sọ́tọ̀ — Ìbáṣepọ̀ / ìkéde"
    },
    ha: {
      locale: "en-GB",
      netTitle: "Ƙididdigar tsantsa ta Xaalya",
      refRateLabel: "Farashin musaya na asali:",
      verifyNotice: "Tabbatar da masu aiko da kuɗi kafin ka tura",
      topOpsTitle: "Manyan masu aiko da kuɗi ba tare da talla ba",
      colOperator: "Mai aiko",
      colRange: "Kewayon tsantsa da aka ƙiyasta",
      colCost: "Matsakaicin farashi",
      colReceive: "Adadin da aka ƙiyasta za a karɓa",
      colAction: "Mataki",
      btnSend: "Tura",
      adAria: "Wurin talla",
      adTitle: "Wurin talla",
      adSub: "Wuri na musamman — Haɗin gwiwa / sanarwa"
    },
    zu: {
      locale: "en-GB",
      netTitle: "Isilinganiso esiphelele se-Xaalya",
      refRateLabel: "Izinga lesithenjwa:",
      verifyNotice: "Qinisekisa nabanikezeli ngaphambi kokuthumela",
      topOpsTitle: "Abanikezeli abaphezulu abangaxhasiwe",
      colOperator: "Umnikezeli",
      colRange: "Ibanga elilinganiselwe",
      colCost: "Izindleko ezilinganiselwe",
      colReceive: "Imali elinganiselwe ezotholwa",
      colAction: "Isenzo",
      btnSend: "Thumela",
      adAria: "Isikhala sesikhangiso",
      adTitle: "Isikhangiso",
      adSub: "Isikhala esigciniwe — Ubambiswano / isimemezelo"
    },
    sn: {
      locale: "en-GB",
      netTitle: "Fungidziro yakachena yeXaalya",
      refRateLabel: "Mutengo wekuyera:",
      verifyNotice: "Ongorora nevanotumira mari usati watumira",
      topOpsTitle: "Vanotumira mari vakasarudzika vasina kushambadzwa",
      colOperator: "Mutumiri",
      colRange: "Huwandu hunofungidzirwa",
      colCost: "Mutengo wepakati unofungidzirwa",
      colReceive: "Mari inofungidzirwa kugamuchirwa",
      colAction: "Chiito",
      btnSend: "Tumira",
      adAria: "Nzvimbo yekushambadza",
      adTitle: "Shambadziro",
      adSub: "Nzvimbo yakachengeterwa — Kudyidzana / chiziviso"
    },
    ln: {
      locale: "fr-FR",
      netTitle: "Bokaboli ya solo ya Xaalya",
      refRateLabel: "Taux ya référence :",
      verifyNotice: "Tala malamu epai ya ba opérateurs liboso ya kotinda",
      topOpsTitle: "Ba opérateurs minene bazangi sponsor",
      colOperator: "Opérateur",
      colRange: "Motuya ya pɛtɛɛ oyo ekoki kozwa",
      colCost: "Ntalo ya mwayene",
      colReceive: "Mbongo oyo ekoki kokoma",
      colAction: "Mosala",
      btnSend: "Tinda",
      adAria: "Esika ya piblisite",
      adTitle: "Piblisite",
      adSub: "Esika ebombami — Boyokani / liyebisi"
    },
    wo: {
      locale: "fr-FR",
      netTitle: "Nattub Xaalya bu leer",
      refRateLabel: "Nattub wéccoo :",
      verifyNotice: "Seetal ci opérateurs yi bala ngay yónnee",
      topOpsTitle: "Opérateurs yi gën te amul sponsor",
      colOperator: "Opérateur",
      colRange: "Li ñu yaakaar ci xaalis bu mat",
      colCost: "Njàggat bu ñu yaakaar",
      colReceive: "Xaalis bi ñu yaakaar mu jot",
      colAction: "Jëf",
      btnSend: "Yónnee",
      adAria: "Bérabub yégle",
      adTitle: "Yégle",
      adSub: "Bérab bu ñu téye — Lëkkaloo / yégle"
    }
  };

  function getRatesI18n() {
    const sel = document.getElementById("language-select");
    const raw = (sel && sel.value) || localStorage.getItem("xaalya-lang") || document.documentElement.lang || "en";
    const code = String(raw).toLowerCase().slice(0, 2);
    return XAALYA_RATES_I18N[code] || XAALYA_RATES_I18N.en;
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
    if (simRateEl) simRateEl.textContent = `1 ${source} = ${refRate.toLocaleString(getRatesI18n().locale, { maximumFractionDigits: 4 })} ${target}`;

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
    const langEl = document.getElementById("language-select");
    if (langEl) {
      langEl.addEventListener("change", () => setTimeout(runXaalyaModel, 0));
    }
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
