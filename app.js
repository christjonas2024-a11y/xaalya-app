// app.js - Point d'entrée principal de l'interface Xaalya
document.addEventListener('DOMContentLoaded', () => {
  // 1. Charger les taux depuis rates.json
  if (typeof initXaalyaRates === 'function') {
    initXaalyaRates();
  }

  // 2. Activer la réactivité en temps réel sur les champs du simulateur
  const amountInput = document.getElementById('sim-amount');
  const currencySelect = document.getElementById('sim-currency');

  if (amountInput) {
    amountInput.addEventListener('input', updateSimulation);
  }
  if (currencySelect) {
    currencySelect.addEventListener('change', updateSimulation);
  }
});