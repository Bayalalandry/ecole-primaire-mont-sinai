const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function listUsers() {
  console.log('=== Utilisateurs existants ===');
  
  const { data: users, error } = await supabase
    .from('users')
    .select('id, username, first_name, last_name, role, is_active')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.log('Erreur:', error.message);
    return;
  }
  
  if (!users || users.length === 0) {
    console.log('Aucun utilisateur trouvé');
    return;
  }
  
  console.log(`Total utilisateurs: ${users.length}`);
  console.log('');
  
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.username}`);
    console.log(`   Nom: ${user.first_name} ${user.last_name}`);
    console.log(`   Rôle: ${user.role}`);
    console.log(`   Actif: ${user.is_active ? 'Oui' : 'Non'}`);
    console.log(`   ID: ${user.id}`);
    console.log('');
  });
}

listUsers().then(() => process.exit(0));