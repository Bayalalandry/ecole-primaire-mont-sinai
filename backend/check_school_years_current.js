const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkSchoolYears() {
  console.log('=== VERIFICATION ANNEES SCOLAIRES ===\n');

  const { data: schoolYears } = await supabase
    .from('school_years')
    .select('*')
    .order('start_date', { ascending: false });

  console.log('Total annees scolaires: ' + (schoolYears?.length || 0));
  console.log('\nDetail:');
  schoolYears?.forEach(sy => {
    console.log('- ' + sy.year_label + ':');
    console.log('  id: ' + sy.id);
    console.log('  start_date: ' + sy.start_date);
    console.log('  end_date: ' + sy.end_date);
    console.log('  is_current: ' + (sy.is_current ? 'OUI' : 'NON'));
  });

  const currentCount = schoolYears?.filter(sy => sy.is_current).length || 0;
  console.log('\nNombre d\'annees avec is_current = true: ' + currentCount);

  if (currentCount === 0) {
    console.log('\n⚠️ ATTENTION: Aucune annee scolaire marquee comme actuelle (is_current = true)');
    console.log('Recommandation: Marquer l\'annee scolaire 2026-2027 comme actuelle');
  } else if (currentCount > 1) {
    console.log('\n⚠️ ATTENTION: Plusieurs annees scolaires marquees comme actuelles (is_current = true)');
    console.log('Recommandation: Ne garder qu\'une seule annee comme actuelle');
  } else {
    console.log('\n✅ OK: Une seule annee scolaire est marquee comme actuelle');
  }
}

checkSchoolYears();
