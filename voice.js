function listenResultNow() {
  if (!('speechSynthesis' in window)) return;

  const source = document.getElementById('sourceCurrency')?.value;
  const target = document.getElementById('targetCurrency')?.value;
  const amount = parseFloat(document.getElementById('sendAmount')?.value) || 0;
  const tbody = document.getElementById('operatorsList');
  if (!source || !target || amount <= 0 || !tbody) return;

  const offres = Array.from(tbody.querySelectorAll('tr'))
    .map(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 5) return null;
      return {
        nom: cells[1].innerText.split('\n')[0].trim(),
        recuTexte: cells[4].innerText.replace(/[^\d.,]/g, '').trim()
      };
    })
    .filter(item => item && item.nom && item.recuTexte);

  if (offres.length === 0) return;

  window.speechSynthesis.cancel();

  const best = offres[0];
  const second = offres[1];
  const lang = (document.getElementById('language-select')?.value || 'fr').toLowerCase();

  const spokenSource = typeof getSpokenCurrency === 'function' ? getSpokenCurrency(source, lang) : source;
  const spokenTarget = typeof getSpokenCurrency === 'function' ? getSpokenCurrency(target, lang) : target;

  let message = '';
  if (lang === 'fr') {
    message = `Pour ${amount} ${spokenSource}, le moins cher est ${best.nom}. Vous recevez environ ${best.recuTexte} ${spokenTarget}.` +
              (second ? ` Le deuxième est ${second.nom}, avec ${second.recuTexte} ${spokenTarget}.` : '');
  } else if (lang === 'en') {
    message = `For ${amount} ${spokenSource}, the cheapest is ${best.nom}. You receive about ${best.recuTexte} ${spokenTarget}.` +
              (second ? ` The second is ${second.nom}, with ${second.recuTexte} ${spokenTarget}.` : '');
  } else {
    const cfg = (typeof VOICE_CONFIG_16 !== 'undefined' && VOICE_CONFIG_16[lang]) || { bestLabel: 'Best rate' };
    message = `${cfg.bestLabel}: ${best.nom}, ${best.recuTexte} ${spokenTarget}.`;
  }

  const utterance = new SpeechSynthesisUtterance(message);
  const langCodeMap = {
    fr: 'fr-FR', en: 'en-US', zu: 'en-ZA', ln: 'fr-FR', sn: 'en-GB',
    de: 'de-DE', ar: 'ar-SA', pt: 'pt-PT', es: 'es-ES', zh: 'zh-CN',
    it: 'it-IT', sw: 'sw-KE', am: 'en-US', yo: 'en-NG', ha: 'en-NG', wo: 'fr-FR'
  };
  utterance.lang = langCodeMap[lang] || 'en-US';
  utterance.rate = 0.95;

  const btnLabel = document.getElementById('listenResultLabel');
  const originalText = btnLabel ? btnLabel.textContent : '';
  if (btnLabel) btnLabel.textContent = 'Lecture en cours...';
  utterance.onend = () => { if (btnLabel) btnLabel.textContent = originalText; };
  utterance.onerror = () => { if (btnLabel) btnLabel.textContent = originalText; };

  window.speechSynthesis.speak(utterance);
}