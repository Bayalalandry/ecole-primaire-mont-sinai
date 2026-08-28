const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testImmutability() {
  console.log('=== TEST IMMUTABILITÉ APRÈS VALIDATION ===\n');

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

  // TEST 1: Essayer de modifier une moyenne après validation
  console.log('\n--- TEST 1: Modification moyenne apres validation ---');
  const { error: gradeError } = await supabase
    .from('student_annual_grades')
    .update({ final_grade: 9 })
    .eq('student_id', student.id)
    .eq('school_year_id', schoolYearData.id);

  if (gradeError) {
    console.log('✅ Modification moyenne BLOQUEE (comportement attendu)');
    console.log(`   Erreur: ${gradeError.message}`);
  } else {
    console.log('❌ Modification moyenne PERMISE (probleme!)');
  }

  // TEST 2: Essayer de modifier une décision de passage
  console.log('\n--- TEST 2: Modification decision apres validation ---');
  const { data: decision } = await supabase
    .from('passage_decisions')
    .select('id')
    .eq('student_id', student.id)
    .eq('school_year_id', schoolYearData.id)
    .maybeSingle();

  if (decision) {
    const { error: decisionError } = await supabase
      .from('passage_decisions')
      .update({ final_status: 'passed' })
      .eq('id', decision.id);

    if (decisionError) {
      console.log('✅ Modification decision BLOQUEE (comportement attendu)');
      console.log(`   Erreur: ${decisionError.message}`);
    } else {
      console.log('❌ Modification decision PERMISE (probleme!)');
    }
  } else {
    console.log('Aucune decision trouvee pour cet eleve');
  }

  // TEST 3: Vérifier si une nouvelle validation est possible
  console.log('\n--- TEST 3: Nouvelle validation apres validation ---');
  const { error: newDecisionError } = await supabase
    .from('passage_decisions')
    .upsert({
      student_id: student.id,
      school_year_id: schoolYearData.id,
      class_id: cm2Class.id,
      proposed_status: 'passed',
      final_status: 'passed',
      validated_by: '64c50d04-d3a3-4044-a9d5-57a7f43fff10',
      validated_at: new Date().toISOString(),
      notes: 'Tentative de revalidation',
    });

  if (newDecisionError) {
    console.log('✅ Revalidation BLOQUEE (comportement attendu)');
    console.log(`   Erreur: ${newDecisionError.message}`);
  } else {
    console.log('❌ Revalidation PERMISE (probleme!)');
  }

  console.log('\n=== TEST IMMUTABILITÉ TERMINE ===');
  console.log('\nNOTE: Actuellement, le systeme ne bloque pas explicitement');
  console.log('les modifications apres validation. Il faudrait ajouter:');
  console.log('1. Une colonne "is_validated" dans passage_decisions');
  console.log('2. Un trigger ou une contrainte pour empecher les modifications');
  console.log('3. Ou une verification backend avant chaque modification');
}

testImmutability();
