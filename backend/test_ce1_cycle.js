const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testCE1ToCE2Cycle() {
  console.log('=== TEST CYCLE COMPLET CE1 → CE2 ===\n');

  const schoolYear = '2026-2027';
  const className = 'CE1';

  // ÉTAPE 1: Récupérer la classe CE1
  console.log('--- ETAPE 1: Recuperation de la classe CE1 ---');
  const { data: ce1Class } = await supabase
    .from('classes')
    .select('id, name, passing_grade')
    .eq('name', className)
    .single();

  console.log(`Classe CE1 ID: ${ce1Class.id}, Seuil de passage: ${ce1Class.passing_grade}/10`);

  // ÉTAPE 2: Récupérer l'ID de l'année scolaire
  const { data: schoolYearData } = await supabase
    .from('school_years')
    .select('id')
    .eq('year_label', schoolYear)
    .single();

  console.log(`Annee scolaire ID: ${schoolYearData.id}`);

  // ÉTAPE 3: Récupérer tous les élèves actifs de CE1
  console.log('\n--- ETAPE 2: Recuperation des eleves actifs ---');
  const { data: students } = await supabase
    .from('students')
    .select('id, unique_identifier, matricule, first_name, last_name, status')
    .eq('current_class_id', ce1Class.id)
    .eq('status', 'active');

  console.log(`Total eleves actifs: ${students.length}`);
  students.forEach(s => {
    console.log(`- ${s.first_name} ${s.last_name} (${s.matricule})`);
  });

  if (students.length === 0) {
    console.log('ERREUR: Aucun eleve actif dans la classe CE1');
    return;
  }

  // ÉTAPE 4: Simuler la saisie des moyennes par l'enseignant
  console.log('\n--- ETAPE 3: Saisie des moyennes (simulation) ---');
  const mockGrades = {
    [students[0].id]: 8, // Admis
    [students[1].id]: 6, // Admis
    [students[2].id]: 4, // Redoublant
    [students[3].id]: 3, // Redoublant
  };

  const teacherId = '7155a6c7-a969-445c-914d-a7b7e04ea958'; // ALEX

  for (const [studentId, grade] of Object.entries(mockGrades)) {
    const student = students.find(s => s.id === studentId);
    const { error } = await supabase
      .from('student_annual_grades')
      .upsert({
        student_id: studentId,
        school_year_id: schoolYearData.id,
        final_grade: grade,
        recorded_by: teacherId,
      });

    if (error) {
      console.error(`Erreur pour ${student.first_name} ${student.last_name}:`, error);
    } else {
      console.log(`OK ${student.first_name} ${student.last_name}: ${grade}/10`);
    }
  }

  // ÉTAPE 5: Vérifier que les moyennes sont enregistrées
  console.log('\n--- ETAPE 4: Verification des moyennes enregistrees ---');
  const { data: grades } = await supabase
    .from('student_annual_grades')
    .select('student_id, final_grade')
    .eq('school_year_id', schoolYearData.id);

  console.log(`Moyennes enregistrees: ${grades.length}`);
  grades.forEach(g => {
    const student = students.find(s => s.id === g.student_id);
    console.log(`- ${student.first_name} ${student.last_name}: ${g.final_grade}/10`);
  });

  // ÉTAPE 6: Générer les propositions (calculer les statuts)
  console.log('\n--- ETAPE 5: Generation des propositions ---');
  const proposals = students.map(student => {
    const gradeRecord = grades.find(g => g.student_id === student.id);
    const grade = gradeRecord ? gradeRecord.final_grade : null;
    const proposedStatus = grade >= ce1Class.passing_grade ? 'passed' : 'repeating';

    return {
      student_id: student.id,
      student_name: `${student.first_name} ${student.last_name}`,
      grade: grade,
      proposed_status: proposedStatus,
    };
  });

  console.log('Propositions generees:');
  proposals.forEach(p => {
    console.log(`- ${p.student_name}: ${p.grade}/10 -> ${p.proposed_status}`);
  });

  // ÉTAPE 7: Modifier manuellement un statut (simulation)
  console.log('\n--- ETAPE 6: Modification manuelle d\'un statut ---');
  const redoublantStudent = proposals.find(p => p.proposed_status === 'repeating');
  if (redoublantStudent) {
    console.log(`Modification: ${redoublantStudent.student_name} de Redoublant -> Admis (manual override)`);
    redoublantStudent.proposed_status = 'passed';
    redoublantStudent.manual_override = true;
  }

  // ÉTAPE 8: Simuler la validation via l'API
  console.log('\n--- ETAPE 7: Validation du passage (via API) ---');

  // Préparer les décisions
  const decisions = proposals.map(p => ({
    studentId: p.student_id,
    proposedStatus: p.proposed_status,
    finalStatus: p.proposed_status,
    finalGrade: p.grade,
    notes: p.manual_override ? 'Modification manuelle' : null,
  }));

  console.log(`Decisions a valider: ${decisions.length}`);

  // Récupérer la classe suivante (CE2)
  const { data: nextClass } = await supabase
    .from('classes')
    .select('id')
    .eq('name', 'CE2')
    .maybeSingle();

  console.log(`Classe suivante (CE2) ID: ${nextClass?.id || 'N/A'}`);

  // Simuler la validation en insérant directement dans passage_decisions
  const founderId = '64c50d04-d3a3-4044-a9d5-57a7f43fff10'; // Inno

  for (const decision of decisions) {
    const { error } = await supabase
      .from('passage_decisions')
      .upsert({
        student_id: decision.studentId,
        school_year_id: schoolYearData.id,
        class_id: ce1Class.id,
        proposed_status: decision.proposedStatus,
        final_status: decision.finalStatus,
        validated_by: founderId,
        validated_at: new Date().toISOString(),
        notes: decision.notes,
      });

    if (error) {
      console.error(`Erreur decision pour ${decision.studentId}:`, error);
    } else {
      console.log(`OK Decision enregistree pour ${decision.studentId}`);
    }
  }

  // ÉTAPE 9: Mettre à jour les élèves selon les décisions
  console.log('\n--- ETAPE 8: Mise a jour des statuts des eleves ---');

  for (const decision of decisions) {
    const student = students.find(s => s.id === decision.studentId);

    if (decision.finalStatus === 'passed' && nextClass) {
      // Élève admis : passer à la classe supérieure
      const { error } = await supabase
        .from('students')
        .update({
          current_class_id: nextClass.id,
          status: 'active',
        })
        .eq('id', decision.studentId);

      if (error) {
        console.error(`Erreur passage ${student.first_name} ${student.last_name}:`, error);
      } else {
        console.log(`OK ${student.first_name} ${student.last_name} passe en CE2`);
      }

      // Ajouter à l'historique scolaire
      const { error: historyError } = await supabase
        .from('student_academic_history')
        .insert({
          student_id: decision.studentId,
          class_id: ce1Class.id,
          school_year_id: schoolYearData.id,
          final_grade: decision.finalGrade,
          status: 'passed',
        });

      if (historyError) {
        console.error(`Erreur historique pour ${student.first_name} ${student.last_name}:`, historyError);
      } else {
        console.log(`OK Historique ajoute pour ${student.first_name} ${student.last_name}`);
      }
    } else {
      // Redoublant : rester dans la même classe
      const { error } = await supabase
        .from('students')
        .update({
          status: 'repeating',
        })
        .eq('id', decision.studentId);

      if (error) {
        console.error(`Erreur redoublement ${student.first_name} ${student.last_name}:`, error);
      } else {
        console.log(`OK ${student.first_name} ${student.last_name} redouble en CE1`);
      }

      // Ajouter à l'historique scolaire
      const { error: historyError } = await supabase
        .from('student_academic_history')
        .insert({
          student_id: decision.studentId,
          class_id: ce1Class.id,
          school_year_id: schoolYearData.id,
          final_grade: decision.finalGrade,
          status: 'repeating',
        });

      if (historyError) {
        console.error(`Erreur historique pour ${student.first_name} ${student.last_name}:`, historyError);
      } else {
        console.log(`OK Historique ajoute pour ${student.first_name} ${student.last_name}`);
      }
    }
  }

  // ÉTAPE 10: Vérifier les résultats
  console.log('\n--- ETAPE 9: Verification des resultats ---');
  const { data: finalStudents } = await supabase
    .from('students')
    .select('id, first_name, last_name, status, current_class_id, school_year')
    .in('id', students.map(s => s.id));

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name');

  const getClass = (id) => classes.find(c => c.id === id)?.name || 'Inconnue';

  console.log('Statut final des eleves:');
  finalStudents.forEach(s => {
    const className = getClass(s.current_class_id);
    const statusText = s.status === 'repeating' ? 'Redouble' : 'Actif';
    console.log(`- ${s.first_name} ${s.last_name}: ${statusText} en ${className}`);
  });

  // Vérifier l'historique scolaire
  console.log('\n--- Verification historique scolaire ---');
  const { data: history } = await supabase
    .from('student_academic_history')
    .select('*, students(first_name, last_name)')
    .eq('school_year_id', schoolYearData.id)
    .eq('class_id', ce1Class.id);

  console.log(`Historique enregistre: ${history.length} entrees`);
  history.forEach(h => {
    console.log(`- ${h.students.first_name} ${h.students.last_name}: ${h.final_grade}/10 -> ${h.status}`);
  });

  console.log('\n=== TEST CE1 → CE2 TERMINE ===');
}

testCE1ToCE2Cycle();
