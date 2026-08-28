const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function resetFounderPassword() {
  console.log('=== Réinitialisation du mot de passe fondateur ===\n');
  
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'Inno')
      .maybeSingle();
    
    if (error) {
      console.log('Erreur:', error.message);
      return;
    }
    
    if (!user) {
      console.log('Utilisateur Innon trouvé');
      return;
    }
    
    console.log('Utilisateur trouvé:', user.first_name, user.last_name);
    
    // Nouveau mot de passe
    const newPassword = 'nouveau123';
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
    
    // Afficher la question secrète
    const { data: settings } = await supabase
      .from('founder_settings')
      .select('secret_question')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (settings) {
      console.log(`   Question secrète: ${settings.secret_question}`);
      console.log('   (Vous devez connaître la réponse pour vous connecter)');
    }
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

resetFounderPassword().then(() => process.exit(0));