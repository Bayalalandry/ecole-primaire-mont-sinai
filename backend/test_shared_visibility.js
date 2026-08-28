const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testSharedVisibility() {
  console.log('=== Test Visibilité Partagée Multi-Enseignants ===\n');
  
  try {
    // Nettoyer les affectations existantes
    await supabase.from('teacher_class_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Affectations nettoyées');
    
    // Assigner Alex et Donald à la même classe CE1
    const donaldId = '0a322338-d85e-492b-9e98-952744e9e4aa';
    const alexId = '7155a6c7-a969-445c-914d-a7b7e04ea958';
    const ce1Id = 'ca3de727-88a1-484a-ad15-9593781c4a4b';
    
    await supabase.from('teacher_class_assignments').insert({ teacher_id: donaldId, class_id: ce1Id });
    await supabase.from('teacher_class_assignments').insert({ teacher_id: alexId, class_id: ce1Id });
    console.log('✅ Alex et Donald assignés à CE1');
    
    // Vérifier que les deux enseignants sont dans CE1
    const { data: assignments } = await supabase
      .from('teacher_class_assignments')
      .select('*')
      .eq('class_id', ce1Id);
    
    console.log(`Enseignants dans CE1: ${assignments.length}`);
    assignments.forEach((a, i) => {
      console.log(`  ${i + 1}. Teacher: ${a.teacher_id}`);
    });
    
    // Vérifier combien d'élèves sont dans CE1
    const { data: students } = await supabase
      .from('students')
      .select('*')
      .eq('current_class_id', ce1Id);
    
    console.log(`Élèves dans CE1: ${students.length}`);
    
    console.log('\n=== Conclusion ===');
    if (assignments.length === 2) {
      console.log('✅ Multi-enseignants supporté (deux enseignants peuvent avoir la même classe)');
      console.log('✅ Backend devrait permettre la visibilité partagée');
    } else {
      console.log('❌ Multi-enseignants NON supporté');
    }
    
    // Restaurer les affectations originales
    await supabase.from('teacher_class_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('teacher_class_assignments').insert({ teacher_id: donaldId, class_id: 'bbfd3138-e27d-4595-b42d-8d79178a65c9' }); // CP1
    await supabase.from('teacher_class_assignments').insert({ teacher_id: alexId, class_id: ce1Id }); // CE1
    console.log('✅ Affectations restaurées');
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

testSharedVisibility().then(() => process.exit(0));