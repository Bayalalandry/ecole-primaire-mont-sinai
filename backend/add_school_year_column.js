const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

(async () => {
  console.log('=== ADDING school_year COLUMN TO tuition_rates ===');

  try {
    // Ajouter la colonne school_year si elle n'existe pas
    const { error } = await supabase
      .rpc('exec_sql', {
        sql: `
          ALTER TABLE tuition_rates 
          ADD COLUMN IF NOT EXISTS school_year VARCHAR(20);
        `
      });

    if (error) {
      console.error('Error adding column:', error);
    } else {
      console.log('Column school_year added successfully');
    }

    // Faire la même chose pour tuition_payments
    console.log('\n=== ADDING school_year COLUMN TO tuition_payments ===');
    const { error: paymentsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          ALTER TABLE tuition_payments 
          ADD COLUMN IF NOT EXISTS school_year VARCHAR(20);
        `
      });

    if (paymentsError) {
      console.error('Error adding column to payments:', paymentsError);
    } else {
      console.log('Column school_year added to tuition_payments successfully');
    }

    console.log('\n=== FINISHED ===');
  } catch (error) {
    console.error('Error:', error);
  }
})();
