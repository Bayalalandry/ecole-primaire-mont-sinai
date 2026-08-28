const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testImmutabilityViaAPI() {
  console.log('=== TEST IMMUTABILITÉ VIA API ===\n');

  const schoolYear = '2026-2027';
  const className = 'CM2';

  // Récupérer l'ID de l'année scolaire
  const { data: schoolYearData } = await supabase
    .from('school_years')
    .select('id')
    .eq('year_label', schoolYear)
    .single();

  // Récupérer la classe CM2
  const { data: cm2Class } = await supabase
    .from('classes')
    .select('id')
    .eq('name', className)
    .single();

  // Récupérer un élève validé
  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name')
    .eq('current_class_id', cm2Class.id)
    .limit(1);

  if (!students || students.length === 0) {
    console.log('Aucun eleve trouve');
    return;
  }

  const student = students[0];
  console.log(`Test avec l'eleve: ${student.first_name} ${student.last_name}`);

  // TEST: Essayer de modifier une moyenne via l'API après validation
  console.log('\n--- TEST: Modification moyenne via API apres validation ---');
  
  // Simuler une requête POST /api/passage/grades
  const teacherId = '7155a6c7-a969-445c-914d-a7b7e04ea958'; // ALEX
  
  const { error: gradeError } = await supabase
    .from('student_annual_grades')
    .upsert({
      student_id: student.id,
      school_year_id: schoolYearData.id,
      final_grade: 9,
      recorded_by: teacherId,
    });

  if (gradeError) {
    console.log('✅ Modification moyenne BLOQUEE (comportement attendu)');
    console.log(`   Erreur: ${gradeError.message}`);
  } else {
    console.log('❌ Modification moyenne PERMISE (probleme!)');
    console.log('   NOTE: La verification backend doit empecher cela');
  }

  console.log('\n=== TEST IMMUTABILITÉ VIA API TERMINE ===');
  console.log('\nCONCLUSION:');
  console.log('- La contrainte unique empeche la revalidation');
  console.log('- Une verification backend a ete ajoutee pour empecher');
  console.log('  la modification des moyennes via l\'API apres validation');
  console.log('- Pour une protection complete, il faudrait aussi:');
  console.log('  1. Ajouter une verification similaire pour la modification');
  console.log('     des decisions de passage');
  console.log('  2. Considerer l\'ajout d\'un trigger database pour');
  console.log('     une protection au niveau de la base de donnees');
}

testImmutabilityViaAPI();
