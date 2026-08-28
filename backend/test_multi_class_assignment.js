const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testMultiClassAssignment() {
  console.log('=== Test Assignation Multi-Classes ===\n');
  
  try {
    const donaldId = '0a322338-d85e-492b-9e98-952744e9e4aa';
    const cp1Id = 'bbfd3138-e27d-4595-b42d-8d79178a65c9';
    const ce1Id = 'ca3de727-88a1-484a-ad15-9593781c4a4b';
    
    // Actuellement Donald est assigné à CP1
    // Essayons de l'assigner aussi à CE1 (multi-classe)
    const { error: assignError } = await supabase
      .from('teacher_class_assignments')
      .insert({
        teacher_id: donaldId,
        class_id: ce1Id
      });
    
    if (assignError) {
      console.log('Erreur assignation multi-classe:', assignError.message);
      console.log('Cela peut être normal si la contrainte unique empêche multi-classes');
    } else {
      console.log('✅ Assignation multi-classe réussie');
    }
    
    // Vérifier les affectations actuelles de Donald
    const { data: assignments } = await supabase
      .from('teacher_class_assignments')
      .select('*')
      .eq('teacher_id', donaldId);
    
    console.log(`Assignations de Donald: ${assignments.length}`);
    assignments.forEach((a, i) => {
      console.log(`  ${i + 1}. Class: ${a.class_id}`);
    });
    
    // Vérifier si l'API supporte multi-classes
    console.log('\n=== Conclusion ===');
    if (assignments.length > 1) {
      console.log('✅ Multi-classes supporté (l\'enseignant peut avoir plusieurs classes)');
    } else {
      console.log('❌ Multi-classes NON supporté (limité à une classe par enseignant)');
    }
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

testMultiClassAssignment().then(() => process.exit(0));