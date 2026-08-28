const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function cleanupTrimesterDuplicates() {
  try {
    console.log('Fetching all trimesters...');
    const { data: trimesters, error } = await supabase
      .from('trimesters')
      .select('*')
      .order('trimester_number', { ascending: true });

    if (error) {
      console.error('Error fetching trimesters:', error);
      return;
    }

    console.log('All trimesters:', trimesters);

    // Group by trimester_number to find duplicates
    const grouped = {};
    trimesters.forEach(t => {
      const key = t.trimester_number;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(t);
    });

    console.log('Grouped trimesters:', grouped);

    // Delete duplicates, keep the first one
    for (const [trimesterNum, items] of Object.entries(grouped)) {
      if (items.length > 1) {
        console.log(`Found ${items.length} duplicates for trimester ${trimesterNum}`);
        // Keep the first one, delete the rest
        const toDelete = items.slice(1);
        for (const item of toDelete) {
          console.log(`Deleting trimester with id ${item.id}`);
          const { error: deleteError } = await supabase
            .from('trimesters')
            .delete()
            .eq('id', item.id);

          if (deleteError) {
            console.error('Error deleting trimester:', deleteError);
          } else {
            console.log(`Deleted trimester ${item.id}`);
          }
        }
      }
    }

    console.log('Fetching trimesters after cleanup...');
    const { data: afterCleanup } = await supabase
      .from('trimesters')
      .select('*')
      .order('trimester_number', { ascending: true });

    console.log('Trimesters after cleanup:', afterCleanup);
  } catch (error) {
    console.error('Error:', error);
  }
}

cleanupTrimesterDuplicates();
