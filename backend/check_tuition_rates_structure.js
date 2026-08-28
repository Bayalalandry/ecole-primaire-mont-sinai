const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

(async () => {
  console.log('=== CHECK TUITION RATES STRUCTURE ===');

  try {
    // Essayer de récupérer la structure via une requête
    const { data, error } = await supabase
      .from('tuition_rates')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Sample rate:', data);
      if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
})();
