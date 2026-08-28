const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

(async () => {
  console.log('=== SETUP SCHOOL YEAR 2026-2027 ===');

  try {
    const schoolYearLabel = '2026-2027';

    // Vérifier si l'année scolaire existe
    const { data: existingYear } = await supabase
      .from('school_years')
      .select('*')
      .eq('year_label', schoolYearLabel)
      .maybeSingle();

    let schoolYearId;

    if (existingYear) {
      schoolYearId = existingYear.id;
      console.log(`School year ${schoolYearLabel} already exists with ID: ${schoolYearId}`);
    } else {
      // Créer l'année scolaire
      const { data: newYear, error } = await supabase
        .from('school_years')
        .insert({
          year_label: schoolYearLabel,
          is_current: true,
          start_date: '2026-09-01',
          end_date: '2027-07-31',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating school year:', error);
        return;
      }

      schoolYearId = newYear.id;
      console.log(`✅ Created school year ${schoolYearLabel} with ID: ${schoolYearId}`);
    }

    // Mettre à jour les tarifs sans school_year_id
    const { data: rates } = await supabase
      .from('tuition_rates')
      .select('*')
      .is('school_year_id', null);

    console.log('Rates without school_year_id:', rates?.length || 0);

    if (rates && rates.length > 0) {
      for (const rate of rates) {
        const { error } = await supabase
          .from('tuition_rates')
          .update({ school_year_id: schoolYearId })
          .eq('id', rate.id);

        if (error) {
          console.error(`Error updating rate ${rate.id}:`, error);
        } else {
          console.log(`✅ Updated rate ${rate.id} with school_year_id ${schoolYearId}`);
        }
      }
    }

    console.log('=== FINISHED ===');
  } catch (error) {
    console.error('Error:', error);
  }
})();
