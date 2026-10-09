const fs = require('fs');

async function mettreAJourTaux() {
    console.log("Mise à jour des taux pour Xaalya Ltd...");
    
    try {
        let donneesMarche = [
            { nom: "Lemfi", frais: 0.00, taux: 655.50, misAJour: new Date().toISOString(), delai: "Instantané", url: "https://lemfi.com/fr-fr" },
            { nom: "Sendwave", frais: 0.00, taux: 651.00, misAJour: new Date().toISOString(), delai: "Instantané", url: "https://www.sendwave.com/fr/countries/côte-d'ivoire/fr" },
            { nom: "Taptap Send", frais: 0.99, taux: 653.00, misAJour: new Date().toISOString(), delai: "Instantané", url: "https://www.taptapsend.com/fr" },
            { nom: "WorldRemit", frais: 1.99, taux: 650.50, misAJour: new Date().toISOString(), delai: "Quelques minutes", url: "https://www.worldremit.com/en" },
            { nom: "Remitly", frais: 1.99, taux: 649.80, misAJour: new Date().toISOString(), delai: "Instantané", url: "https://www.remitly.com/fr/fr/cote-d-ivoire/pricing" },
            { nom: "Western Union", frais: 3.90, taux: 645.00, misAJour: new Date().toISOString(), delai: "Instantané", url: "https://www.westernunion.com/fr/fr/web/send-money/start?ReceiveCountry=CI" }
        ];

        fs.writeFileSync('rates.json', JSON.stringify(donneesMarche, null, 2));
        console.log("Fichier rates.json actualisé avec succès (sans Wise).");

    } catch (error) {
        console.error("Erreur lors de la mise à jour :", error);
    }
}

mettreAJourTaux();