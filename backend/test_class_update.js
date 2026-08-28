const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testClassUpdate() {
  console.log('=== TEST UPDATE CLASSE ===\n');

  const classId = 'ca3de727-88a1-484a-ad15-9593781c4a4b';

  // 1. Essayer de lire la classe
  console.log('1. Lecture de la classe...');
  const { data: classData, error: readError } = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .single();

  console.log('Résultat lecture:', { classData, readError });

  // 2. Essayer de mettre à jour la classe
  console.log('\n2. Mise à jour de la classe...');
  const { data: updateData, error: updateError } = await supabase
    .from('classes')
    .update({ passing_grade: 11 })
    .eq('id', classId)
    .select()
    .maybeSingle();

  console.log('Résultat update:', { updateData, updateError });

  // 3. Vérifier les politiques RLS
  console.log('\n3. Vérification des politiques RLS...');
  // Note: On ne peut pas vérifier directement via l'API client, mais on peut déduire
  console.log('Si l\'update échoue sans erreur, il y a probablement une politique RLS');
}

testClassUpdate();
