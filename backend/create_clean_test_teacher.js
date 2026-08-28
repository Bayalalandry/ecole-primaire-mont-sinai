const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function createCleanTestTeacher() {
  console.log('=== Création d\'un compte enseignant de test propre ===\n');

  const username = 'testteacher' + Date.now();
  const password = 'TestPass123!';
  const firstName = 'Pierre';
  const lastName = 'Martin';

  console.log('1. Hashage du mot de passe...');
  const passwordHash = await bcrypt.hash(password, 10);
  console.log('✅ Mot de passe hashé\n');

  console.log('2. Création de l\'utilisateur...');
  const { data: newUser, error: userError } = await supabase
    .from('users')
    .insert({
      username,
      password_hash: passwordHash,
      role: 'teacher',
      first_name: firstName,
      last_name: lastName,
      is_active: true,
    })
    .select()
    .single();

  if (userError) {
    console.error('❌ Erreur création utilisateur:', userError);
    return;
  }

  console.log(`✅ Utilisateur créé: ${lastName} ${firstName} (ID: ${newUser.id})`);

  console.log('3. Création de l\'entrée teachers (statut active)...');
  const { error: teacherError } = await supabase
    .from('teachers')
    .insert({
      user_id: newUser.id,
      status: 'active',
    });

  if (teacherError) {
    console.error('❌ Erreur création teacher:', teacherError);
    return;
  }

  console.log('✅ Entrée teachers créée (statut: active)');

  // Récupérer l'année scolaire actuelle
  const { data: currentYear } = await supabase
    .from('school_years')
    .select('id, year_label')
    .eq('is_current', true)
    .single();

  console.log(`4. Année scolaire actuelle: ${currentYear?.year_label}`);

  // Récupérer une classe (CE1 par exemple)
  const { data: ce1Class } = await supabase
    .from('classes')
    .select('id, name')
    .eq('name', 'CE1')
    .single();

  console.log(`5. Classe choisie: ${ce1Class?.name}`);

  console.log('6. Assignation de la classe...');
  const { error: assignError } = await supabase
    .from('teacher_class_assignments')
    .insert({
      teacher_id: newUser.id,
      class_id: ce1Class.id,
      school_year_id: currentYear.id,
    });

  if (assignError) {
    console.error('❌ Erreur assignation:', assignError);
    return;
  }

  console.log('✅ Assignation créée\n');

  console.log('=== COMPTE DE TEST CRÉÉ AVEC SUCCÈS ===\n');
  console.log('Identifiants de connexion :');
  console.log(`Username: ${username}`);
  console.log(`Password: ${password}\n`);

  console.log('Informations de nettoyage :');
  console.log(`DELETE FROM teacher_class_assignments WHERE teacher_id = '${newUser.id}';`);
  console.log(`DELETE FROM teachers WHERE user_id = '${newUser.id}';`);
  console.log(`DELETE FROM users WHERE id = '${newUser.id}';\n`);

  // Test de connexion immédiat
  console.log('=== TEST DE CONNEXION IMMÉDIAT ===\n');
  const { data: testUser } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  const isPasswordValid = await bcrypt.compare(password, testUser.password_hash);

  if (isPasswordValid) {
    console.log('✅ Test de connexion RÉUSSI\n');
  } else {
    console.log('❌ Test de connexion ÉCHOUÉ\n');
  }

  return { username, password, userId: newUser.id };
}

createCleanTestTeacher().then((result) => {
  if (result) {
    console.log('=== PRÊT POUR LE TEST FINAL ===\n');
    console.log('Vous pouvez maintenant tester ce compte:');
    console.log(`Username: ${result.username}`);
    console.log(`Password: ${result.password}`);
  }
  process.exit(0);
});
