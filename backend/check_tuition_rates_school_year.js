const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

(async () => {
  console.log('=== CHECK TUITION RATES SCHOOL YEAR ===');

  try {
    const { data: rates } = await supabase
      .from('tuition_rates')
      .select('*');

    console.log('All rates:', rates?.length || 0);
    rates?.forEach((rate) => {
      console.log(`- ID: ${rate.id}, Class: ${rate.class_id}, School Year: ${rate.school_year}, Amount: ${rate.amount}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
})();
