const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function getTeacherId() {
  const { data: teachers } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'teacher')
    .limit(1);

  if (teachers && teachers.length > 0) {
    return teachers[0].id;
  }
  return null;
}

async function testCompletePassageCycle() {
  console.log('=== TEST COMPLET DU CYCLE PASSAGE DE CLASSE ===\n');

  const schoolYear = '2026-2027';
  const className = 'CM2';

  // Récupérer un ID d'enseignant valide
  const teacherId = await getTeacherId();
  if (!teacherId) {
    console.log('ERREUR: Aucun enseignant trouve');
    return;
  }
  console.log(`Teacher ID: ${teacherId}`);

  // ÉTAPE 1: Récupérer la classe CM2
  console.log('\n--- ETAPE 1: Recuperation de la classe CM2 ---');
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
    [students[0].id]: 8, // Admis
    [students[1].id]: 6, // Admis
    [students[2].id]: 4, // Redoublant
    [students[3].id]: 3, // Redoublant
  };

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
  const propositions = students.map(student => {
    const gradeRecord = grades.find(g => g.student_id === student.id);
    const grade = gradeRecord ? gradeRecord.final_grade : null;
    const proposedStatus = grade >= cm2Class.passing_grade ? 'Admis' : 'Redoublant';

    return {
      student_id: student.id,
      student_name: `${student.first_name} ${student.last_name}`,
      grade: grade,
      proposed_status: proposedStatus,
    };
  });

  console.log('Propositions generees:');
  propositions.forEach(p => {
    console.log(`- ${p.student_name}: ${p.grade}/10 -> ${p.proposed_status}`);
  });

  // ÉTAPE 7: Modifier manuellement un statut (simulation)
  console.log('\n--- ETAPE 6: Modification manuelle d\'un statut ---');
  const redoublantStudent = propositions.find(p => p.proposed_status === 'Redoublant');
  if (redoublantStudent) {
    console.log(`Modification: ${redoublantStudent.student_name} de Redoublant -> Admis (manual override)`);
    redoublantStudent.proposed_status = 'Admis';
    redoublantStudent.manual_override = true;
  }

  // ÉTAPE 8: Valider le passage (simulation)
  console.log('\n--- ETAPE 7: Validation du passage ---');

  for (const prop of propositions) {
    if (prop.grade === null) {
      console.log(`WARNING: ${prop.student_name} n'a pas de moyenne - pas de validation`);
      continue;
    }

    const student = students.find(s => s.id === prop.student_id);

    if (className === 'CM2' && prop.proposed_status === 'Admis') {
      // Archiver l'élève (fin de cycle) - utiliser 'repeating' temporairement
      // NOTE: Il faut ajouter 'departed' à la contrainte students_status_check dans la base
      const { error } = await supabase
        .from('students')
        .update({
          status: 'repeating',
        })
        .eq('id', prop.student_id);

      if (error) {
        console.error(`Erreur archivage ${prop.student_name}:`, error);
      } else {
        console.log(`OK ${prop.student_name} archive (fin de cycle)`);
      }
    } else if (prop.proposed_status === 'Admis') {
      // Passer à la classe supérieure
      const { data: nextClass } = await supabase
        .from('classes')
        .select('id')
        .eq('name', getNextClassName(className))
        .maybeSingle();

      if (nextClass) {
        const { error } = await supabase
          .from('students')
          .update({
            current_class_id: nextClass.id,
            school_year: getNextSchoolYear(schoolYear),
          })
          .eq('id', prop.student_id);

        if (error) {
          console.error(`Erreur passage ${prop.student_name}:`, error);
        } else {
          console.log(`OK ${prop.student_name} passe en ${nextClass.name}`);
        }
      }
    } else {
      // Redoublement - rester dans la même classe
      const { error } = await supabase
        .from('students')
        .update({
          school_year: getNextSchoolYear(schoolYear),
        })
        .eq('id', prop.student_id);

      if (error) {
        console.error(`Erreur redoublement ${prop.student_name}:`, error);
      } else {
        console.log(`OK ${prop.student_name} redouble en ${className}`);
      }
    }
  }

  // ÉTAPE 9: Vérifier les résultats
  console.log('\n--- ETAPE 8: Verification des resultats ---');
  const { data: finalStudents } = await supabase
    .from('students')
    .select('id, first_name, last_name, status, current_class_id, school_year')
    .in('id', students.map(s => s.id));

  console.log('Statut final des eleves:');
  finalStudents.forEach(s => {
    let statusText = `Actif - ${s.school_year}`;
    if (s.status === 'repeating') {
      statusText = `Redouble - ${s.school_year}`;
    }
    console.log(`- ${s.first_name} ${s.last_name}: ${statusText}`);
  });

  console.log('\n=== TEST TERMINE ===');
}

function getNextClassName(currentClass) {
  const classOrder = ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'];
  const index = classOrder.indexOf(currentClass);
  if (index === -1 || index === classOrder.length - 1) return null;
  return classOrder[index + 1];
}

function getNextSchoolYear(currentYear) {
  const [startYear, endYear] = currentYear.split('-').map(Number);
  return `${startYear + 1}-${endYear + 1}`;
}

testCompletePassageCycle();
