/**
 * Script pour générer les clés VAPID pour Web Push
 *
 * VAPID (Voluntary Application Server Identification) est requis
 * pour envoyer des notifications push via le Web Push API
 */

const webpush = require('web-push');

console.log('🔑 Génération des clés VAPID...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ Clés VAPID générées avec succès !\n');
console.log('📋 Copiez ces clés dans votre fichier .env :\n');
console.log('==========================================');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('==========================================\n');

console.log('📝 Note :');
console.log('- La clé publique sera utilisée dans le frontend');
console.log('- La clé privée sera utilisée dans le backend');
console.log('- Ne partagez JAMAIS la clé privée !\n');
