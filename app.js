// app.js - Point d'entrée principal de l'interface Xaalya
document.addEventListener('DOMContentLoaded', () => {
  if (typeof initXaalyaRates === 'function') {
    initXaalyaRates();
  }
  if (typeof updateSimulation === 'function') {
    updateSimulation();
  }
});