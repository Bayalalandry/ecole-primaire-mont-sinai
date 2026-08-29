import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// For now, use the logo as the PWA icon
// The text "Mont Sinaï" should be added manually using an image editor for best quality
const logoPath = path.join(__dirname, 'src/assets/logo_ecole_primaire_le_mont_sinai_app.png');
const outputPath192 = path.join(__dirname, 'public/icon-192.png');
const outputPath512 = path.join(__dirname, 'public/icon-512.png');

fs.copyFileSync(logoPath, outputPath192);
fs.copyFileSync(logoPath, outputPath512);

console.log('PWA icons generated (logo used as icon)');
console.log('IMPORTANT: For the proper icon with "Mont Sinaï" text below the logo,');
console.log('please manually edit the icon-192.png and icon-512.png files using an image editor');
console.log('to add the text "Mont Sinaï" below the school logo.');
