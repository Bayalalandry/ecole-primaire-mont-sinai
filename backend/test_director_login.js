const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testDirectorLogin() {
  console.log('=== TEST LOGIN DIRECTEUR ===\n');

  try {
    const { data: director } = await supabase
      .from('users')
      .select('id, username, password_hash')
      .eq('role', 'director')
      .maybeSingle();

    if (director) {
      console.log('Directeur:', director.username);
      console.log('ID:', director.id);
      console.log('Password hash (début):', director.password_hash.substring(0, 20) + '...');
    } else {
      console.log('Aucun directeur trouvé');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

testDirectorLogin();
