/**
 * Script temporaire pour créer un compte secrétaire
 * À utiliser uniquement pour les tests avant la Phase 4
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erreur: SUPABASE_URL et SUPABASE_ANON_KEY doivent être définis dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSecretary() {
  console.log('🔧 Création du compte secrétaire...\n');

  try {
    // Vérifier si un secrétaire existe déjà
    const { data: existingSecretaries } = await supabase
      .from('users')
      .select('id, username')
      .eq('role', 'secretary');

    if (existingSecretaries && existingSecretaries.length > 0) {
      console.log('⚠️  Un compte secrétaire existe déjà :');
      existingSecretaries.forEach(s => {
        console.log(`   - ${s.username} (ID: ${s.id})`);
      });
      console.log('\nℹ️  Utilisez ce compte existant pour les tests.');
      return;
    }

    // Créer le secrétaire de test
    const username = 'secretary_test';
    const password = 'secretary123';
    const firstName = 'Secrétaire';
    const lastName = 'Test';

    console.log(`📝 Création du secrétaire :`);
    console.log(`   Nom d'utilisateur: ${username}`);
    console.log(`   Mot de passe: ${password}`);
    console.log(`   Nom: ${firstName}`);
    console.log(`   Prénom: ${lastName}\n`);

    const passwordHash = await bcrypt.hash(password, 10);

    // Créer l'utilisateur secrétaire
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        username,
        password_hash: passwordHash,
        role: 'secretary',
        first_name: firstName,
        last_name: lastName,
        is_active: true,
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Erreur création utilisateur:', userError);
      process.exit(1);
    }

    console.log(`✅ Utilisateur créé: ${newUser.username} (ID: ${newUser.id})`);

    // Créer l'entrée dans la table teachers (nécessaire pour assignation de classe)
    const { error: teacherError } = await supabase
      .from('teachers')
      .insert({
        user_id: newUser.id,
        status: 'active',
      });

    if (teacherError) {
      console.error('⚠️  Erreur création entrée teachers (non bloquant):', teacherError.message);
    } else {
      console.log(`✅ Entrée teachers créée`);
    }

    console.log('\n✅ Compte secrétaire créé avec succès !');
    console.log('\n📋 Identifiants de connexion :');
    console.log(`   Nom d'utilisateur: ${username}`);
    console.log(`   Mot de passe: ${password}`);
    console.log('\n🧪 Vous pouvez maintenant tester avec ce compte.');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createSecretary();
