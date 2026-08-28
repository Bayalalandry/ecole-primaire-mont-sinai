const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testAccount(username, password, firstName, lastName) {
  console.log(`=== Test pour ${lastName} ${firstName} ===\n`);

  // 1. Vérifier l'utilisateur
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (userError || !user) {
    console.error('❌ Utilisateur non trouvé');
    return false;
  }

  console.log('✅ Utilisateur trouvé');
  console.log(`   ID: ${user.id}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Is active: ${user.is_active}`);

  // 2. Vérifier le mot de passe
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    console.error('❌ Mot de passe incorrect');
    return false;
  }
  console.log('✅ Mot de passe correct');

  // 3. Vérifier le statut teacher
  const { data: teacherData } = await supabase
    .from('teachers')
    .select('status')
    .eq('user_id', user.id)
    .maybeSingle();

  console.log(`   Statut teacher: ${teacherData?.status}`);

  if (teacherData?.status !== 'active') {
    console.error('❌ Compte non actif');
    return false;
  }
  console.log('✅ Compte actif');

  // 4. Vérifier les assignations
  const { data: currentYear } = await supabase
    .from('school_years')
    .select('id, year_label')
    .eq('is_current', true)
    .single();

  const { data: assignments } = await supabase
    .from('teacher_class_assignments')
    .select('class_id, classes(name)')
    .eq('teacher_id', user.id)
    .eq('school_year_id', currentYear.id);

  if (!assignments || assignments.length === 0) {
    console.error('❌ Aucune assignation');
    return false;
  }

  console.log('✅ Assignations trouvées:');
  assignments.forEach(a => {
    console.log(`   - ${a.classes?.name}`);
  });

  // 5. Tester l'API dashboard stats
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'your_jwt_secret_key',
    { expiresIn: '24h' }
  );

  try {
    const response = await fetch('http://localhost:5000/api/dashboard/teacher/dashboard-stats', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();

    if (response.ok) {
      console.log('✅ API Dashboard Stats:');
      console.log(`   - Mes élèves: ${data.totalStudents}`);
      console.log(`   - Moyennes à saisir: ${data.pendingGrades}`);
      console.log(`   - Scolarités en retard: ${data.overdueTuition}`);
    } else {
      console.error('❌ API Dashboard Stats échouée');
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur API Dashboard:', error.message);
    return false;
  }

  // 6. Tester l'API passage my-classes
  try {
    const response = await fetch('http://localhost:5000/api/passage/my-classes', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();

    console.log('Passage My-Classes response:', JSON.stringify(data, null, 2));

    if (response.ok && data.classes && data.classes.length > 0) {
      console.log('✅ API Passage My-Classes:');
      data.classes.forEach(c => {
        console.log(`   - ${c.name}`);
      });
    } else {
      console.error('❌ API Passage My-Classes échouée ou vide');
      console.error('Response status:', response.status);
      console.error('Response data:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur API Passage:', error.message);
    return false;
  }

  // 7. Tester l'API auth/me
  try {
    const response = await fetch('http://localhost:5000/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();

    if (response.ok && data.user.teacherInfo) {
      console.log('✅ API Auth Me:');
      console.log(`   - Classes assignées: ${data.user.teacherInfo.assigned_classes?.join(', ')}`);
    } else {
      console.error('❌ API Auth Me échouée');
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur API Auth:', error.message);
    return false;
  }

  console.log('\n=== TOUS LES TESTS RÉUSSIS ===\n');
  return true;
}

async function runAllTests() {
  console.log('========================================');
  console.log('VALIDATION FINALE - TOUS LES COMPTES');
  console.log('========================================\n');

  // Test bayala steve
  const bayalaSuccess = await testAccount('Landry', 'Password123!', 'steve', 'bayala');

  // Test Pierre Martin
  const pierreSuccess = await testAccount('testteacher1787382829205', 'TestPass123!', 'Pierre', 'Martin');

  console.log('========================================');
  console.log('RÉSUMÉ');
  console.log('========================================\n');
  console.log(`bayala steve: ${bayalaSuccess ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'}`);
  console.log(`Pierre Martin: ${pierreSuccess ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'}`);

  if (bayalaSuccess && pierreSuccess) {
    console.log('\n=== TOUS LES TESTS RÉUSSIS ===\n');
    console.log('Identifiants pour le test final:');
    console.log('Compte 1 (bayala steve):');
    console.log('  Username: Landry');
    console.log('  Password: Password123!');
    console.log('\nCompte 2 (Pierre Martin):');
    console.log('  Username: testteacher1787382829205');
    console.log('  Password: TestPass123!');
  } else {
    console.log('\n=== CERTAINS TESTS ONT ÉCHOUÉ ===\n');
  }
}

runAllTests().then(() => process.exit(0));
