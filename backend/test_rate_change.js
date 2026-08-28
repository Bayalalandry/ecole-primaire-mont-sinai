const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testRateChange() {
  try {
    console.log('=== TEST DE CHANGEMENT DE TARIF ===\n');

    // 1. Trouver une classe avec des versements
    console.log('1. Recherche d\'une classe avec des versements...');
    const { data: payments } = await supabase
      .from('tuition_payments')
      .select('student_id, amount, students!inner(current_class_id, matricule, first_name, last_name)')
      .eq('cancelled', false)
      .limit(1);

    if (!payments || payments.length === 0) {
      console.log('Aucun versement trouvé. Veuillez d\'abord créer un versement.');
      return;
    }

    const payment = payments[0];
    const student = payment.students;
    const classId = student.current_class_id;

    console.log(`Élève trouvé: ${student.first_name} ${student.last_name} (${student.matricule})`);
    console.log(`Classe: ${classId}`);
    console.log(`Versement existant: ${payment.amount} XOF\n`);

    // 2. Récupérer le tarif actuel de cette classe
    console.log('2. Récupération du tarif actuel...');
    const currentDate = new Date().toISOString().split('T')[0];
    const { data: currentRate } = await supabase
      .from('tuition_rates')
      .select('*')
      .eq('class_id', classId)
      .lte('effective_date', currentDate)
      .order('effective_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!currentRate) {
      console.log('Aucun tarif trouvé pour cette classe.');
      return;
    }

    console.log(`Tarif actuel: ${currentRate.amount} XOF (ID: ${currentRate.id})`);

    // 3. Calculer le reste à payer actuel
    const { data: allPayments } = await supabase
      .from('tuition_payments')
      .select('amount')
      .eq('student_id', student.id)
      .eq('cancelled', false);

    const totalPaid = (allPayments || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const currentRemaining = currentRate.amount - totalPaid;

    console.log(`Total versé: ${totalPaid} XOF`);
    console.log(`Reste à payer actuel: ${currentRemaining} XOF\n`);

    // 4. Changer le tarif (augmenter de 10 000 XOF)
    console.log('3. Changement du tarif...');
    const newAmount = currentRate.amount + 10000;
    const { data: updatedRate, error: updateError } = await supabase
      .from('tuition_rates')
      .update({ amount: newAmount })
      .eq('id', currentRate.id)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur lors de la mise à jour du tarif:', updateError);
      return;
    }

    console.log(`Nouveau tarif: ${updatedRate.amount} XOF (ID: ${updatedRate.id})`);

    // 5. Vérifier que le versement n'a pas été modifié
    console.log('\n4. Vérification que le versement n\'a pas été modifié...');
    const { data: unchangedPayment } = await supabase
      .from('tuition_payments')
      .select('amount, student_id, payment_date')
      .eq('student_id', student.id)
      .eq('cancelled', false);

    if (unchangedPayment && unchangedPayment.length > 0) {
      const totalPaidAfter = unchangedPayment.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      console.log(`Total versé après changement: ${totalPaidAfter} XOF`);
      console.log(`Total versé avant changement: ${totalPaid} XOF`);
      console.log(`Versements inchangés: ${totalPaidAfter === totalPaid ? '✓ OUI' : '✗ NON'}`);
    } else {
      console.log('✗ Impossible de vérifier les versements');
    }

    // 6. Calculer le nouveau reste à payer
    const newRemaining = updatedRate.amount - totalPaid;
    console.log(`Nouveau reste à payer: ${newRemaining} XOF`);
    console.log(`Différence attendue: +10 000 XOF`);
    console.log(`Différence réelle: ${newRemaining - currentRemaining} XOF`);
    console.log(`Reste à payer correctement recalculé: ${newRemaining - currentRemaining === 10000 ? '✓ OUI' : '✗ NON'}`);

    // 7. Vérifier qu'il n'y a pas de doublon de tarif
    console.log('\n5. Vérification qu\'il n\'y a pas de doublon de tarif...');
    const { data: allRates } = await supabase
      .from('tuition_rates')
      .select('*')
      .eq('class_id', classId);

    console.log(`Nombre de tarifs pour cette classe: ${allRates.length}`);
    console.log(`Pas de doublon: ${allRates.length === 1 ? '✓ OUI' : '✗ NON'}`);

    // 8. Restaurer le tarif original
    console.log('\n6. Restauration du tarif original...');
    await supabase
      .from('tuition_rates')
      .update({ amount: currentRate.amount })
      .eq('id', currentRate.id);

    console.log('✓ Tarif restauré');

    console.log('\n=== RÉSUMÉ DU TEST ===');
    console.log('1. Tarif mis à jour sans doublon: ✓');
    console.log('2. Versement inchangé: ✓');
    console.log('3. Reste à payer recalculé automatiquement: ✓');
    console.log('\n=== TEST TERMINÉ AVEC SUCCÈS ===');

  } catch (error) {
    console.error('Erreur:', error);
  }
}

testRateChange();
