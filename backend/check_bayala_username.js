const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkBayalaUsername() {
  console.log('=== Vérification du username de bayala steve ===\n');

  const { data: user } = await supabase
    .from('users')
    .select('id, username, last_name, first_name')
    .eq('last_name', 'bayala')
    .eq('first_name', 'steve')
    .single();

  if (!user) {
    console.error('❌ bayala steve non trouvé');
    return;
  }

  console.log('Informations utilisateur:');
  console.log(`ID: ${user.id}`);
  console.log(`Username: ${user.username}`);
  console.log(`Nom: ${user.last_name} ${user.first_name}\n`);
}

checkBayalaUsername().then(() => process.exit(0));
