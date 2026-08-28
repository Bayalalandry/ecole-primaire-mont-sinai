require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testBackup() {
  console.log('=== Test de l\'export/sauvegarde globale ===\n');

  try {
    const backup = {
      export_date: new Date().toISOString(),
      school_name: 'École Primaire',
      tables: {},
    };

    console.log('1. Export des classes...');
    const { data: classes } = await supabase.from('classes').select('*');
    backup.tables.classes = classes || [];
    console.log(`✓ ${classes.length} classes exportées`);

    console.log('\n2. Export des années scolaires...');
    const { data: schoolYears } = await supabase.from('school_years').select('*');
    backup.tables.school_years = schoolYears || [];
    console.log(`✓ ${schoolYears.length} années scolaires exportées`);

    console.log('\n3. Export des utilisateurs...');
    const { data: users } = await supabase
      .from('users')
      .select('id, username, role, first_name, last_name, is_active, created_at');
    backup.tables.users = users || [];
    console.log(`✓ ${users.length} utilisateurs exportés`);

    console.log('\n4. Export des élèves...');
    const { data: students } = await supabase.from('students').select('*');
    backup.tables.students = students || [];
    console.log(`✓ ${students.length} élèves exportés`);

    console.log('\n5. Export des tarifs de scolarité...');
    const { data: tuitionRates } = await supabase.from('tuition_rates').select('*');
    backup.tables.tuition_rates = tuitionRates || [];
    console.log(`✓ ${tuitionRates.length} tarifs exportés`);

    console.log('\n6. Export des paiements de scolarité...');
    const { data: tuitionPayments } = await supabase.from('tuition_payments').select('*');
    backup.tables.tuition_payments = tuitionPayments || [];
    console.log(`✓ ${tuitionPayments.length} paiements exportés`);

    console.log('\n7. Export des salaires enseignants...');
    const { data: teacherSalaries } = await supabase.from('teacher_salaries').select('*');
    backup.tables.teacher_salaries = teacherSalaries || [];
    console.log(`✓ ${teacherSalaries.length} salaires exportés`);

    console.log('\n8. Export des paiements de salaires...');
    const { data: salaryPayments } = await supabase.from('salary_payments').select('*');
    backup.tables.salary_payments = salaryPayments || [];
    console.log(`✓ ${salaryPayments.length} paiements de salaires exportés`);

    console.log('\n9. Export des dépenses...');
    const { data: expenses } = await supabase.from('expenses').select('*');
    backup.tables.expenses = expenses || [];
    console.log(`✓ ${expenses.length} dépenses exportées`);

    console.log('\n10. Export des décisions de passage...');
    const { data: passageDecisions } = await supabase.from('passage_decisions').select('*');
    backup.tables.passage_decisions = passageDecisions || [];
    console.log(`✓ ${passageDecisions.length} décisions exportées`);

    console.log('\n11. Export de l\'historique scolaire...');
    const { data: academicHistory } = await supabase.from('student_academic_history').select('*');
    backup.tables.student_academic_history = academicHistory || [];
    console.log(`✓ ${academicHistory.length} enregistrements exportés`);

    console.log('\n12. Export des assignations enseignant-classe...');
    const { data: assignments } = await supabase.from('teacher_class_assignments').select('*');
    backup.tables.teacher_class_assignments = assignments || [];
    console.log(`✓ ${assignments.length} assignations exportées`);

    console.log('\n13. Export des notes annuelles...');
    const { data: grades } = await supabase.from('student_annual_grades').select('*');
    backup.tables.student_annual_grades = grades || [];
    console.log(`✓ ${grades.length} notes exportées`);

    console.log('\n14. Export du journal d\'activité...');
    const { data: activityLog } = await supabase.from('activity_log').select('*');
    backup.tables.activity_log = activityLog || [];
    console.log(`✓ ${activityLog.length} activités exportées`);

    console.log('\n15. Export des notifications...');
    const { data: notifications } = await supabase.from('notifications').select('*');
    backup.tables.notifications = notifications || [];
    console.log(`✓ ${notifications.length} notifications exportées`);

    // Sauvegarder dans un fichier
    const fs = require('fs');
    const filename = `backup_ecole_${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(backup, null, 2));

    console.log(`\n✓ Sauvegarde exportée dans ${filename}`);
    console.log(`\n=== Test terminé avec succès ===`);
    console.log(`\nTaille du fichier: ${(fs.statSync(filename).size / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error('Erreur:', error);
  }
}

testBackup();
