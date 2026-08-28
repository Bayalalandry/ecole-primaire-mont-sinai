const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testAssignSimple() {
  console.log('=== Test assignation simple ===\n');
  
  try {
    // Supprimer toutes les affectations existantes
    console.log('1. Suppression des affectations existantes...');
    await supabase
      .from('teacher_class_assignments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('✅ Affectations supprimees\n');
    
    // Créer une nouvelle affectation
    console.log('2. Creation nouvelle affectation...');
    const { error } = await supabase
      .from('teacher_class_assignments')
      .insert({
        teacher_id: '0a322338-d85e-492b-9e98-952744e9e4aa',
        class_id: 'ca3de727-88a1-484a-ad15-9593781c4a4b'
      });
    
    if (error) {
      console.log('Erreur:', error.message);
      console.log('Details:', error);
    } else {
      console.log('✅ Affectation creee avec succes');
    }
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

testAssignSimple().then(() => process.exit(0));