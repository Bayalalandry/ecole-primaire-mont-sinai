require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testPermissions() {
  console.log('=== TEST DES PERMISSIONS ÉTAPE 10 ===\n');

  try {
    // 1. Vérifier que l'activité log n'expose pas de données sensibles
    console.log('1. Vérification de la structure du journal d\'activité...');
    const { data: activityLog, error: activityError } = await supabase
      .from('activity_log')
      .select('*')
      .limit(1);

    if (activityError) {
      console.error('Erreur:', activityError.message);
      return;
    }

    if (activityLog && activityLog.length > 0) {
      const columns = Object.keys(activityLog[0]);
      console.log('✓ Colonnes du journal d\'activité:', columns.join(', '));

      // Vérifier qu'il n'y a pas de colonnes sensibles
      const sensitiveColumns = ['password', 'password_hash', 'secret', 'token'];
      const hasSensitive = columns.some(col => sensitiveColumns.some(sens => col.toLowerCase().includes(sens)));
      
      if (hasSensitive) {
        console.error('⚠️ ATTENTION: Colonnes sensibles détectées dans activity_log');
      } else {
        console.log('✓ Aucune colonne sensible détectée');
      }
    }

    // 2. Vérifier que la table notifications a recipient_id pour l'isolement
    console.log('\n2. Vérification de la structure des notifications...');
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);

    if (notifError) {
      console.error('Erreur:', notifError.message);
      return;
    }

    if (notifications && notifications.length > 0) {
      const columns = Object.keys(notifications[0]);
      console.log('✓ Colonnes des notifications:', columns.join(', '));

      if (columns.includes('recipient_id')) {
        console.log('✓ La colonne recipient_id est présente pour l\'isolement par utilisateur');
      } else {
        console.error('⚠️ ATTENTION: recipient_id manquant');
      }
    }

    // 3. Vérifier que la route backup ne peut être appelée que par fondateur (middleware)
    console.log('\n3. Vérification du middleware de backup...');
    const fs = require('fs');
    const backupRoutePath = './src/routes/backup.ts';
    
    if (fs.existsSync(backupRoutePath)) {
      const backupContent = fs.readFileSync(backupRoutePath, 'utf8');
      if (backupContent.includes('requireFounder')) {
        console.log('✓ La route backup utilise requireFounder');
      } else {
        console.error('⚠️ ATTENTION: requireFounder manquant dans backup route');
      }
    }

    // 4. Vérifier que la route activity log ne peut être appelée que par fondateur
    console.log('\n4. Vérification du middleware du journal d\'activité...');
    const activityRoutePath = './src/routes/activityLog.ts';
    
    if (fs.existsSync(activityRoutePath)) {
      const activityContent = fs.readFileSync(activityRoutePath, 'utf8');
      if (activityContent.includes('requireFounder')) {
        console.log('✓ La route activity_log utilise requireFounder');
      } else {
        console.error('⚠️ ATTENTION: requireFounder manquant dans activity_log route');
      }
    }

    // 5. Vérifier que les exportations de données sensibles sont protégées
    console.log('\n5. Vérification de la protection des données sensibles...');
    const backupTestPath = './test_backup.js';
    
    if (fs.existsSync(backupTestPath)) {
      const backupTestContent = fs.readFileSync(backupTestPath, 'utf8');
      if (backupTestContent.includes('select(\'id, username, role, first_name, last_name, is_active, created_at\')')) {
        console.log('✓ Les utilisateurs sont exportés sans mot de passe');
      } else {
        console.error('⚠️ ATTENTION: Vérifier que les mots de passe ne sont pas exportés');
      }
    }

    console.log('\n=== TEST DES PERMISSIONS TERMINÉ ===');

  } catch (error) {
    console.error('Erreur:', error);
  }
}

testPermissions();
