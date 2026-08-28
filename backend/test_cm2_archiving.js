const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testCM2ArchivingCycle() {
  console.log('=== TEST CYCLE COMPLET CM2 (ARCHIVAGE) ===\n');

  const schoolYear = '2026-2027';
  const className = 'CM2';

  // ÉTAPE 1: Récupérer la classe CM2
  console.log('--- ETAPE 1: Recuperation de la classe CM2 ---');
  const { data: cm2Class } = await supabase
    .from('classes')
    .select('id, name, passing_grade')
    .eq('name', className)
    .single();

  console.log(`Classe CM2 ID: ${cm2Class.id}, Seuil de passage: ${cm2Class.passing_grade}/10`);

  // ÉTAPE 2: Récupérer l'ID de l'année scolaire
  const { data: schoolYearData } = await supabase
    .from('school_years')
    .select('id')
    .eq('year_label', schoolYear)
    .single();

  console.log(`Annee scolaire ID: ${schoolYearData.id}`);

  // ÉTAPE 3: Récupérer tous les élèves actifs de CM2
  console.log('\n--- ETAPE 2: Recuperation des eleves actifs ---');
  const { data: students } = await supabase
    .from('students')
    .select('id, unique_identifier, matricule, first_name, last_name, status')
    .eq('current_class_id', cm2Class.id)
    .eq('status', 'active');

  console.log(`Total eleves actifs: ${students.length}`);
  students.forEach(s => {
    console.log(`- ${s.first_name} ${s.last_name} (${s.matricule})`);
  });

  if (students.length === 0) {
    console.log('ERREUR: Aucun eleve actif dans la classe CM2');
    return;
  }

  // ÉTAPE 4: Simuler la saisie des moyennes par l'enseignant
  console.log('\n--- ETAPE 3: Saisie des moyennes (simulation) ---');
  const mockGrades = {
    [students[0].id]: 8, // Admis -> doit etre archive
    [students[1].id]: 6, // Admis -> doit etre archive
    [students[2].id]: 4, // Redoublant -> reste en CM2
    [students[3].id]: 3, // Redoublant -> reste en CM2
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
    const proposedStatus = grade >= cm2Class.passing_grade ? 'passed' : 'repeating';

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

  // ÉTAPE 7: Simuler la validation via l'API
  console.log('\n--- ETAPE 6: Validation du passage (via API) ---');

  // Préparer les décisions
  const decisions = proposals.map(p => ({
    studentId: p.student_id,
    proposedStatus: p.proposed_status,
    finalStatus: p.proposed_status,
    finalGrade: p.grade,
    notes: null,
  }));

  console.log(`Decisions a valider: ${decisions.length}`);

  // Simuler la validation en insérant directement dans passage_decisions
  const founderId = '64c50d04-d3a3-4044-a9d5-57a7f43fff10'; // Inno

  for (const decision of decisions) {
    const { error } = await supabase
      .from('passage_decisions')
      .upsert({
        student_id: decision.studentId,
        school_year_id: schoolYearData.id,
        class_id: cm2Class.id,
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

  // ÉTAPE 8: Mettre à jour les élèves selon les décisions
  console.log('\n--- ETAPE 7: Mise a jour des statuts des eleves ---');

  for (const decision of decisions) {
    const student = students.find(s => s.id === decision.studentId);

    if (decision.finalStatus === 'passed') {
      // CM2 admis : archiver comme 'departed' (fin de cycle)
      const { error } = await supabase
        .from('students')
        .update({
          status: 'departed',
          departure_reason: 'fin de cycle',
          departure_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', decision.studentId);

      if (error) {
        console.error(`Erreur archivage ${student.first_name} ${student.last_name}:`, error);
      } else {
        console.log(`OK ${student.first_name} ${student.last_name} archive (fin de cycle)`);
      }

      // Ajouter à l'historique scolaire
      const { error: historyError } = await supabase
        .from('student_academic_history')
        .insert({
          student_id: decision.studentId,
          class_id: cm2Class.id,
          school_year_id: schoolYearData.id,
          final_grade: decision.finalGrade,
          status: 'transferred',
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
        console.log(`OK ${student.first_name} ${student.last_name} redouble en CM2`);
      }

      // Ajouter à l'historique scolaire
      const { error: historyError } = await supabase
        .from('student_academic_history')
        .insert({
          student_id: decision.studentId,
          class_id: cm2Class.id,
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

  // ÉTAPE 9: Vérifier les résultats
  console.log('\n--- ETAPE 8: Verification des resultats ---');
  const { data: finalStudents } = await supabase
    .from('students')
    .select('id, first_name, last_name, status, current_class_id, departure_reason, departure_date')
    .in('id', students.map(s => s.id));

  console.log('Statut final des eleves:');
  finalStudents.forEach(s => {
    if (s.status === 'departed') {
      console.log(`- ${s.first_name} ${s.last_name}: Archive (${s.departure_reason}, ${s.departure_date})`);
    } else if (s.status === 'repeating') {
      console.log(`- ${s.first_name} ${s.last_name}: Redouble en CM2`);
    } else {
      console.log(`- ${s.first_name} ${s.last_name}: ${s.status}`);
    }
  });

  // Vérifier l'historique scolaire
  console.log('\n--- Verification historique scolaire ---');
  const { data: history } = await supabase
    .from('student_academic_history')
    .select('*, students(first_name, last_name)')
    .eq('school_year_id', schoolYearData.id)
    .eq('class_id', cm2Class.id);

  console.log(`Historique enregistre: ${history.length} entrees`);
  history.forEach(h => {
    console.log(`- ${h.students.first_name} ${h.students.last_name}: ${h.final_grade}/10 -> ${h.status}`);
  });

  console.log('\n=== TEST CM2 ARCHIVAGE TERMINE ===');
}

testCM2ArchivingCycle();
