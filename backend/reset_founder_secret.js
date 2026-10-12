const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function resetFounderSecret() {
  console.log('=== Réinitialisation de la réponse secrète du fondateur ===\n');

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'Laure')
      .maybeSingle();

    if (error) {
      console.log('Erreur:', error.message);
      return;
    }

    if (!user) {
      console.log('Utilisateur Laure non trouvé');
      return;
    }

    console.log('Utilisateur trouvé:', user.first_name, user.last_name);

    // Nouvelle réponse secrète
    const newSecretAnswer = 'test123';
    const secretAnswerHash = await bcrypt.hash(newSecretAnswer, 10);

    const { error: updateError } = await supabase
      .from('founder_settings')
      .update({ secret_answer_hash: secretAnswerHash })
      .eq('user_id', user.id);

    if (updateError) {
      console.log('Erreur lors de la mise à jour:', updateError.message);
      return;
    }

    console.log('✅ Réponse secrète réinitialisée');
    console.log(`   Nouvelle réponse secrète: ${newSecretAnswer}`);

    // Afficher la question secrète
    const { data: settings } = await supabase
      .from('founder_settings')
      .select('secret_question')
      .eq('user_id', user.id)
      .maybeSingle();

    if (settings) {
      console.log(`   Question secrète: ${settings.secret_question}`);
    }

  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

resetFounderSecret().then(() => process.exit(0));
