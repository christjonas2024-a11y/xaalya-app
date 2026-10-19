const { calculateTransfer, isRateStale, calculateMultipleCorridors } = require('./transfer');

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
        rateTimestamp: now - (2 * 60 * 1000) // Récent -> OK
      },
      {
        id: "USD-XOF-02",
        amountSent: 100,
        fixedFee: 1,
        percentageFeeRate: 0.01,
        exchangeRate: 600,
        rateTimestamp: now - (60 * 60 * 1000) // Périmé (1h) -> Rejeté
      }
    ];

    const results = calculateMultipleCorridors(corridorsList);

    // Le premier couloir doit réussir (98 * 655 = 64190)
    expect(results[0].status).toBe("SUCCESS");
    expect(results[0].amountReceived).toBe(64190);

    // Le second couloir doit être rejeté à cause du taux périmé
    expect(results[1].status).toBe("REJECTED_STALE_RATE");
  });

});
