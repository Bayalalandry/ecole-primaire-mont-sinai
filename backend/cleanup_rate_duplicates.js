const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function cleanupRateDuplicates() {
  try {
    console.log('Fetching all tuition rates...');
    const { data: rates, error } = await supabase
      .from('tuition_rates')
      .select('*')
      .order('class_id', { ascending: true });

    if (error) {
      console.error('Error fetching rates:', error);
      return;
    }

    console.log('All rates:', rates);

    // Group by class_id and school_year_id to find duplicates
    const grouped = {};
    rates.forEach(r => {
      const key = `${r.class_id}-${r.school_year_id || 'null'}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(r);
    });

    console.log('Grouped rates:', grouped);

    // Delete duplicates, keep the most recent one (by effective_date)
    for (const [key, items] of Object.entries(grouped)) {
      if (items.length > 1) {
        console.log(`Found ${items.length} duplicates for ${key}`);
        // Sort by effective_date descending, keep the first one
        items.sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date));
        const toDelete = items.slice(1);
        for (const item of toDelete) {
          console.log(`Deleting rate with id ${item.id} (effective_date: ${item.effective_date})`);
          const { error: deleteError } = await supabase
            .from('tuition_rates')
            .delete()
            .eq('id', item.id);

          if (deleteError) {
            console.error('Error deleting rate:', deleteError);
          } else {
            console.log(`Deleted rate ${item.id}`);
          }
        }
      }
    }

    console.log('Fetching rates after cleanup...');
    const { data: afterCleanup } = await supabase
      .from('tuition_rates')
      .select('*')
      .order('class_id', { ascending: true });

    console.log('Rates after cleanup:', afterCleanup);
  } catch (error) {
    console.error('Error:', error);
  }
}

cleanupRateDuplicates();
