const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function validateJeanDupont() {
  console.log('=== Validation du compte Jean Dupont ===\n');

  const userId = 'cf88a62d-5d65-492d-ba83-661437504b83';

  // Vérifier le statut actuel
  const { data: teacherData } = await supabase
    .from('teachers')
    .select('status')
    .eq('user_id', userId)
    .single();

  console.log(`Statut actuel: ${teacherData?.status}`);

  if (teacherData?.status === 'active') {
    console.log('✅ Le compte est déjà actif\n');
  } else {
    // Mettre à jour le statut
    const { error } = await supabase
      .from('teachers')
      .update({ status: 'active' })
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Erreur lors de la validation:', error);
      return;
    }

    console.log('✅ Compte validé (statut: active)\n');
  }
}

validateJeanDupont().then(() => process.exit(0));
