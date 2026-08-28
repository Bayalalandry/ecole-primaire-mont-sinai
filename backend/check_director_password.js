const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkDirectorPassword() {
  try {
    console.log('Vérification du compte directeur...');

    const { data: director, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'Directeur')
      .single();

    if (error || !director) {
      console.error('Erreur lors de la récupération du directeur:', error);
      return;
    }

    console.log('Directeur trouvé:');
    console.log('Username:', director.username);
    console.log('Role:', director.role);
    console.log('ID:', director.id);
    console.log('Mot de passe hashé (partiel):', director.password ? director.password.substring(0, 20) + '...' : 'Non défini');

  } catch (error) {
    console.error('Erreur inattendue:', error);
  }
}

checkDirectorPassword();