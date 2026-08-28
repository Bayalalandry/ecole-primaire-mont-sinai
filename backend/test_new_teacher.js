const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testNewTeacher() {
  console.log('=== Test de validation avec un enseignant 100% nouveau ===\n');

  // 1. Créer un nouveau compte enseignant
  const username = 'nouveauteacher' + Date.now();
  const password = 'Password123!';
  const firstName = 'Jean';
  const lastName = 'Dupont';

  console.log('1. Création du compte enseignant...');
  const { data: newUser, error: userError } = await supabase
    .from('users')
    .insert({
      username,
      password_hash: 'hash', // sera remplacé par le vrai hash lors de l'inscription
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

  console.log(`✅ Compte créé: ${lastName} ${firstName} (ID: ${newUser.id})`);
  console.log(`   Username: ${username}`);
  console.log(`   Password: ${password}\n`);

  // 2. Créer l'entrée teachers avec statut pending
  console.log('2. Création de l\'entrée teachers (statut pending)...');
  const { data: teacherData, error: teacherError } = await supabase
    .from('teachers')
    .insert({
      user_id: newUser.id,
      status: 'pending',
    })
    .select()
    .single();

  if (teacherError) {
    console.error('❌ Erreur création teacher:', teacherError);
    return;
  }

  console.log('✅ Entrée teachers créée (statut: pending)\n');

  // 3. Récupérer l'année scolaire actuelle
  const { data: currentYear } = await supabase
    .from('school_years')
    .select('id, year_label')
    .eq('is_current', true)
    .single();

  console.log(`3. Année scolaire actuelle: ${currentYear?.year_label} (ID: ${currentYear?.id})\n`);

  // 4. Récupérer une classe (CP1 par exemple)
  const { data: cp1Class } = await supabase
    .from('classes')
    .select('id, name')
    .eq('name', 'CP1')
    .single();

  console.log(`4. Classe choisie: ${cp1Class?.name} (ID: ${cp1Class?.id})\n`);

  console.log('=== INSTRUCTIONS POUR LE TEST ===\n');
  console.log('ÉTAPE 1: Connectez-vous en tant que FONDATEUR');
  console.log('ÉTAPE 2: Allez sur "Gestion du Personnel"');
  console.log('ÉTAPE 3: Validez le compte de Jean Dupont (bouton ✓ Valider)');
  console.log('ÉTAPE 4: Assignez-lui la classe CP1');
  console.log('ÉTAPE 5: Déconnectez-vous\n');

  console.log('=== PUIS CONNECTEZ-VOUS AVEC LE NOUVEAU COMPTE ===\n');
  console.log(`Username: ${username}`);
  console.log(`Password: ${password}\n`);

  console.log('=== VÉRIFICATIONS À EFFECTUER ===\n');
  console.log('1. Le dashboard affiche-t-il les vraies statistiques (pas "À venir") ?');
  console.log('2. Le menu de sélection de classe dans "Saisie des Moyennes" fonctionne-t-il ?');
  console.log('3. CP1 apparaît-il dans le menu déroulant ?');
  console.log('4. "Gestion des Élèves" affiche-t-il correctement la classe CP1 ?\n');

  console.log('=== INFORMATIONS DE NETTOYAGE ===\n');
  console.log(`Pour supprimer ce compte de test après validation :`);
  console.log(`DELETE FROM users WHERE id = '${newUser.id}';`);
  console.log(`DELETE FROM teachers WHERE user_id = '${newUser.id}';`);
  console.log(`DELETE FROM teacher_class_assignments WHERE teacher_id = '${newUser.id}';\n`);
}

testNewTeacher().then(() => process.exit(0));
