// utils/extractDates.js

function extractDates(text) {
  if (!text) {
    return { start: null, end: null, isLive: false };
  }

  const cleanText = text.toLowerCase().trim();
  const now = new Date();

  // Dictionnaire multilingue des mois (Français / Anglais)
  const months = {
    'janv': 0, 'january': 0, 'jan': 0,
    'févr': 1, 'fevr': 1, 'february': 1, 'feb': 1,
    'mars': 2, 'march': 2, 'mar': 2,
    'avril': 3, 'april': 3, 'apr': 3,
    'mai': 4, 'may': 4,
    'juin': 5, 'june': 5, 'jun': 5,
    'juil': 6, 'july': 6, 'jul': 6,
    'août': 7, 'aout': 7, 'august': 7, 'aug': 7,
    'sept': 8, 'september': 8, 'sep': 8,
    'oct': 9, 'october': 9,
    'nov': 10, 'november': 10,
    'déc': 11, 'dec': 11, 'december': 11
  };

  let startDate = new Date(); // Par défaut, début immédiat
  let endDate = null;

  // 1. Recherche d'une date de DÉBUT explicite basée sur les mots-clés ("du", "à partir du", "from")
  const startKeywordRegex = /(?:du|à partir du|depuis|from)\s+(\d{1,2})[\/\-\s]+([a-zéûîäëöç]+|\d{1,2})(?:[\/\-\s]+(\d{4}))?/i;
  const startMatch = cleanText.match(startKeywordRegex);

  if (startMatch) {
    let day = parseInt(startMatch[1], 10);
    let monthInput = startMatch[2];
    let year = startMatch[3] ? parseInt(startMatch[3], 10) : now.getFullYear();

    let month = parseMonth(monthInput, months);
    if (month !== -1) {
      startDate = new Date(year, month, day, 0, 0, 0);
    }
  }

  // 2. Recherche d'une date de FIN explicite basée sur les mots-clés ("jusqu'au", "fin", "until", "expires")
  const endKeywordRegex = /(?:jusqu'au|jusqu'à|fin|until|expires?)\s+(\d{1,2})[\/\-\s]+([a-zéûîäëöç]+|\d{1,2})(?:[\/\-\s]+(\d{4}))?/i;
  const endMatch = cleanText.match(endKeywordRegex);

  if (endMatch) {
    let day = parseInt(endMatch[1], 10);
    let monthInput = endMatch[2];
    let year = endMatch[3] ? parseInt(endMatch[3], 10) : now.getFullYear();

    let month = parseMonth(monthInput, months);
    if (month !== -1) {
      endDate = new Date(year, month, day, 23, 59, 59);
    }
  }

  // 3. Fallback générique si aucun mot-clé de fin n'est détecté mais qu'une date numérique simple existe
  if (!endDate) {
    const numericRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
    const numMatch = cleanText.match(numericRegex);
    if (numMatch) {
      let day = parseInt(numMatch[1], 10);
      let month = parseInt(numMatch[2], 10) - 1;
      let year = parseInt(numMatch[3], 10);
      if (year < 100) year += 2000;
      endDate = new Date(year, month, day, 23, 59, 59);
    }
  }

  // 4. Sécurité de secours : si aucune date de fin n'est trouvée, attribution de 7 jours par défaut
  if (!endDate) {
    endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
  }

  const isLive = now >= startDate && now <= endDate;

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    isLive: isLive
  };
}

function parseMonth(input, monthsDict) {
  if (!isNaN(input)) {
    return parseInt(input, 10) - 1;
  }
  let cleanM = input.toLowerCase().substring(0, 4);
  for (let key in monthsDict) {
    if (cleanM.startsWith(key)) {
      return monthsDict[key];
    }
  }
  return -1;
}

module.exports = { extractDates };