const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function resetSecretaryPassword() {
  console.log('=== Réinitialisation du mot de passe secrétaire ===\n');

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'Bayalalandry')
      .maybeSingle();

    if (error) {
      console.log('Erreur:', error.message);
      return;
    }

    if (!user) {
      console.log('Utilisateur Bayalalandry non trouvé');
      return;
    }

    console.log('Utilisateur trouvé:', user.first_name, user.last_name);

    // Nouveau mot de passe
    const newPassword = 'test123';
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', user.id);

    if (updateError) {
      console.log('Erreur lors de la mise à jour:', updateError.message);
      return;
    }

    console.log('✅ Mot de passe réinitialisé');
    console.log(`   Nouveau mot de passe: ${newPassword}`);

  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

resetSecretaryPassword().then(() => process.exit(0));
