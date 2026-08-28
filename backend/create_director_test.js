const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function createDirectorTest() {
  console.log('=== Creation compte directeur test ===\n');
  
  try {
    const password = 'nouveau123';
    const passwordHash = await bcrypt.hash(password, 10);
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        username: 'Directeur',
        password_hash: passwordHash,
        role: 'director',
        first_name: 'Directeur',
        last_name: 'Test',
        is_active: true
      })
      .select()
      .single();
    
    if (error) {
      console.log('Erreur:', error.message);
      return;
    }
    
    console.log('Compte directeur cree:');
    console.log(`   Username: ${data.username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Nom: ${data.first_name} ${data.last_name}`);
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

createDirectorTest().then(() => process.exit(0));