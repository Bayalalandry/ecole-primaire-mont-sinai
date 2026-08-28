const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function updatePaymentStatus() {
  try {
    console.log('Mise à jour des statuts de versements...');
    
    // Récupérer tous les versements sans statut ou avec statut null
    const { data: payments, error } = await supabase
      .from('tuition_payments')
      .select('id, receipt_number, status')
      .is('status', null)
      .or('status.eq.', '');
    
    if (error) {
      console.error('Erreur lors de la récupération des versements:', error);
      return;
    }
    
    console.log(`Found ${payments.length} payments without status`);
    
    // Mettre à jour chaque versement avec status 'paid'
    for (const payment of payments) {
      const { error: updateError } = await supabase
        .from('tuition_payments')
        .update({ status: 'paid' })
        .eq('id', payment.id);
      
      if (updateError) {
        console.error(`Erreur pour le versement ${payment.receipt_number}:`, updateError);
      } else {
        console.log(`✓ Versement ${payment.receipt_number} mis à jour`);
      }
    }
    
    console.log('Mise à jour terminée !');
  } catch (error) {
    console.error('Erreur:', error);
  }
}

updatePaymentStatus();
