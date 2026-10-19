const {
  calculateTransfer,
  isRateStale,
  calculateMultipleCorridors
} = require("./transfer");

describe('Moteur de calcul financier - Tests Avancés de Xaalya', () => {
  
  test('Valide le calcul de base des frais et du montant reçu', () => {
    const result = calculateTransfer({
      amountSent: 200.00,
      fixedFee: 1.50,
      percentageFeeRate: 0.02,
      exchangeRate: 655.957,
      decimalPlaces: 2
    });
    expect(result.amountReceived).toBe(127583.64);
  });

  test('Détecte correctement un taux périmé (plus vieux que le seuil)', () => {
    const staleTimestamp = Date.now() - (45 * 60 * 1000);
    const freshTimestamp = Date.now() - (5 * 60 * 1000);

    expect(isRateStale(staleTimestamp, 30)).toBe(true);
    expect(isRateStale(freshTimestamp, 30)).toBe(false);
  });

  test('Traite et filtre des couloirs multiples (gestion des taux périmés)', () => {
    const now = Date.now();
    
    const corridorsList = [
      {
        id: "EUR-XOF-01",
        amountSent: 100,
        fixedFee: 1,
        percentageFeeRate: 0.01,
        exchangeRate: 655,
        rateTimestamp: now - (2 * 60 * 1000)
      },
      {
        id: "USD-XOF-02",
        amountSent: 100,
        fixedFee: 1,
        percentageFeeRate: 0.01,
        exchangeRate: 600,
        rateTimestamp: now - (60 * 60 * 1000)
      }
    ];

    const results = calculateMultipleCorridors(corridorsList);

    expect(results[0].status).toBe("SUCCESS");
    expect(results[0].amountReceived).toBe(64190);
    expect(results[1].status).toBe("REJECTED_STALE_RATE");
  });

  test('Rejette un montant envoyé inférieur ou égal à zéro', () => {
    expect(() => calculateTransfer({
      amountSent: 0,
      fixedFee: 1,
      percentageFeeRate: 0.01,
      exchangeRate: 655
    })).toThrow();

    expect(() => calculateTransfer({
      amountSent: -50,
      fixedFee: 1,
      percentageFeeRate: 0.01,
      exchangeRate: 655
    })).toThrow();
  });

  test('Rejette un montant envoyé non numérique (NaN)', () => {
    expect(() => calculateTransfer({
      amountSent: NaN,
      fixedFee: 1,
      percentageFeeRate: 0.01,
      exchangeRate: 655
    })).toThrow();
  });

  test('Rejette lorsque les frais absorbent tout ou dépassent le montant envoyé', () => {
    expect(() => calculateTransfer({
      amountSent: 100,
      fixedFee: 100,
      percentageFeeRate: 0,
      exchangeRate: 655
    })).toThrow();

    expect(() => calculateTransfer({
      amountSent: 100,
      fixedFee: 120,
      percentageFeeRate: 0,
      exchangeRate: 655
    })).toThrow();
  });

  test('Gère une erreur de traitement sur un couloir et retourne un statut ERROR', () => {
    const faultyCorridorsList = [
      {
        id: "ERROR-CORRIDOR",
        amountSent: -10,
        fixedFee: 1,
        percentageFeeRate: 0.01,
        exchangeRate: 655,
        rateTimestamp: Date.now()
      }
    ];

    const results = calculateMultipleCorridors(faultyCorridorsList);
    expect(results[0].status).toBe("ERROR");
    expect(results[0].error).toBeTruthy();
  });

  test('Couvre toutes les branches des conditions limites (montants et options)', () => {
    expect(() => calculateTransfer({
      amountSent: NaN,
      fixedFee: 1,
      percentageFeeRate: 0.01,
      exchangeRate: 655
    })).toThrow();

    const now = Date.now();
    const results = calculateMultipleCorridors([
      {
        id: "DEFAULT-AGE",
        amountSent: 100,
        fixedFee: 1,
        percentageFeeRate: 0.01,
        exchangeRate: 655,
        rateTimestamp: now 
      }
    ]);
    expect(results[0].status).toBe("SUCCESS");
  });

});

// --- NOUVEAUX TESTS DE VALIDATION DES TAUX ET SEUILS ---

describe("Validation des taux et seuils personnalisés", () => {
  test("Accepte un taux récent avec un seuil personnalisé", () => {
    const timestamp = Date.now() - 2 * 60 * 1000;

    expect(isRateStale(timestamp, 5)).toBe(false);
  });

  test("Rejette un taux dépassant le seuil personnalisé", () => {
    const timestamp = Date.now() - 10 * 60 * 1000;

    expect(isRateStale(timestamp, 5)).toBe(true);
  });

  test("Rejette un taux sans date valide", () => {
    expect(isRateStale(undefined)).toBe(true);
    expect(isRateStale(NaN)).toBe(true);
  });

  test("Rejette une date située dans le futur", () => {
    expect(isRateStale(Date.now() + 60_000)).toBe(true);
  });

  test("Préserve un seuil personnalisé égal à zéro", () => {
    const recentCorridor = {
      id: "TEST-ZERO",
      amountSent: 100,
      fixedFee: 1,
      percentageFeeRate: 0.01,
      exchangeRate: 655,
      rateTimestamp: Date.now() - 60_000,
      maxAgeMinutes: 0
    };

    const [result] = calculateMultipleCorridors([recentCorridor]);

    expect(result.status).toBe("REJECTED_STALE_RATE");
  });
});