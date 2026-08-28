const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function updateSalarySchemaForDirector() {
  try {
    console.log('Updating salary schema to support directors...');

    const sqlCommands = `
-- 1. Remove the foreign key constraint on teacher_id in teacher_salaries
ALTER TABLE teacher_salaries DROP CONSTRAINT IF EXISTS teacher_salaries_teacher_id_fkey;

-- 2. Remove the foreign key constraint on teacher_id in salary_payments
ALTER TABLE salary_payments DROP CONSTRAINT IF EXISTS salary_payments_teacher_id_fkey;
    `;

    console.log('Please execute these SQL commands in Supabase SQL Editor:');
    console.log(sqlCommands);

  } catch (error) {
    console.error('Error:', error);
  }
}

updateSalarySchemaForDirector();
