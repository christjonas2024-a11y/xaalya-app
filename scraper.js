const fs = require('fs');
// 1. Importation de la fonction utilitaire extractDates
const { extractDates } = require('./utils/extractDates');

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
        const response = await fetch('https://open.er-api.com/v6/latest/USD', { headers: HEADERS_NAVIGATEUR });
        const data = await response.json();
        if (data && data.rates) {
            return data.rates;
        }
        throw new Error("Format de données Forex invalide.");
    } catch (e) {
        console.warn("⚠️ API Forex indisponible, utilisation de taux de secours standards.");
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
        return 1.0; 
    }
    if (deviseSource === 'USD') {
        return rates[deviseCible];
    }
    const montantUSD = 1 / rates[deviseSource];
    return montantUSD * rates[deviseCible];
}

/**
 * Script principal d'actualisation pour les 10 opérateurs et l'ensemble des corridors
 */
async function executerMiseAJourXaalya() {
    console.log("🚀 Lancement de l'actualisation globale avec détection des promos (Kdo)...");

    // 1. Définition des 10 opérateurs (enrichis potentiellement de données promo brutes)
    let operateurs;
    try {
        const rawConfig = fs.readFileSync('operators-config.json');
        operateurs = JSON.parse(rawConfig);
    } catch (err) {
        operateurs = [
            { nom: "NALA", fraisFixes: 1.50, margeSpread: 0.003, delai: "Instantané", url: "https://www.nala.com", promoRawText: "" },
            { nom: "Lemfi", fraisFixes: 0.00, margeSpread: 0.002, delai: "Instantané", url: "https://lemfi.com", promoRawText: "Frais offerts jusqu'au 31/12/2026", promoType: "FREE_FEES" },
            { nom: "Taptap Send", fraisFixes: 0.99, margeSpread: 0.0045, delai: "Instantané", url: "https://www.taptapsend.com", promoRawText: "" },
            { nom: "Sendwave", fraisFixes: 0.00, margeSpread: 0.0075, delai: "Instantané", url: "https://www.sendwave.com", promoRawText: "" },
            { nom: "Chipper Cash", fraisFixes: 0.00, margeSpread: 0.008, delai: "Instantané", url: "https://chippercash.com", promoRawText: "" },
            { nom: "Wise", fraisFixes: 2.50, margeSpread: 0.001, delai: "1-2 jours", url: "https://wise.com", promoRawText: "" },
            { nom: "Paysend", fraisFixes: 1.50, margeSpread: 0.006, delai: "Instantané", url: "https://paysend.com", promoRawText: "" },
            { nom: "Remitly", fraisFixes: 1.99, margeSpread: 0.0095, delai: "Instantané", url: "https://www.remitly.com", promoRawText: "" },
            { nom: "WorldRemit", fraisFixes: 1.99, margeSpread: 0.0085, delai: "Quelques minutes", url: "https://www.worldremit.com", promoRawText: "" },
            { nom: "Western Union", fraisFixes: 3.90, margeSpread: 0.016, delai: "Instantané", url: "https://www.westernunion.com", promoRawText: "" }
        ];
    }

    // 2. Récupération des taux de change mondiaux actuels
    const ratesForex = await obtenirTauxForexGlobal();
    const maintenant = new Date().toISOString();

    // 3. Génération de la matrice complète des corridors et application des promos
    const catalogueCorridors = [];

    for (const source of DEVISES_DEPART) {
        for (const cible of DEVISES_AFRIQUE) {
            const tauxMarcheBrut = calculerTauxCroise(source, cible, ratesForex);

            const offresOperateurs = operateurs.map(op => {
                const marge = op.margeSpread !== undefined ? op.margeSpread : 0.005;
                const tauxFinalOp = parseFloat((tauxMarcheBrut * (1 - marge)).toFixed(4));
                
                // Analyse dynamique de la période promotionnelle via extractDates
                const promoInfo = extractDates(op.promoRawText);
                
                let fraisAppliques = op.fraisFixes !== undefined ? op.fraisFixes : 1.00;

                // Si la promotion est active en temps réel, on impacte les frais (ex: offerts)
                if (promoInfo.isLive && op.promoType === "FREE_FEES") {
                    fraisAppliques = 0.00;
                }

                return {
                    operateur: op.nom,
                    frais: fraisAppliques,
                    taux: tauxFinalOp,
                    delai: op.delai,
                    url: op.url,
                    // Transmission des données de promo pour l'affichage du badge Kdo sur le site
                    isPromoActive: promoInfo.isLive,
                    promoStart: promoInfo.start,
                    promoEnd: promoInfo.end,
                    promoText: op.promoRawText || ""
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

    // 4. Enregistrement dans le fichier rates.json global exploité par l'interface
    fs.writeFileSync('rates.json', JSON.stringify(catalogueCorridors, null, 2));
    console.log(`✅ Fichier rates.json généré avec succès : ${catalogueCorridors.length} couloirs traités (avec détection automatique des promos Kdo).`);
}

executerMiseAJourXaalya();