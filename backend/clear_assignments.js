const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function clearAssignments() {
  console.log('=== Suppression des affectations existantes ===\n');
  
  try {
    const { error } = await supabase
      .from('teacher_class_assignments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (error) {
      console.log('Erreur:', error.message);
    } else {
      console.log('✅ Affectations supprimées');
    }
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

clearAssignments().then(() => process.exit(0));