const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Chemins des fichiers
const inputPath = path.join(__dirname, 'assets', 'logo.png');
const outputWebp = path.join(__dirname, 'assets', 'logo.webp');
const outputOptimizedPng = path.join(__dirname, 'assets', 'logo-optimized.png');

async function optimizeLogo() {
  try {
    if (!fs.existsSync(inputPath)) {
      console.error(`❌ Erreur : Le fichier ${inputPath} est introuvable.`);
      return;
    }

    console.log('🔄 Optimisation du logo en cours...');

    // 1. Générer une version WebP ultra-légère (recommandée pour le web)
    await sharp(inputPath)
      .resize({ width: 300 }) // Ajustez la largeur maximale selon vos besoins réels (ex: 200 ou 300px)
      .webp({ quality: 80 })
      .toFile(outputWebp);
    console.log('✅ Logo WebP généré : ./assets/logo.webp');

    // 2. Compresser et nettoyer le PNG d'origine (pour garder un fallback propre si besoin)
    await sharp(inputPath)
      .resize({ width: 300 })
      .png({ quality: 80, compressionLevel: 9 })
      .toFile(outputOptimizedPng);
    console.log('✅ Logo PNG compressé : ./assets/logo-optimized.png');

    console.log('🎉 Optimisation terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors du traitement de l’image :', error);
  }
}

optimizeLogo();