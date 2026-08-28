const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function updatePassingGrades() {
  console.log('=== MISE À JOUR DES SEUILS DE PASSAGE ===\n');

  const newPassingGrade = 5.0; // 5/10

  const { data: classes, error } = await supabase
    .from('classes')
    .select('id, name, passing_grade');

  if (error) {
    console.error('Erreur:', error);
    return;
  }

  console.log(`Seuils actuels :`);
  classes.forEach(c => {
    console.log(`${c.name}: ${c.passing_grade}/20`);
  });

  console.log(`\nMise à jour à ${newPassingGrade}/10 pour toutes les classes...`);

  for (const classData of classes) {
    const { error: updateError } = await supabase
      .from('classes')
      .update({ passing_grade: newPassingGrade })
      .eq('id', classData.id);

    if (updateError) {
      console.error(`Erreur pour ${classData.name}:`, updateError);
    } else {
      console.log(`✓ ${classData.name}: ${classData.passing_grade}/20 → ${newPassingGrade}/10`);
    }
  }

  console.log('\n=== VÉRIFICATION ===');
  const { data: updatedClasses } = await supabase
    .from('classes')
    .select('id, name, passing_grade');

  updatedClasses.forEach(c => {
    console.log(`${c.name}: ${c.passing_grade}/10`);
  });

  console.log('\n✓ Tous les seuils mis à jour avec succès');
}

updatePassingGrades();
