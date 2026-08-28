const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testPassageMyClassesDetailed() {
  console.log('=== Test détaillé API Passage My-Classes ===\n');

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
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'your_jwt_secret_key',
    { expiresIn: '24h' }
  );

  console.log('User ID:', user.id);
  console.log('Username:', user.username);
  console.log('Token:', token.substring(0, 50) + '...\n');

  try {
    const response = await fetch('http://localhost:5000/api/passage/my-classes', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (data.classes && data.classes.length > 0) {
      console.log('\n✅ Classes trouvées:');
      data.classes.forEach(c => console.log(`  - ${c.name}`));
    } else {
      console.log('\n❌ Aucune classe trouvée');
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testPassageMyClassesDetailed().then(() => process.exit(0));
