const sharp = require('sharp');
const fs = require('fs');

const inputPath = './src/assets/logo_ecole_primaire_le_mont_sinai_app.png';
const outputPathWebP = './src/assets/logo_ecole_primaire_le_mont_sinai_app.webp';
const outputPathPNG = './src/assets/logo_ecole_primaire_le_mont_sinai_app_optimized.png';

async function compressLogo() {
  try {
    console.log('Compression du logo en cours...');

    // Obtenir les dimensions originales
    const metadata = await sharp(inputPath).metadata();
    console.log('Dimensions originales:', metadata.width, 'x', metadata.height);

    // Compresser en WebP avec qualité 58
    await sharp(inputPath)
      .webp({ quality: 58, effort: 6 })
      .toFile(outputPathWebP);

    const webpStats = fs.statSync(outputPathWebP);
    console.log('WebP créé:', (webpStats.size / 1024).toFixed(2), 'Ko');

    // Compresser en PNG optimisé comme fallback
    await sharp(inputPath)
      .png({ quality: 85, compressionLevel: 9, adaptiveFiltering: true })
      .toFile(outputPathPNG);

    const pngStats = fs.statSync(outputPathPNG);
    console.log('PNG optimisé créé:', (pngStats.size / 1024).toFixed(2), 'Ko');

    const originalStats = fs.statSync(inputPath);
    console.log('Original:', (originalStats.size / 1024).toFixed(2), 'Ko');
    console.log('Réduction WebP:', ((1 - webpStats.size / originalStats.size) * 100).toFixed(1), '%');
    console.log('Réduction PNG:', ((1 - pngStats.size / originalStats.size) * 100).toFixed(1), '%');

    console.log('Compression terminée avec succès!');
  } catch (error) {
    console.error('Erreur lors de la compression:', error);
  }
}

compressLogo();
