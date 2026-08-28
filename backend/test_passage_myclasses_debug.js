const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testPassageMyClassesDebug() {
  console.log('=== Debug API /api/passage/my-classes ===\n');

  // Simuler la connexion de bayala steve
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('last_name', 'bayala')
    .eq('first_name', 'steve')
    .single();

  if (!user) {
    console.error('❌ bayala steve non trouvé');
    return;
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_SECRET || 'your_jwt_secret_key',
    { expiresIn: '24h' }
  );

  console.log('bayala steve ID:', user.id);

  // Vérifier l'année scolaire
  const { data: currentYear } = await supabase
    .from('school_years')
    .select('*')
    .eq('is_current', true)
    .single();

  console.log('Année scolaire actuelle:', currentYear);

  // Vérifier les assignations directement
  const { data: assignments } = await supabase
    .from('teacher_class_assignments')
    .select('*')
    .eq('teacher_id', user.id);

  console.log('Assignations bayala steve:', assignments);

  // Tester avec différents paramètres
  console.log('\n=== Test 1: Sans paramètre schoolYear ===');
  let response = await fetch('http://localhost:5000/api/passage/my-classes', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  let data = await response.json();
  console.log('Résultat:', data);

  console.log('\n=== Test 2: Avec schoolYear=2026-2027 ===');
  response = await fetch('http://localhost:5000/api/passage/my-classes?schoolYear=2026-2027', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  data = await response.json();
  console.log('Résultat:', data);

  console.log('\n=== Test 3: Avec schoolYear vide ===');
  response = await fetch('http://localhost:5000/api/passage/my-classes?schoolYear=', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  data = await response.json();
  console.log('Résultat:', data);
}

testPassageMyClassesDebug().then(() => process.exit(0));
