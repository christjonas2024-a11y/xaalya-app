<script>
  // 1. Variable globale en mémoire
  let xaalyaRates = {};

  // 2. Fonction de chargement au démarrage
  async function initXaalyaRates() {
    try {
      const response = await fetch('rates.json?' + new Date().getTime());
      if (!response.ok) throw new Error('Erreur de chargement');
      
      const data = await response.json();
      xaalyaRates = data.rates || {}; // Stockage dans l'objet

      // Affichage de la date de mise à jour (si l'élément existe)
      const updateEl = document.getElementById('last-update-time');
      if (updateEl && data.updatedAt) {
        const d = new Date(data.updatedAt);
        updateEl.textContent = `Taux publics mis à jour le ${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}`;
      }

      // Relancer le calcul si la fonction existe déjà
      if (typeof calculateComparator === 'function') {
        calculateComparator();
      }
    } catch (e) {
      console.warn('Utilisation des taux par défaut', e);
    }
  }

  // Lancement au chargement de la page
  document.addEventListener('DOMContentLoaded', initXaalyaRates);
</script>