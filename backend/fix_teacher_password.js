const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function fixTeacherPassword() {
  console.log('=== Correction du mot de passe pour Jean Dupont ===\n');

  const userId = 'cf88a62d-5d65-492d-ba83-661437504b83';
  const newPassword = 'Password123!';

  console.log('Hashage du mot de passe...');
  const passwordHash = await bcrypt.hash(newPassword, 10);
  console.log('✅ Mot de passe hashé\n');

  console.log('Mise à jour du mot de passe dans la base...');
  const { error } = await supabase
    .from('users')
    .update({ password_hash: passwordHash })
    .eq('id', userId);

  if (error) {
    console.error('❌ Erreur:', error);
    return;
  }

  console.log('✅ Mot de passe mis à jour avec succès\n');
  console.log('Identifiants de connexion :');
  console.log(`Username: nouveauteacher1787381809426`);
  console.log(`Password: ${newPassword}\n`);
}

fixTeacherPassword().then(() => process.exit(0));
