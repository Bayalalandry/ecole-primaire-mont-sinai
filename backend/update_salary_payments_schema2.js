const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function updateSalaryPaymentsSchema2() {
  try {
    console.log('Updating salary_payments schema to add school_year_id...');

    const sql = `ALTER TABLE salary_payments ADD COLUMN IF NOT EXISTS school_year_id UUID REFERENCES school_years(id) ON DELETE CASCADE;`;

    console.log('Please execute this SQL in Supabase SQL Editor:');
    console.log(sql);

  } catch (error) {
    console.error('Error:', error);
  }
}

updateSalaryPaymentsSchema2();
