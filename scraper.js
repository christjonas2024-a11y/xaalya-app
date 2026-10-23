const fs = require('fs');

// En-têtes HTTP pour imiter un navigateur et éviter les blocages basiques
const HEADERS_NAVIGATEUR = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
};

// Liste des 7 devises de départ demandées
const DEVISES_DEPART = ['EUR', 'USD', 'GBP', 'CHF', 'AED', 'CAD', 'CNY'];

// Liste des 42 devises africaines cibles
const DEVISES_AFRIQUE = [
    'AOA', 'BIF', 'BWP', 'CDF', 'CVE', 'DJF', 'DZD', 'EGP', 'ERN', 'ETB', 
    'GMD', 'GHS', 'GNF', 'KES', 'KMF', 'LRD', 'LSL', 'LYD', 'MAD', 'MGA', 
    'MRU', 'MUR', 'MWK', 'MZN', 'NAD', 'NGN', 'RWF', 'SCR', 'SDG', 'SLE', 
    'SOS', 'SSP', 'STN', 'SZL', 'TND', 'TZS', 'UGX', 'XAF', 'XOF', 'ZAR', 
    'ZMW', 'ZWG'
];

/**
 * Récupère les taux de change mondiaux par rapport à l'USD depuis une API Forex gratuite
 */
async function obtenirTauxForexGlobal() {
    try {
        // open.er-api.com fournit les taux basés sur l'USD par défaut
        const response = await fetch('https://open.er-api.com/v6/latest/USD', { headers: HEADERS_NAVIGATEUR });
        const data = await response.json();
        if (data && data.rates) {
            return data.rates;
        }
        throw new Error("Format de données Forex invalide.");
    } catch (e) {
        console.warn("⚠️ API Forex indisponible, utilisation de taux de secours standards.");
        // Taux de repli basiques par rapport à l'USD en cas de panne réseau
        return {
            USD: 1.0, EUR: 0.92, GBP: 0.79, CHF: 0.90, 
            AED: 3.67, CAD: 1.36, CNY: 7.23, XOF: 605.0, XAF: 605.0, NGN: 1450.0
        };
    }
}

/**
 * Calcule le taux de change entre une devise source et une devise cible via l'USD
 */
function calculerTauxCroise(deviseSource, deviseCible, rates) {
    if (!rates[deviseSource] || !rates[deviseCible]) {
        return 1.0; // Valeur par défaut si une devise est introuvable
    }
    // Si la source est USD
    if (deviseSource === 'USD') {
        return rates[deviseCible];
    }
    // Conversion croisée via l'USD
montantUSD = 1 / rates[deviseSource];
    return montantUSD * rates[deviseCible];
}

/**
 * Script principal d'actualisation pour les 10 opérateurs et l'ensemble des corridors
 */
async function executerMiseAJourXaalya() {
    console.log("🚀 Lancement de l'actualisation globale (10 opérateurs × 7 devises × 42 devises africaines)...");

    // 1. Définition des 10 opérateurs retenus par défaut (ou chargés depuis operators-config.json)
    let operateurs;
    try {
        const rawConfig = fs.readFileSync('operators-config.json');
        operateurs = JSON.parse(rawConfig);
    } catch (err) {
        operateurs = [
            { nom: "NALA", fraisFixes: 1.50, margeSpread: 0.003, delai: "Instantané", url: "https://www.nala.com" },
            { nom: "Lemfi", fraisFixes: 0.00, margeSpread: 0.002, delai: "Instantané", url: "https://lemfi.com" },
            { nom: "Taptap Send", fraisFixes: 0.99, margeSpread: 0.0045, delai: "Instantané", url: "https://www.taptapsend.com" },
            { nom: "Sendwave", fraisFixes: 0.00, margeSpread: 0.0075, delai: "Instantané", url: "https://www.sendwave.com" },
            { nom: "Chipper Cash", fraisFixes: 0.00, margeSpread: 0.008, delai: "Instantané", url: "https://chippercash.com" },
            { nom: "Wise", fraisFixes: 2.50, margeSpread: 0.001, delai: "1-2 jours", url: "https://wise.com" },
            { nom: "Paysend", fraisFixes: 1.50, margeSpread: 0.006, delai: "Instantané", url: "https://paysend.com" },
            { nom: "Remitly", fraisFixes: 1.99, margeSpread: 0.0095, delai: "Instantané", url: "https://www.remitly.com" },
            { nom: "WorldRemit", fraisFixes: 1.99, margeSpread: 0.0085, delai: "Quelques minutes", url: "https://www.worldremit.com" },
            { nom: "Western Union", fraisFixes: 3.90, margeSpread: 0.016, delai: "Instantané", url: "https://www.westernunion.com" }
        ];
    }

    // 2. Récupération des taux de change mondiaux actuels
    const ratesForex = await obtenirTauxForexGlobal();
    const maintenant = new Date().toISOString();

    // 3. Génération de la matrice complète des corridors
    const catalogueCorridors = [];

    for (const source of DEVISES_DEPART) {
        for (const cible of DEVISES_AFRIQUE) {
            // Calcule le taux brut du marché pour ce couloir précis (ex: EUR -> XOF)
            const tauxMarcheBrut = calculerTauxCroise(source, cible, ratesForex);

            // Pour chaque opérateur, on applique sa politique de frais et sa marge (spread)
            const offresOperateurs = operateurs.map(op => {
                const marge = op.margeSpread !== undefined ? op.margeSpread : 0.005;
                const tauxFinalOp = parseFloat((tauxMarcheBrut * (1 - marge)).toFixed(4));
                const fraisAppliques = op.fraisFixes !== undefined ? op.fraisFixes : 1.00;

                return {
                    operateur: op.nom,
                    frais: fraisAppliques,
                    taux: tauxFinalOp,
                    delai: op.delai,
                    url: op.url
                };
            });

            catalogueCorridors.push({
                devisesDepart: source,
                deviseArrivee: cible,
                misAJour: maintenant,
                offres: offresOperateurs
            });
        }
    }

    // 4. Enregistrement dans le fichier rates.json global
    fs.writeFileSync('rates.json', JSON.stringify(catalogueCorridors, null, 2));
    console.log(`✅ Fichier rates.json généré avec succès : ${catalogueCorridors.length} couloirs traités pour les 10 opérateurs.`);
}

executerMiseAJourXaalya();