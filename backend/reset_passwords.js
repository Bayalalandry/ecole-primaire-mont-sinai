const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function resetPasswords() {
  console.log('=== Réinitialisation des mots de passe ===');
  
  const users = ['DONALD', 'ALEX', 'Inno'];
  const newPassword = 'nouveau123'; // Mot de passe temporaire simple
  
  for (const username of users) {
    try {
      // Chercher l'utilisateur
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();
      
      if (error) {
        console.log(`❌ Erreur pour ${username}:`, error.message);
        continue;
      }
      
      if (!user) {
        console.log(`❌ Utilisateur ${username} non trouvé`);
        continue;
      }
      
      // Hasher le nouveau mot de passe
      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      // Mettre à jour le mot de passe
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('id', user.id)
        .select()
        .maybeSingle();
      
      if (updateError) {
        console.log(`❌ Erreur lors de la mise à jour pour ${username}:`, updateError.message);
        continue;
      }
      
      console.log(`✅ ${username} (${user.first_name} ${user.last_name}, ${user.role})`);
      console.log(`   Nouveau mot de passe: ${newPassword}`);
      console.log(`   Nom d'utilisateur: ${user.username}`);
      console.log('');
      
    } catch (error) {
      console.log(`❌ Exception pour ${username}:`, error.message);
    }
  }
  
  console.log('=== IMPORTANT ===');
  console.log('Connectez-vous avec ces nouveaux mots de passe');
  console.log('Puis changez-les immédiatement dans votre profil');
}

resetPasswords().then(() => process.exit(0));