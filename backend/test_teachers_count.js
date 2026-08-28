const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testTeachersCount() {
  console.log('=== Vérification du nombre d\'enseignants ===\n');
  
  try {
    // Compter tous les utilisateurs avec rôle teacher
    const { data: teachers, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'teacher');
    
    if (error) {
      console.log('Erreur:', error.message);
      return;
    }
    
    console.log(`Total enseignants dans la base: ${teachers.length}`);
    console.log('\nDétail:');
    teachers.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.first_name} ${t.last_name} (@${t.username}) - Actif: ${t.is_active}`);
    });
    
    // Vérifier les enseignants en attente
    const { data: pendingTeachers } = await supabase
      .from('users')
      .select(`
        id,
        username,
        first_name,
        last_name,
        teachers (
          status
        )
      `)
      .eq('role', 'teacher');
    
    const pending = pendingTeachers?.filter((u) => u.teachers?.status === 'pending') || [];
    console.log(`\nEnseignants en attente: ${pending.length}`);
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

testTeachersCount().then(() => process.exit(0));