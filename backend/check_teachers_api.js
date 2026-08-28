const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkTeachersAPI() {
  console.log('=== Test API Teachers ===\n');
  
  try {
    // Simuler la requête de l'API
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        username,
        first_name,
        last_name,
        role,
        is_active,
        created_at,
        teachers (
          status
        )
      `)
      .in('role', ['teacher', 'director'])
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Erreur:', error.message);
      return;
    }

    console.log(`Utilisateurs trouvés: ${data.length}`);
    data.forEach((u, i) => {
      console.log(`\n${i + 1}. ${u.first_name} ${u.last_name} (@${u.username})`);
      console.log(`   Role: ${u.role}`);
      console.log(`   Teachers info:`, u.teachers);
    });
    
    // Vérifier le directeur spécifiquement
    console.log('\n=== Vérification Directeur ===');
    const { data: director } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'director');
    
    if (director && director.length > 0) {
      console.log('Directeur trouvé:', director);
    } else {
      console.log('Aucun directeur trouvé');
    }
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

checkTeachersAPI().then(() => process.exit(0));