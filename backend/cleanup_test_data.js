/**
 * Script pour nettoyer les données de test
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erreur: SUPABASE_URL et SUPABASE_ANON_KEY doivent être définis dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupTestData() {
  console.log('🧹 Nettoyage des données de test...\n');

  try {
    // Supprimer l'élève de test
    const { data: testStudents } = await supabase
      .from('students')
      .select('id')
      .like('unique_identifier', 'TEST%');

    if (testStudents && testStudents.length > 0) {
      const studentIds = testStudents.map(s => s.id);
      await supabase
        .from('students')
        .delete()
        .in('id', studentIds);
      console.log(`✅ ${testStudents.length} élève(s) de test supprimé(s)`);
    }

    // Supprimer l'assignation de test
    const { data: testAssignments } = await supabase
      .from('teacher_class_assignments')
      .select('id')
      .like('teacher_id', 'aedcea25-5586-42f9-873a-a7ca5c9b7844');

    if (testAssignments && testAssignments.length > 0) {
      const assignmentIds = testAssignments.map(a => a.id);
      await supabase
        .from('teacher_class_assignments')
        .delete()
        .in('id', assignmentIds);
      console.log(`✅ ${testAssignments.length} assignation(s) de test supprimée(s)`);
    }

    // Supprimer l'entrée teachers de test
    await supabase
      .from('teachers')
      .delete()
      .eq('user_id', 'aedcea25-5586-42f9-873a-a7ca5c9b7844');
    console.log(`✅ Entrée teachers de test supprimée`);

    // Supprimer l'enseignant de test
    await supabase
      .from('users')
      .delete()
      .eq('id', 'aedcea25-5586-42f9-873a-a7ca5c9b7844');
    console.log(`✅ Enseignant de test supprimé`);

    // Supprimer le fondateur de test
    await supabase
      .from('users')
      .delete()
      .eq('id', 'a07696eb-da9e-404d-aa9e-6207cacc0832');
    console.log(`✅ Fondateur de test supprimé`);

    console.log('\n✅ Nettoyage terminé !');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

cleanupTestData();
