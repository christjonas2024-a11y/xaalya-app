// xaalyaRates.js - Gestion globale des taux et du simulateur d'écart de change
let xaalyaRates = {};

async function initXaalyaRates() {
  try {
    const response = await fetch('rates.json?' + new Date().getTime());
    if (!response.ok) throw new Error('Erreur de chargement des taux');
    
    const data = await response.json();
    xaalyaRates = data.rates || {};

    // Affichage dynamique de la date de dernière mise à jour
    const updateEl = document.getElementById('last-update-time');
    if (updateEl && data.updatedAt) {
      const d = new Date(data.updatedAt);
      updateEl.textContent = `${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}`;
    }

    // Exécuter le calcul du simulateur une fois les taux chargés
    updateSimulation();
  } catch (e) {
    console.warn('Utilisation des taux de secours :', e);
  }
}

// Fonction de calcul synchrone reliée aux IDs du simulateur HTML
function updateSimulation() {
  const amountInput = document.getElementById('sim-amount');
  const currencySelect = document.getElementById('sim-currency');
  const rateDisplay = document.getElementById('sim-rate-display');
  const netDisplay = document.getElementById('sim-net-display');
  const pegNotice = document.getElementById('peg-notice'); // Élément du badge CFA

  if (!amountInput || !currencySelect || !rateDisplay || !netDisplay) return;

  const amount = parseFloat(amountInput.value) || 0;
  const target = currencySelect.value;
  const source = 'EUR';

  // Récupération sécurisée du taux
  const rate = (xaalyaRates && xaalyaRates[target]) ? xaalyaRates[target] : 1;
  const netReceived = amount * rate;

  // Mise à jour de l'affichage
  rateDisplay.textContent = `1 ${source} = ${rate.toFixed(4)} ${target}`;
  netDisplay.textContent = `${netReceived.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${target}`;

  // Gestion de l'affichage du badge de parité fixe Zone Franc (XOF / XAF)
  if (pegNotice) {
    if (target === 'XOF' || target === 'XAF') {
      pegNotice.classList.remove('hidden'); // Affiche le badge si c'est du CFA
    } else {
      pegNotice.classList.add('hidden');    // Le masque pour les autres devises (NGN, GHS, etc.)
    }
  }
}