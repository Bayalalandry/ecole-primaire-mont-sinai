const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function resetBayalaPassword() {
  console.log('=== Réinitialisation du mot de passe de bayala steve ===\n');

  const newPassword = 'Password123!';

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('last_name', 'bayala')
    .eq('first_name', 'steve')
    .single();

  if (!user) {
    console.error('❌ bayala steve non trouvé');
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  const { error } = await supabase
    .from('users')
    .update({ password_hash: passwordHash })
    .eq('id', user.id);

  if (error) {
    console.error('❌ Erreur:', error);
    return;
  }

  console.log('✅ Mot de passe réinitialisé');
  console.log('Username: bayala_steve');
  console.log(`Password: ${newPassword}\n`);
}

resetBayalaPassword().then(() => process.exit(0));
