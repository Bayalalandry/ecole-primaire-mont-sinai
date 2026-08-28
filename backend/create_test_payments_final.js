const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function createTestPayments() {
  try {
    console.log('=== Creation de donnees de test pour exports PDF ===\n');

    // 1. Recuperer un eleve actif
    const { data: students } = await supabase
      .from('students')
      .select('id, last_name, first_name, classes (name)')
      .eq('status', 'active')
      .limit(1);

    if (!students || students.length === 0) {
      console.log('Aucun eleve actif trouve pour creer des paiements de test.');
      return;
    }

    const student = students[0];
    console.log('Eleve utilise pour les paiements de scolarite:', `${student.last_name} ${student.first_name}`);

    // 2. Recuperer un enseignant
    const { data: teachers } = await supabase
      .from('users')
      .select('id, last_name, first_name, role')
      .in('role', ['teacher', 'director'])
      .limit(1);

    if (!teachers || teachers.length === 0) {
      console.log('Aucun enseignant trouve pour creer des paiements de salaires.');
      return;
    }

    const teacher = teachers[0];
    console.log('Enseignant utilise pour les paiements de salaires:', `${teacher.last_name} ${teacher.first_name} (${teacher.role})`);

    // 3. Recuperer l'utilisateur fondateur pour "enregistre par"
    const { data: founder } = await supabase
      .from('users')
      .select('id, last_name, first_name')
      .eq('role', 'founder')
      .limit(1);

    if (!founder || founder.length === 0) {
      console.log('Aucun fondateur trouve pour "enregistre par".');
      return;
    }

    const founderUser = founder[0];
    console.log('Fondateur utilise pour "enregistre par":', `${founderUser.last_name} ${founderUser.first_name}`);

    // 4. Recuperer l'annee scolaire actuelle
    const { data: schoolYears } = await supabase
      .from('school_years')
      .select('*')
      .limit(1);

    if (!schoolYears || schoolYears.length === 0) {
      console.log('Aucune annee scolaire trouvee.');
      return;
    }

    const schoolYear = schoolYears[0];
    console.log('Annee scolaire utilisee:', schoolYear.year_label);

    // 5. Creer des paiements de scolarite de test
    const receiptBase = 'SCOL-' + Date.now();

    const tuitionPayments = [
      {
        student_id: student.id,
        school_year_id: schoolYear.id,
        amount: 50000,
        payment_date: new Date().toISOString().split('T')[0],
        trimester: 1,
        receipt_number: receiptBase + '-001',
        created_by: founderUser.id
      },
      {
        student_id: student.id,
        school_year_id: schoolYear.id,
        amount: 50000,
        payment_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        trimester: 2,
        receipt_number: receiptBase + '-002',
        created_by: founderUser.id
      }
    ];

    console.log('\nCreation des paiements de scolarite...');
    for (const payment of tuitionPayments) {
      const { error } = await supabase
        .from('tuition_payments')
        .insert(payment);

      if (error) {
        console.error('Erreur lors de la creation du paiement de scolarite:', error);
      } else {
        console.log(`OK Paiement de scolarite cree: ${payment.receipt_number} - ${payment.amount} FCFA`);
      }
    }

    // 6. Creer d'abord un taux de salaire
    const salaryRate = {
      teacher_id: teacher.id,
      school_year_id: schoolYear.id,
      monthly_amount: 100000,
      effective_date: new Date().toISOString().split('T')[0]
    };

    console.log('\nCreation du taux de salaire...');
    const { data: salaryData, error: salaryError } = await supabase
      .from('teacher_salaries')
      .insert(salaryRate)
      .select()
      .single();

    if (salaryError) {
      console.error('Erreur lors de la creation du taux de salaire:', salaryError);
      // Essayer avec un autre nom de table
      const { data: salaryData2, error: salaryError2 } = await supabase
        .from('salaries')
        .insert(salaryRate)
        .select()
        .single();

      if (salaryError2) {
        console.error('Erreur avec table salaries aussi:', salaryError2);
        return;
      }
      console.log(`OK Taux de salaire cree (table salaries): ${salaryData2.monthly_amount} FCFA/mois`);
    } else {
      console.log(`OK Taux de salaire cree (table teacher_salaries): ${salaryData.monthly_amount} FCFA/mois`);
    }

    // 7. Creer des paiements de salaires de test
    const salaryReceiptBase = 'SALAIRE-' + Date.now();

    const salaryPayments = [
      {
        teacher_id: teacher.id,
        amount: 100000,
        payment_month: new Date().toISOString().split('T')[0].substring(0, 7) + '-01',
        payment_date: new Date().toISOString().split('T')[0],
        school_year_id: schoolYear.id,
        receipt_number: salaryReceiptBase + '-001',
        created_by: founderUser.id
      },
      {
        teacher_id: teacher.id,
        amount: 100000,
        payment_month: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0].substring(0, 7) + '-01',
        payment_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        school_year_id: schoolYear.id,
        receipt_number: salaryReceiptBase + '-002',
        created_by: founderUser.id
      }
    ];

    console.log('\nCreation des paiements de salaires...');
    for (const payment of salaryPayments) {
      const { error } = await supabase
        .from('salary_payments')
        .insert(payment);

      if (error) {
        console.error('Erreur lors de la creation du paiement de salaire:', error);
      } else {
        console.log(`OK Paiement de salaire cree: ${payment.receipt_number} - ${payment.amount} FCFA`);
      }
    }

    console.log('\n=== Donnees de test creees avec succes ===');
    console.log('Vous pouvez maintenant tester les exports PDF dans l\'interface web.');

  } catch (error) {
    console.error('Erreur lors de la creation des donnees de test:', error);
  }
}

createTestPayments();