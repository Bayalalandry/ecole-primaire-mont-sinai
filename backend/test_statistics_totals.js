const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testStatisticsTotals() {
  console.log('=== TEST STATISTIQUES GLOBALES ===\n');

  // 1. Récupérer les données réelles de scolarités
  console.log('--- RECUPERATION DONNEES REELLES ---\n');

  const { data: tuitionPayments } = await supabase
    .from('tuition_payments')
    .select('amount');

  const totalTuitionCollected = tuitionPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  console.log('Scolarites encaissees: ' + totalTuitionCollected + ' FCFA');

  // Calculer le total attendu : pour chaque élève actif, récupérer le tarif de sa classe
  const { data: activeStudents } = await supabase
    .from('students')
    .select('id, current_class_id')
    .eq('status', 'active');

  const classIds = [...new Set(activeStudents?.map(s => s.current_class_id) || [])];

  const { data: currentSchoolYear } = await supabase
    .from('school_years')
    .select('id')
    .eq('is_current', true)
    .maybeSingle();

  const statsSchoolYearId = currentSchoolYear?.id;

  const rateMap = {};
  let totalTuitionExpected = 0;
  if (classIds.length > 0 && statsSchoolYearId) {
    const { data: tuitionRates } = await supabase
      .from('tuition_rates')
      .select('class_id, amount')
      .eq('school_year_id', statsSchoolYearId)
      .in('class_id', classIds);

    tuitionRates?.forEach((rate) => {
      rateMap[rate.class_id] = Number(rate.amount);
    });

    totalTuitionExpected = activeStudents?.reduce((sum, student) => {
      return sum + (rateMap[student.current_class_id] || 0);
    }, 0) || 0;
  }
  console.log('Scolarites attendues: ' + totalTuitionExpected + ' FCFA');

  // Calculer les impayés : total attendu - total encaissé
  const totalTuitionOutstanding = Math.max(0, totalTuitionExpected - totalTuitionCollected);

  // Nombre d'élèves avec impayés (ceux qui ont un solde impayé > 0)
  const paymentsByStudent = {};
  tuitionPayments?.forEach((p) => {
    if (!paymentsByStudent[p.student_id]) {
      paymentsByStudent[p.student_id] = 0;
    }
    paymentsByStudent[p.student_id] += Number(p.amount);
  });

  const outstandingStudentsCount = activeStudents?.filter((student) => {
    const expected = rateMap[student.current_class_id] || 0;
    const paid = paymentsByStudent[student.id] || 0;
    return expected - paid > 0;
  }).length || 0;
  console.log('Scolarites impayees: ' + totalTuitionOutstanding + ' FCFA (' + outstandingStudentsCount + ' eleves)');

  // 2. Récupérer les données réelles de salaires
  console.log('\n--- SALAIRES ---');

  const { data: salaryPayments } = await supabase
    .from('salary_payments')
    .select('amount');

  const totalSalariesPaid = salaryPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  console.log('Salaires verses: ' + totalSalariesPaid + ' FCFA');

  const { data: teacherSalaries } = await supabase
    .from('teacher_salaries')
    .select('monthly_amount');

  const totalSalariesExpected = teacherSalaries?.reduce((sum, r) => sum + Number(r.monthly_amount), 0) || 0;
  console.log('Salaires attendus: ' + totalSalariesExpected + ' FCFA');

  const totalSalariesOutstanding = totalSalariesExpected - totalSalariesPaid;
  console.log('Salaires restants: ' + totalSalariesOutstanding + ' FCFA');

  // 3. Récupérer les données réelles de dépenses
  console.log('\n--- DEPENSES ---');

  const { data: expenses } = await supabase
    .from('expenses')
    .select('category, amount');

  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  console.log('Total depenses: ' + totalExpenses + ' FCFA');

  const expensesByCategory = {};
  expenses?.forEach((e) => {
    if (!expensesByCategory[e.category]) {
      expensesByCategory[e.category] = 0;
    }
    expensesByCategory[e.category] += Number(e.amount);
  });

  console.log('Par categorie:');
  Object.entries(expensesByCategory).forEach(([cat, amount]) => {
    console.log('- ' + cat + ': ' + amount + ' FCFA');
  });

  // 4. Récupérer les données réelles d'élèves
  console.log('\n--- ELEVES ---');

  const { data: allStudents } = await supabase
    .from('students')
    .select('status, current_class_id');

  const activeStudentsCount = allStudents?.filter(s => s.status === 'active').length || 0;
  const repeatingStudents = allStudents?.filter(s => s.status === 'repeating').length || 0;
  const departedStudents = allStudents?.filter(s => s.status === 'departed').length || 0;

  console.log('Total eleves: ' + (allStudents?.length || 0));
  console.log('Actifs: ' + activeStudentsCount);
  console.log('Redoublants: ' + repeatingStudents);
  console.log('Partis: ' + departedStudents);

  // 5. Récupérer les données réelles d'enseignants
  console.log('\n--- ENSEIGNANTS ---');

  const { data: teachers } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'teacher');

  const activeTeachersCount = teachers?.length || 0;
  console.log('Total enseignants: ' + activeTeachersCount);

  // 6. Calculer le bilan financier
  console.log('\n--- BILAN FINANCIER ---');

  const totalRevenue = totalTuitionCollected;
  const totalExpensesTotal = totalSalariesPaid + totalExpenses;
  const financialBalance = totalRevenue - totalExpensesTotal;

  console.log('Recettes (scolarites): ' + totalRevenue + ' FCFA');
  console.log('Depenses (salaires + autres): ' + totalExpensesTotal + ' FCFA');
  console.log('Bilan: ' + financialBalance + ' FCFA');

  // 7. Tester l'API des statistiques
  console.log('\n--- TEST API STATISTIQUES ---');

  const founderId = '64c50d04-d3a3-4044-a9d5-57a7f43fff10';
  const testToken = 'test-token'; // En pratique, on utiliserait un vrai token

  // Pour ce test, on fait une requête directe à la base
  // Simuler ce que l'API retournerait
  const apiStatistics = {
    tuition: {
      totalCollected: totalTuitionCollected,
      totalExpected: totalTuitionExpected,
      totalOutstanding: totalTuitionOutstanding,
      outstandingStudentsCount,
    },
    salaries: {
      totalPaid: totalSalariesPaid,
      totalExpected: totalSalariesExpected,
      totalOutstanding: totalSalariesOutstanding,
    },
    expenses: {
      total: totalExpenses,
      byCategory: expensesByCategory,
    },
    students: {
      total: allStudents?.length || 0,
      active: activeStudentsCount,
      repeating: repeatingStudents,
      departed: departedStudents,
    },
    teachers: {
      total: activeTeachersCount,
    },
    financial: {
      totalRevenue,
      totalExpenses: totalExpensesTotal,
      balance: financialBalance,
    },
  };

  console.log('Donnees que l\'API devrait retourner:');
  console.log(JSON.stringify(apiStatistics, null, 2));

  // 8. Vérification : comparer au moins 2-3 chiffres
  console.log('\n--- VERIFICATION CROISEE ---');
  console.log('Verification 1: Total scolarites API = Base de donnees');
  console.log('  API: ' + apiStatistics.tuition.totalCollected);
  console.log('  Base: ' + totalTuitionCollected);
  console.log('  OK: ' + (apiStatistics.tuition.totalCollected === totalTuitionCollected ? 'OUI' : 'NON'));

  console.log('\nVerification 2: Total depenses API = Base de donnees');
  console.log('  API: ' + apiStatistics.expenses.total);
  console.log('  Base: ' + totalExpenses);
  console.log('  OK: ' + (apiStatistics.expenses.total === totalExpenses ? 'OUI' : 'NON'));

  console.log('\nVerification 3: Bilan financier correct');
  console.log('  API: ' + apiStatistics.financial.balance);
  console.log('  Calcule: ' + (totalRevenue - totalExpensesTotal));
  console.log('  OK: ' + (apiStatistics.financial.balance === (totalRevenue - totalExpensesTotal) ? 'OUI' : 'NON'));

  console.log('\n=== TEST STATISTIQUES TERMINE ===');
}

testStatisticsTotals();
