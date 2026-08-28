const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function setDirectorPassword() {
  try {
    console.log('Définition du mot de passe du directeur...');

    const newPassword = 'directeur123'; // Mot de passe simple pour les tests

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('Mot de passe hashé avec succès');

    // Mettre à jour le mot de passe du directeur
    const { error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('username', 'Directeur');

    if (error) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error);
      return;
    }

    console.log('✅ Succès ! Mot de passe du directeur défini');
    console.log('Username: Directeur');
    console.log('Mot de passe: directeur123');

  } catch (error) {
    console.error('Erreur inattendue:', error);
  }
}

setDirectorPassword();