/**
 * Calcule le montant net reçu et les frais pour un couloir de transfert.
 */
function calculateTransfer({ amountSent, fixedFee, percentageFeeRate, exchangeRate, decimalPlaces = 2 }) {
  if (amountSent <= 0 || isNaN(amountSent)) {
    throw new Error("Le montant envoyé doit être supérieur à zéro.");
  }
  
  const totalFees = fixedFee + (amountSent * percentageFeeRate);
  const effectiveAmount = amountSent - totalFees;
  
  if (effectiveAmount <= 0) {
    throw new Error("Les frais dépassent ou égalent le montant envoyé.");
  }
  
  const rawReceived = effectiveAmount * exchangeRate;
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

  // Une date future est invalide : ne pas accepter le taux.
  if (ageMs < 0) {
    return true;
  }

  return ageMs > maxAgeMinutes * 60 * 1000;
}

/**
 * Calcule plusieurs couloirs en filtrant les taux périmés.
 */
function calculateMultipleCorridors(corridors) {
  return corridors.map(corridor => {
    // Utilisation de l'opérateur ?? pour préserver un seuil personnalisé égal à zéro
    if (isRateStale(corridor.rateTimestamp, corridor.maxAgeMinutes ?? 30)) {
      return {
        corridorId: corridor.id,
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