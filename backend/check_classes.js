const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkClasses() {
  console.log('=== VÉRIFICATION DES CLASSES ===\n');

  const { data: classes, error } = await supabase
    .from('classes')
    .select('id, name, passing_grade');

  if (error) {
    console.error('Erreur:', error);
    return;
  }

  console.log(`Total classes: ${classes.length}`);
  classes.forEach(c => {
    console.log(`ID: ${c.id}, Nom: ${c.name}, Seuil: ${c.passing_grade}`);
  });

  // Vérifier l'ID problématique
  const problematicId = 'ca3de727-88a1-484a-ad15-9593781c4a4b';
  const exists = classes.find(c => c.id === problematicId);
  console.log(`\nID ${problematicId} existe: ${exists ? 'OUI' : 'NON'}`);
}

checkClasses();
