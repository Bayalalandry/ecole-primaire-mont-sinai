const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function getTeachersDirect() {
  console.log('=== Récupération directe des enseignants ===\n');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'teacher');
    
    if (error) {
      console.log('Erreur:', error.message);
      return;
    }
    
    console.log(`${data.length} enseignant(s) trouvé(s):`);
    data.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.first_name} ${t.last_name} (@${t.username}) - Actif: ${t.is_active}`);
    });
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

getTeachersDirect().then(() => process.exit(0));