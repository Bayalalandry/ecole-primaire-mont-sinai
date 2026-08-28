const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

(async () => {
  console.log('=== UPDATE TUITION RATES WITH SCHOOL YEAR ===');

  try {
    const schoolYear = '2026-2027';

    // Récupérer tous les tarifs
    const { data: rates } = await supabase
      .from('tuition_rates')
      .select('*');

    console.log('Total rates:', rates?.length || 0);

    if (rates && rates.length > 0) {
      for (const rate of rates) {
        if (!rate.school_year) {
          const { error } = await supabase
            .from('tuition_rates')
            .update({ school_year: schoolYear })
            .eq('id', rate.id);

          if (error) {
            console.error(`Error updating rate ${rate.id}:`, error);
          } else {
            console.log(`✅ Updated rate ${rate.id} with school_year ${schoolYear}`);
          }
        } else {
          console.log(`Rate ${rate.id} already has school_year: ${rate.school_year}`);
        }
      }
    }

    console.log('=== FINISHED ===');
  } catch (error) {
    console.error('Error:', error);
  }
})();
