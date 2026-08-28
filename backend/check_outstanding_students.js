const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkOutstandingStudents() {
  console.log('=== VERIFICATION ELEVES IMPAYES ===\n');

  // Récupérer les paiements de scolarités
  const { data: tuitionPayments } = await supabase
    .from('tuition_payments')
    .select('student_id, amount');

  console.log('Paiements de scolarites:');
  console.log('Nombre de paiements: ' + (tuitionPayments?.length || 0));
  console.log('Total encaisse: ' + (tuitionPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0) + ' FCFA');

  // Élèves qui ont payé
  const paidStudentIds = new Set(tuitionPayments?.map(p => p.student_id) || []);
  console.log('Nombre d\'eleves differents qui ont paye: ' + paidStudentIds.size);

  // Récupérer les élèves actifs
  const { data: activeStudents } = await supabase
    .from('students')
    .select('id, first_name, last_name, current_class_id')
    .eq('status', 'active');

  console.log('\nEleves actifs: ' + (activeStudents?.length || 0));

  // Élèves impayés (ceux qui n'ont jamais payé)
  const unpaidStudents = activeStudents?.filter(s => !paidStudentIds.has(s.id));
  console.log('Eleves qui n\'ont JAMAIS paye: ' + (unpaidStudents?.length || 0));

  if (unpaidStudents && unpaidStudents.length > 0) {
    console.log('\nListe des eleves qui n\'ont jamais paye:');
    unpaidStudents.forEach(s => {
      console.log('- ' + s.first_name + ' ' + s.last_name);
    });
  }

  // Vérifier si certains élèves ont payé partiellement
  console.log('\n--- VERIFICATION PAIEMENTS PAR ELEVE ---');
  const paymentsByStudent = {};
  tuitionPayments?.forEach(p => {
    if (!paymentsByStudent[p.student_id]) {
      paymentsByStudent[p.student_id] = 0;
    }
    paymentsByStudent[p.student_id] += Number(p.amount);
  });

  console.log('Montants payes par eleve:');
  Object.entries(paymentsByStudent).forEach(([studentId, amount]) => {
    const student = activeStudents?.find(s => s.id === studentId);
    if (student) {
      console.log('- ' + student.first_name + ' ' + student.last_name + ': ' + amount + ' FCFA');
    }
  });

  // Récupérer les tarifs attendus par classe
  const { data: schoolYearWithRates } = await supabase
    .from('tuition_rates')
    .select('school_year_id')
    .limit(1)
    .maybeSingle();

  const classIds = [...new Set(activeStudents?.map(s => s.current_class_id) || [])];

  if (classIds.length > 0 && schoolYearWithRates) {
    const { data: tuitionRates } = await supabase
      .from('tuition_rates')
      .select('class_id, amount')
      .eq('school_year_id', schoolYearWithRates.school_year_id)
      .in('class_id', classIds);

    const rateMap = {};
    tuitionRates?.forEach((rate) => {
      rateMap[rate.class_id] = Number(rate.amount);
    });

    console.log('\n--- ANALYSE IMPAYES PAR ELEVE ---');
    let totalExpected = 0;
    let totalCollected = 0;
    let studentsWithOutstanding = 0;

    activeStudents?.forEach(student => {
      const expected = rateMap[student.current_class_id] || 0;
      const paid = paymentsByStudent[student.id] || 0;
      const outstanding = expected - paid;

      totalExpected += expected;
      totalCollected += paid;

      if (outstanding > 0) {
        studentsWithOutstanding++;
        console.log('- ' + student.first_name + ' ' + student.last_name + ':');
        console.log('  Attendu: ' + expected + ' FCFA');
        console.log('  Paye: ' + paid + ' FCFA');
        console.log('  Impaye: ' + outstanding + ' FCFA');
      }
    });

    console.log('\n--- RESUME ---');
    console.log('Total attendu: ' + totalExpected + ' FCFA');
    console.log('Total encaisse: ' + totalCollected + ' FCFA');
    console.log('Total impaye: ' + (totalExpected - totalCollected) + ' FCFA');
    console.log('Eleves avec impayes: ' + studentsWithOutstanding);
  }
}

checkOutstandingStudents();
