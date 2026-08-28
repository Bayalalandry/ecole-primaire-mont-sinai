const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testLoginJean() {
  console.log('=== Test de connexion pour Jean Dupont ===\n');

  const username = 'nouveauteacher1787381809426';
  const password = 'Password123!';

  console.log(`Username: ${username}`);
  console.log(`Password: ${password}\n`);

  // Récupérer l'utilisateur
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (userError || !user) {
    console.error('❌ Utilisateur non trouvé:', userError);
    return;
  }

  console.log('✅ Utilisateur trouvé');
  console.log(`   ID: ${user.id}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Is active: ${user.is_active}`);
  console.log(`   Has password hash: ${user.password_hash ? 'Yes' : 'No'}\n`);

  // Vérifier le mot de passe
  console.log('Vérification du mot de passe...');
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (isPasswordValid) {
    console.log('✅ Mot de passe CORRECT\n');
    console.log('=== CONNEXION RÉUSSIE ===\n');
  } else {
    console.log('❌ Mot de passe INCORRECT\n');
    console.log('Vérification manuelle du hash...');
    const testHash = await bcrypt.hash(password, 10);
    console.log(`Hash généré: ${testHash.substring(0, 20)}...`);
    console.log(`Hash stocké: ${user.password_hash.substring(0, 20)}...`);
  }

  // Vérifier le statut teacher
  const { data: teacherData } = await supabase
    .from('teachers')
    .select('status')
    .eq('user_id', user.id)
    .maybeSingle();

  console.log(`\nStatut teacher: ${teacherData?.status}`);

  if (teacherData?.status === 'pending') {
    console.log('⚠️  Le compte est en attente de validation');
  } else if (teacherData?.status === 'active') {
    console.log('✅ Le compte est actif');
  }
}

testLoginJean().then(() => process.exit(0));
