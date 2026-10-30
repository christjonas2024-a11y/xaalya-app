// ============================================================
// XAALYA — TRADUCTIONS PARTAGÉES (16 langues)
// Chargé par toutes les pages du site.
// Pour ajouter une page, ajoutez ses clés (préfixe unique) ici.
// ============================================================

const LANG_CODES = {
  fr: 'fr-FR', zu: 'zu-ZA', ln: 'ln-CD', sn: 'sn-ZW', de: 'de-DE', en: 'en-US',
  ar: 'ar-SA', pt: 'pt-PT', es: 'es-ES', zh: 'zh-CN', it: 'it-IT', sw: 'sw-KE',
  am: 'am-ET', yo: 'yo-NG', ha: 'ha-NG', wo: 'fr-FR'
};

// ============================================================
// TRADUCTIONS DE LA PAGE /notre-modele (préfixe nm_)
// ============================================================
const TRANSLATIONS_MODEL = {
  fr: {
    nm_headerSlogan: "Comparateur indépendant",
    nm_backLink: "← Retour au comparateur",
    nm_h1: "Notre modèle et notre indépendance",
    nm_intro1: "Xaalya compare les opérateurs de transfert d'argent sur le seul critère qui compte pour le bénéficiaire :",
    nm_intro1Strong: " le montant net qu'il reçoit",
    nm_intro1End: ", frais et taux de change inclus. Pour que ce classement ait une valeur, il faut qu'il soit neutre.",
    nm_intro2: "Cette page explique comment nous nous en assurons, ce que nous refusons, et comment vous pouvez le vérifier.",
    nm_lastUpdate: "Dernière mise à jour : 30 octobre 2026.",
    nm_s1_title: "1. Notre modèle, en une phrase",
    nm_s1_p1a: "Xaalya est financé par la",
    nm_s1_p1Strong: " publicité d'annonceurs financiers",
    nm_s1_p1Mid: " — banques, assurances, fintechs d'épargne, acteurs de l'immobilier — et",
    nm_s1_p1Strong2: " jamais par les opérateurs de transfert d'argent",
    nm_s1_p1End: ".",
    nm_s1_p2: "Ces encarts publicitaires sont clairement identifiés « Partenaire », dans la newsletter comme sur le site. Ils ne financent pas le classement : ils financent le temps de recherche, la collecte des taux et la rédaction des comparatifs.",
    nm_s2_title: "2. Ce que nous ne faisons pas",
    nm_s2_intro: "Cette section est la plus importante. Elle énumère les pratiques que nous nous interdisons, et qui sont courantes dans le secteur des comparateurs.",
    nm_s2_1_t: "Nous ne percevons aucune commission d'affiliation des opérateurs.",
    nm_s2_1_d: "Aucun clic sortant, aucune ouverture de compte, aucune transaction ne nous rapporte un centime de la part d'un opérateur de transfert.",
    nm_s2_2_t: "Nous n'acceptons aucune publicité d'un opérateur de transfert.",
    nm_s2_2_d: "Ni encart, ni sponsoring, ni mention — quel que soit le montant proposé. Si un opérateur pouvait acheter de la visibilité chez nous, notre classement deviendrait invérifiable.",
    nm_s2_3_t: "Nous ne vendons aucune position dans un classement.",
    nm_s2_3_d: "Le classement par défaut est généré par ordre décroissant de montant net reçu. Aucun accord commercial ne peut le modifier.",
    nm_s2_4_t: "Nous ne monétisons pas les données personnelles de nos lecteurs.",
    nm_s2_4_d: "Aucune adresse email n'est demandée pour utiliser le comparateur. Aucun outil de tracking (Google Analytics, pixel publicitaire, géolocalisation IP) n'est installé sur ce site.",
    nm_s2_5_t: "Nous ne masquons pas les marges de change derrière des « 0 frais ».",
    nm_s2_5_d: "Notre méthode intègre la marge de change dans le coût total, et nous l'expliquons. Un opérateur qui affiche « 0 € de frais » n'apparaît jamais comme gratuit dans nos tableaux si sa marge de change est élevée.",
    nm_s3_title: "3. Comment le classement est calculé",
    nm_s3_p1a: "Le classement par défaut de chaque corridor repose sur une seule donnée :",
    nm_s3_p1Strong: " le montant net reçu par le bénéficiaire",
    nm_s3_p1End: ", pour un montant envoyé donné.",
    nm_s3_in_title: "Ce qui entre dans le calcul",
    nm_s3_in_1: "Frais affichés par l'opérateur",
    nm_s3_in_2: "Marge de change (écart avec le taux interbancaire)",
    nm_s3_in_3: "Frais de réception, le cas échéant",
    nm_s3_out_title: "Ce qui n'entre pas",
    nm_s3_out_1: "Un accord commercial (il n'y en a aucun)",
    nm_s3_out_2: "La notoriété de l'opérateur",
    nm_s3_out_3: "Le volume de trafic généré",
    nm_s3_out_4: "Le montant de sa dépense publicitaire",
    nm_s3_freqStrong: "Fréquence de mise à jour.",
    nm_s3_freqText: " Les taux sont relevés quotidiennement et les tableaux actualisés. La date du dernier relevé est affichée sous le formulaire de comparaison.",
    nm_s4_title: "4. La séparation entre l'éditorial et le commercial",
    nm_s4_p1: "La rédaction des comparatifs, des fiches opérateur, des guides et des études est indépendante de la fonction commerciale.",
    nm_s4_okStrong: "Ce que l'annonceur valide :",
    nm_s4_okText: " son encart, son visuel, son texte, son lien. C'est tout.",
    nm_s4_noStrong: "Ce qu'il ne valide pas :",
    nm_s4_noText: " le classement, la note d'un opérateur, le contenu d'une étude.",
    nm_s4_p2: "Les emplacements publicitaires ne figurent jamais à l'intérieur d'un tableau de comparaison, ni au-dessus du classement, ni dans un bloc de données chiffrées.",
    nm_s5_title: "5. Les erreurs et les corrections",
    nm_s5_p1: "Un comparateur qui prétend ne jamais se tromper n'est pas crédible. Les taux changent, les plafonds évoluent, les opérateurs modifient leurs grilles.",
    nm_s5_li1: "Toute erreur signalée est vérifiée sous 5 jours ouvrés.",
    nm_s5_li2: "Lorsqu'elle est confirmée, elle est corrigée et la correction est datée et visible.",
    nm_s5_li3: "Les corrections substantielles sont mentionnées dans nos publications.",
    nm_s5_report: "Pour signaler une erreur :",
    nm_s6_title: "6. Comment vérifier ce que nous affirmons",
    nm_s6_intro: "Nous ne demandons pas d'être crus sur parole. Chacun des engagements ci-dessus est vérifiable :",
    nm_s6_li1Strong: "Aucun outil de tracking",
    nm_s6_li1: " : ouvrez la console de votre navigateur (F12), onglet « Réseau ». Les seules requêtes externes sont le CDN Tailwind et votre fichier de taux. Aucun appel vers Google Analytics, aucun appel de géolocalisation IP.",
    nm_s6_li2Strong: "Aucun formulaire de capture d'email",
    nm_s6_li2: " : le comparateur fonctionne sans inscription, sans adresse email, sans compte.",
    nm_s6_li3Strong: "Aucun lien d'affiliation",
    nm_s6_li3: " : les liens sortants vers les opérateurs ne contiennent aucun paramètre de tracking affilié.",
    nm_s6_li4Strong: "Aucune publicité d'opérateur",
    nm_s6_li4: " : si un encart apparaît un jour sur le site, il sera identifié « Partenaire » et ne concernera jamais un opérateur de transfert.",
    nm_s7_title: "7. Questions fréquentes",
    nm_s7_q1: "Pourquoi ne pas accepter la publicité des opérateurs, si elle est identifiée ?",
    nm_s7_a1: "Parce que l'identification ne suffit pas. Un opérateur qui paie pour être présent chez nous, même dans un encart identifié, crée une relation commerciale qui rend le classement suspect. Notre valeur pour les lecteurs — et pour les annonceurs qui nous font confiance — repose précisément sur l'absence de cette relation.",
    nm_s7_q2: "Comment vivez-vous si les opérateurs ne paient pas ?",
    nm_s7_a2: "Par la publicité d'annonceurs financiers qui ne sont pas des opérateurs de transfert : banques, assurances, fintechs d'épargne, acteurs de l'immobilier. Ces acteurs ont intérêt à ce que l'audience de Xaalya existe et fasse confiance au média — pas à ce qu'un opérateur y soit favorisé.",
    nm_s7_q3: "Que se passe-t-il si un opérateur propose une somme importante ?",
    nm_s7_a3: "Nous refusons, et nous le disons. Cette page existe précisément pour rendre ce refus public et vérifiable.",
    nm_s7_q4: "Collectez-vous des données personnelles ?",
    nm_s7_a4: "Aucune. Pas d'adresse email, pas d'IP, pas de cookie de tracking, pas d'outil d'analytics. Le comparateur calcule le montant net directement dans votre navigateur. Seule la préférence de langue et de thème (clair/sombre) est mémorisée, et uniquement dans votre navigateur (localStorage) — jamais transmise à nos serveurs.",
    nm_footer: "Cette page a été mise à jour le 30 octobre 2026. Elle est révisée à chaque changement de modèle économique, et au minimum une fois par an.",
    nm_footerContact: "Contact :"
  },

  en: {
    nm_headerSlogan: "Independent comparator",
    nm_backLink: "← Back to comparator",
    nm_h1: "Our model and our independence",
    nm_intro1: "Xaalya compares money transfer operators on the only criterion that matters to the recipient:",
    nm_intro1Strong: " the net amount they receive",
    nm_intro1End: ", fees and exchange rate included. For that ranking to have value, it must be neutral.",
    nm_intro2: "This page explains how we ensure it, what we refuse, and how you can verify it.",
    nm_lastUpdate: "Last updated: 30 October 2026.",
    nm_s1_title: "1. Our model, in one sentence",
    nm_s1_p1a: "Xaalya is funded by",
    nm_s1_p1Strong: " the advertising of financial advertisers",
    nm_s1_p1Mid: " — banks, insurers, savings fintechs, real estate players — and",
    nm_s1_p1Strong2: " never by money transfer operators",
    nm_s1_p1End: ".",
    nm_s1_p2: "These ads are clearly labelled 'Partner', in the newsletter and on the site. They do not fund the ranking: they fund research time, rate collection and the writing of comparisons.",
    nm_s2_title: "2. What we do not do",
    nm_s2_intro: "This section is the most important. It lists the practices we forbid ourselves, and which are common in the comparison industry.",
    nm_s2_1_t: "We receive no affiliate commission from operators.",
    nm_s2_1_d: "No outbound click, no account opening, no transaction earns us a single cent from a money transfer operator.",
    nm_s2_2_t: "We accept no advertising from a money transfer operator.",
    nm_s2_2_d: "No banner, no sponsorship, no mention — whatever the amount offered. If an operator could buy visibility on our site, our ranking would become unverifiable.",
    nm_s2_3_t: "We sell no position in any ranking.",
    nm_s2_3_d: "The default ranking is generated by descending order of net amount received. No commercial agreement can change it.",
    nm_s2_4_t: "We do not monetise our readers' personal data.",
    nm_s2_4_d: "No email address is required to use the comparator. No tracking tool (Google Analytics, advertising pixel, IP geolocation) is installed on this site.",
    nm_s2_5_t: "We do not hide exchange rate margins behind '0 fees'.",
    nm_s2_5_d: "Our method includes the exchange rate margin in the total cost, and we explain it. An operator advertising '0 fees' never appears as free in our tables if their exchange rate margin is high.",
    nm_s3_title: "3. How the ranking is calculated",
    nm_s3_p1a: "The default ranking of each corridor is based on a single figure:",
    nm_s3_p1Strong: " the net amount received by the recipient",
    nm_s3_p1End: ", for a given amount sent.",
    nm_s3_in_title: "What is included",
    nm_s3_in_1: "Fees displayed by the operator",
    nm_s3_in_2: "Exchange rate margin (difference from the interbank rate)",
    nm_s3_in_3: "Receiving fees, where applicable",
    nm_s3_out_title: "What is not included",
    nm_s3_out_1: "A commercial agreement (there are none)",
    nm_s3_out_2: "The operator's reputation",
    nm_s3_out_3: "The volume of traffic generated",
    nm_s3_out_4: "The amount of their advertising spend",
    nm_s3_freqStrong: "Update frequency.",
    nm_s3_freqText: " Rates are collected daily and tables are updated. The date of the latest collection is displayed under the comparison form.",
    nm_s4_title: "4. Separation between editorial and commercial",
    nm_s4_p1: "The writing of comparisons, operator profiles, guides and studies is independent of the commercial function.",
    nm_s4_okStrong: "What the advertiser approves:",
    nm_s4_okText: " their banner, visual, text, link. That is all.",
    nm_s4_noStrong: "What they do not approve:",
    nm_s4_noText: " the ranking, an operator's rating, the content of a study.",
    nm_s4_p2: "Advertising placements never appear inside a comparison table, above the ranking, or in a block of figures.",
    nm_s5_title: "5. Errors and corrections",
    nm_s5_p1: "A comparator claiming never to be wrong is not credible. Rates change, limits evolve, operators modify their pricing.",
    nm_s5_li1: "Any reported error is verified within 5 business days.",
    nm_s5_li2: "When confirmed, it is corrected and the correction is dated and visible.",
    nm_s5_li3: "Substantial corrections are mentioned in our publications.",
    nm_s5_report: "To report an error:",
    nm_s6_title: "6. How to verify what we claim",
    nm_s6_intro: "We do not ask to be taken at our word. Each of the commitments above is verifiable:",
    nm_s6_li1Strong: "No tracking tools",
    nm_s6_li1: ": open your browser console (F12), 'Network' tab. The only external requests are the Tailwind CDN and your rate file. No calls to Google Analytics, no IP geolocation calls.",
    nm_s6_li2Strong: "No email capture form",
    nm_s6_li2: ": the comparator works without registration, without email address, without an account.",
    nm_s6_li3Strong: "No affiliate links",
    nm_s6_li3: ": outbound links to operators contain no affiliate tracking parameters.",
    nm_s6_li4Strong: "No operator advertising",
    nm_s6_li4: ": if a banner ever appears on the site, it will be labelled 'Partner' and will never concern a money transfer operator.",
    nm_s7_title: "7. Frequently asked questions",
    nm_s7_q1: "Why not accept operator advertising, if it is identified?",
    nm_s7_a1: "Because identification is not enough. An operator paying to be present on our site, even in an identified banner, creates a commercial relationship that makes the ranking suspect. Our value to readers — and to advertisers who trust us — rests precisely on the absence of that relationship.",
    nm_s7_q2: "How do you make a living if operators do not pay?",
    nm_s7_a2: "Through advertising from financial advertisers who are not money transfer operators: banks, insurers, savings fintechs, real estate players. These players have an interest in Xaalya's audience existing and trusting the media — not in an operator being favoured there.",
    nm_s7_q3: "What happens if an operator offers a large sum?",
    nm_s7_a3: "We refuse, and we say so. This page exists precisely to make that refusal public and verifiable.",
    nm_s7_q4: "Do you collect personal data?",
    nm_s7_a4: "None. No email address, no IP, no tracking cookie, no analytics tool. The comparator calculates the net amount directly in your browser. Only language and theme preferences (light/dark) are stored, and only in your browser (localStorage) — never sent to our servers.",
    nm_footer: "This page was updated on 30 October 2026. It is revised with every change in business model, and at least once a year.",
    nm_footerContact: "Contact:"
  }
};

// ============================================================
// FONCTION setLanguage — fusionne les traductions de la page
// courante (TRANSLATIONS) avec celles du modèle (TRANSLATIONS_MODEL)
// ============================================================
function setLanguage(lang, parActionUtilisateur) {
  if (parActionUtilisateur === undefined) parActionUtilisateur = false;

  const pageTrans = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS) ? TRANSLATIONS : {};
  const modelTrans = (typeof TRANSLATIONS_MODEL !== 'undefined' && TRANSLATIONS_MODEL) ? TRANSLATIONS_MODEL : {};

  const fr = Object.assign({}, pageTrans.fr || {}, modelTrans.fr || {});
  const en = Object.assign({}, pageTrans.en || {}, modelTrans.en || {});

  const translations = { fr: fr, en: en };

  Object.keys(pageTrans).forEach(function(code) {
    if (code !== 'fr' && code !== 'en') {
      translations[code] = Object.assign({}, fr, pageTrans[code]);
    }
  });
  Object.keys(modelTrans).forEach(function(code) {
    if (code !== 'fr' && code !== 'en') {
      translations[code] = Object.assign({}, translations[code] || en, modelTrans[code]);
    }
  });

  // Fallback : si la langue n'existe pas, prendre l'anglais
  const trad = translations[lang] || translations['en'] || translations['fr'];

  const htmlRoot = document.getElementById('html-root');
  if (htmlRoot) {
    if (lang === 'ar') {
      htmlRoot.setAttribute('dir', 'rtl');
      htmlRoot.setAttribute('lang', 'ar');
    } else {
      htmlRoot.removeAttribute('dir');
      htmlRoot.setAttribute('lang', lang || 'en');
    }
  }

  const selectLang = document.getElementById('language-select');
  if (selectLang) selectLang.value = lang || 'en';

  document.querySelectorAll('[data-i18n]').forEach(function(elem) {
    const key = elem.getAttribute('data-i18n');
    if (trad[key] !== undefined) {
      elem.textContent = trad[key];
    }
  });

  if (parActionUtilisateur) {
    try { localStorage.setItem('xaalya_lang_manual', lang); } catch (e) {}
  }

  if (typeof mettreAJourTitreHero === 'function') {
    try { mettreAJourTitreHero(); } catch (e) {}
  }

  if (typeof catalogueCorridors !== 'undefined' && catalogueCorridors.length > 0) {
    if (typeof afficherComparaison === 'function') {
      try { afficherComparaison(); } catch (e) {}
    }
  }
}

// ============================================================
// DÉTECTION AUTOMATIQUE — fallback anglais
// ============================================================
async function detecterLangueParDefaut() {
  let langueEnregistree = null;
  try { langueEnregistree = localStorage.getItem('xaalya_lang_manual'); } catch (e) {}

  if (langueEnregistree) {
    setLanguage(langueEnregistree, false);
    return;
  }

  const navLangs = navigator.languages || [navigator.language || 'en'];
  let langueDetectee = 'en';  // ← fallback ANGLAIS (au lieu de français)

  for (let i = 0; i < navLangs.length; i++) {
    const c = (navLangs[i] || '').toLowerCase();
    if (c.startsWith('zu')) { langueDetectee = 'zu'; break; }
    if (c.startsWith('ln')) { langueDetectee = 'ln'; break; }
    if (c.startsWith('sn')) { langueDetectee = 'sn'; break; }
    if (c.startsWith('de')) { langueDetectee = 'de'; break; }
    if (c.startsWith('zh')) { langueDetectee = 'zh'; break; }
    if (c.startsWith('it')) { langueDetectee = 'it'; break; }
    if (c.startsWith('es')) { langueDetectee = 'es'; break; }
    if (c.startsWith('pt')) { langueDetectee = 'pt'; break; }
    if (c.startsWith('ar')) { langueDetectee = 'ar'; break; }
    if (c.startsWith('en')) { langueDetectee = 'en'; break; }
    if (c.startsWith('sw')) { langueDetectee = 'sw'; break; }
    if (c.startsWith('am')) { langueDetectee = 'am'; break; }
    if (c.startsWith('yo')) { langueDetectee = 'yo'; break; }
    if (c.startsWith('ha')) { langueDetectee = 'ha'; break; }
    if (c.startsWith('wo')) { langueDetectee = 'wo'; break; }
    if (c.startsWith('fr')) { langueDetectee = 'fr'; break; }
  }

  setLanguage(langueDetectee, false);
}