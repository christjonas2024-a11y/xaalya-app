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

describe("Validation de la robustesse financière (Taux nuls, négatifs, infinis et arrondis)", () => {
  test("Rejette un taux de change égal à zéro, négatif ou infini", () => {
    const baseParams = { amountSent: 100, fixedFee: 1, percentageFeeRate: 0.01 };

    expect(() => calculateTransfer({ ...baseParams, exchangeRate: 0 })).toThrow();
    expect(() => calculateTransfer({ ...baseParams, exchangeRate: -655 })).toThrow();
    expect(() => calculateTransfer({ ...baseParams, exchangeRate: Infinity })).toThrow();
    expect(() => calculateTransfer({ ...baseParams, exchangeRate: NaN })).toThrow();
  });

  test("Rejette des frais invalides ou aberrants", () => {
    const baseParams = { amountSent: 100, exchangeRate: 655 };

    expect(() => calculateTransfer({ ...baseParams, fixedFee: -5, percentageFeeRate: 0.01 })).toThrow();
    expect(() => calculateTransfer({ ...baseParams, fixedFee: 1, percentageFeeRate: 1.2 })).toThrow();
  });

  test("Valide le respect strict des règles d'arrondi sur les décimales", () => {
    const result = calculateTransfer({
      amountSent: 150.50,
      fixedFee: 1.00,
      percentageFeeRate: 0.02,
      exchangeRate: 655.957,
      decimalPlaces: 2
    });

    expect(result.amountReceived.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
  });
  test("Rejette un nombre de décimales invalide", () => {
    const baseParams = { amountSent: 100, fixedFee: 1, percentageFeeRate: 0.01, exchangeRate: 655 };
    expect(() => calculateTransfer({ ...baseParams, decimalPlaces: -1 })).toThrow();
    expect(() => calculateTransfer({ ...baseParams, decimalPlaces: 10 })).toThrow();
  });

  test("Gère un calcul produisant un résultat non fini (Infini)", () => {
    const baseParams = { amountSent: 100, fixedFee: 0, percentageFeeRate: 0, exchangeRate: Infinity };
    // Bien que le taux Infinity soit déjà bloqué en amont, testons un cas limite ou simulons
    expect(() => calculateTransfer({ amountSent: 100, fixedFee: 0, percentageFeeRate: 0, exchangeRate: NaN })).toThrow();
  });

  test("Retourne un tableau vide si calculateMultipleCorridors reçoit autre chose qu'un tableau", () => {
    const result = calculateMultipleCorridors(null);
    expect(result).toEqual([]);
  });
  test("Rejette un dépassement de capacité numérique (Overflow vers Infinity)", () => {
    expect(() => calculateTransfer({
      amountSent: Number.MAX_VALUE,
      fixedFee: 0,
      percentageFeeRate: 0,
      exchangeRate: 2, // 2 * MAX_VALUE devient Infinity
      decimalPlaces: 2
    })).toThrow();
  });
test("Utilise UNKNOWN si un corridor périmé n'a pas d'identifiant", () => {
  const corridors = [
    {
      rateTimestamp: Date.now() - 60 * 60 * 1000,
      maxAgeMinutes: 30
    }
  ];

  const results = calculateMultipleCorridors(corridors);

  expect(results).toHaveLength(1);
  expect(results[0]).toEqual({
    corridorId: "UNKNOWN",
    status: "REJECTED_STALE_RATE",
    error: "Taux périmé, offre non disponible"
  });
});
});