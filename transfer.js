/**
 * Calcule le montant net reçu et les frais pour un couloir de transfert de manière ultra-sécurisée.
 */
function calculateTransfer({ amountSent, fixedFee, percentageFeeRate, exchangeRate, decimalPlaces = 2 }) {
  // 1. Validation stricte du montant envoyé
  if (typeof amountSent !== "number" || !Number.isFinite(amountSent) || amountSent <= 0 || isNaN(amountSent)) {
    throw new Error("Le montant envoyé doit être un nombre valide supérieur à zéro.");
  }
  
  // 2. Validation stricte des frais (fixes et pourcentage)
  if (
    typeof fixedFee !== "number" || !Number.isFinite(fixedFee) || fixedFee < 0 ||
    typeof percentageFeeRate !== "number" || !Number.isFinite(percentageFeeRate) || percentageFeeRate < 0 || percentageFeeRate >= 1
  ) {
    throw new Error("Les paramètres de frais sont invalides.");
  }

  // 3. Validation stricte du taux de change (doit être un nombre fini strictement positif)
  if (
    typeof exchangeRate !== "number" || 
    !Number.isFinite(exchangeRate) || 
    exchangeRate <= 0 || 
    isNaN(exchangeRate)
  ) {
    throw new Error("Le taux de change doit être strictement supérieur à zéro.");
  }

  // 4. Validation des décimales
  if (
    typeof decimalPlaces !== "number" || 
    !Number.isFinite(decimalPlaces) || 
    decimalPlaces < 0 || 
    decimalPlaces > 6
  ) {
    throw new Error("Le nombre de décimales est invalide.");
  }
  
  const totalFees = fixedFee + (amountSent * percentageFeeRate);
  const effectiveAmount = amountSent - totalFees;
  
  if (effectiveAmount <= 0) {
    throw new Error("Les frais dépassent ou égalent le montant envoyé.");
  }
  
  const rawReceived = effectiveAmount * exchangeRate;
  
  // Protection contre les valeurs infinies ou NaN issues du calcul
  if (!Number.isFinite(rawReceived)) {
    throw new Error("Erreur de calcul critique : résultat non fini.");
  }

  const amountReceived = Number(rawReceived.toFixed(decimalPlaces));
  
  return {
    totalFees: Number(totalFees.toFixed(decimalPlaces)),
    effectiveAmount: Number(effectiveAmount.toFixed(decimalPlaces)),
    amountReceived
  };
}

/**
 * Vérifie si un taux est périmé en fonction d'un seuil de tolérance (en minutes).
 */
function isRateStale(rateTimestamp, maxAgeMinutes = 30) {
  if (
    typeof rateTimestamp !== "number" ||
    !Number.isFinite(rateTimestamp) ||
    typeof maxAgeMinutes !== "number" ||
    !Number.isFinite(maxAgeMinutes) ||
    maxAgeMinutes < 0
  ) {
    return true;
  }

  const ageMs = Date.now() - rateTimestamp;

  if (ageMs < 0) {
    return true;
  }

  return ageMs > maxAgeMinutes * 60 * 1000;
}

/**
 * Calcule plusieurs couloirs en filtrant les taux périmés.
 */
function calculateMultipleCorridors(corridors) {
  if (!Array.isArray(corridors)) {
    return [];
  }

  return corridors.map(corridor => {
    if (isRateStale(corridor?.rateTimestamp, corridor?.maxAgeMinutes ?? 30)) {
      return {
        corridorId: corridor?.id || "UNKNOWN",
        status: "REJECTED_STALE_RATE",
        error: "Taux périmé, offre non disponible"
      };
    }
    
    try {
      const res = calculateTransfer(corridor);
      return {
        corridorId: corridor.id,
        status: "SUCCESS",
        ...res
      };
    } catch (e) {
      return {
        corridorId: corridor.id,
        status: "ERROR",
        error: e.message
      };
    }
  });
}

// Exportation obligatoire pour Jest
module.exports = { calculateTransfer, isRateStale, calculateMultipleCorridors };