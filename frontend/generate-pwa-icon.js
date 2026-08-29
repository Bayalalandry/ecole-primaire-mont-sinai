import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas, loadImage } from 'canvas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generatePWAIconWithText() {
  const logoPath = path.join(__dirname, 'src/assets/logo_ecole_primaire_le_mont_sinai_app.png');
  const outputPath192 = path.join(__dirname, 'public/icon-192.png');
  const outputPath512 = path.join(__dirname, 'public/icon-512.png');

  try {
    // Load the logo
    const logo = await loadImage(logoPath);

    // Generate 192x192 icon - logo MUCH LARGER (80% of icon)
    const canvas192 = createCanvas(192, 192);
    const ctx192 = canvas192.getContext('2d');

    // White background
    ctx192.fillStyle = '#ffffff';
    ctx192.fillRect(0, 0, 192, 192);

    // Draw logo centered and scaled - logo takes 80% of icon
    const logoSize192 = 154; // 80% of 192
    const logoX192 = (192 - logoSize192) / 2;
    const logoY192 = 5; // Small margin from top
    ctx192.drawImage(logo, logoX192, logoY192, logoSize192, logoSize192);

    // Draw text "Mont Sinaï" below logo
    ctx192.fillStyle = '#1e40af'; // Blue color matching school theme
    ctx192.font = 'bold 14px Arial, sans-serif';
    ctx192.textAlign = 'center';
    ctx192.textBaseline = 'bottom';
    ctx192.fillText('Mont Sinaï', 96, 190);

    // Save 192x192 icon
    const buffer192 = canvas192.toBuffer('image/png');
    fs.writeFileSync(outputPath192, buffer192);

    // Generate 512x512 icon - logo MUCH LARGER (80% of icon)
    const canvas512 = createCanvas(512, 512);
    const ctx512 = canvas512.getContext('2d');

    // White background
    ctx512.fillStyle = '#ffffff';
    ctx512.fillRect(0, 0, 512, 512);

    // Draw logo centered and scaled - logo takes 80% of icon
    const logoSize512 = 410; // 80% of 512
    const logoX512 = (512 - logoSize512) / 2;
    const logoY512 = 10; // Small margin from top
    ctx512.drawImage(logo, logoX512, logoY512, logoSize512, logoSize512);

    // Draw text "Mont Sinaï" below logo
    ctx512.fillStyle = '#1e40af'; // Blue color matching school theme
    ctx512.font = 'bold 38px Arial, sans-serif';
    ctx512.textAlign = 'center';
    ctx512.textBaseline = 'bottom';
    ctx512.fillText('Mont Sinaï', 256, 505);

    // Save 512x512 icon
    const buffer512 = canvas512.toBuffer('image/png');
    fs.writeFileSync(outputPath512, buffer512);

    console.log('✅ PWA icons generated successfully with LARGER logo + "Mont Sinaï" text');
    console.log('   - icon-192.png (192x192) - logo 80% size');
    console.log('   - icon-512.png (512x512) - logo 80% size');

  } catch (error) {
    console.error('❌ Error generating PWA icons with canvas:', error.message);
    console.log('   Falling back to copying logo without text...');
    fs.copyFileSync(logoPath, outputPath192);
    fs.copyFileSync(logoPath, outputPath512);
  }
}

generatePWAIconWithText();
