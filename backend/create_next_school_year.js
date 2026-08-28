const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function createNextSchoolYear() {
  console.log('=== CREATION ANNEE SCOLAIRE 2027-2028 ===\n');

  const { data: existing } = await supabase
    .from('school_years')
    .select('*')
    .eq('year_label', '2027-2028')
    .maybeSingle();

  if (existing) {
    console.log('L\'annee scolaire 2027-2028 existe deja');
    console.log(`ID: ${existing.id}`);
    return existing.id;
  }

  const { data, error } = await supabase
    .from('school_years')
    .insert({
      year_label: '2027-2028',
      start_date: '2027-09-01',
      end_date: '2028-06-30',
      is_current: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur creation:', error);
    return null;
  }

  console.log(`OK - Annee scolaire 2027-2028 cree`);
  console.log(`ID: ${data.id}`);
  return data.id;
}

createNextSchoolYear();
