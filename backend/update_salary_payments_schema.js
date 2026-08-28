const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function updateSalaryPaymentsSchema() {
  try {
    console.log('Updating salary_payments schema...');

    // Ajouter receipt_number
    const { error: receiptError } = await supabase.rpc('add_column_if_not_exists', {
      table_name: 'salary_payments',
      column_name: 'receipt_number',
      column_type: 'VARCHAR(50) UNIQUE NOT NULL',
      default_value: null
    });

    if (receiptError) {
      console.log('Adding receipt_number column manually...');
      await supabase.rpc('execute_sql', {
        sql: `ALTER TABLE salary_payments ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(50) UNIQUE;`
      });
    }

    // Ajouter cancelled
    await supabase.rpc('execute_sql', {
      sql: `ALTER TABLE salary_payments ADD COLUMN IF NOT EXISTS cancelled BOOLEAN DEFAULT false;`
    });

    // Ajouter cancelled_by
    await supabase.rpc('execute_sql', {
      sql: `ALTER TABLE salary_payments ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES users(id);`
    });

    // Ajouter cancelled_at
    await supabase.rpc('execute_sql', {
      sql: `ALTER TABLE salary_payments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;`
    });

    console.log('Schema updated successfully');

    // Vérifier la structure
    const { data: columns } = await supabase
      .rpc('get_table_columns', { table_name: 'salary_payments' });

    console.log('Current salary_payments columns:', columns);

  } catch (error) {
    console.error('Error updating schema:', error);
  }
}

// Fonction alternative pour exécuter SQL directement
async function executeDirectSQL() {
  try {
    console.log('Executing direct SQL updates...');

    const updates = [
      `ALTER TABLE salary_payments ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(50) UNIQUE;`,
      `ALTER TABLE salary_payments ADD COLUMN IF NOT EXISTS cancelled BOOLEAN DEFAULT false;`,
      `ALTER TABLE salary_payments ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES users(id);`,
      `ALTER TABLE salary_payments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;`
    ];

    for (const sql of updates) {
      console.log(`Executing: ${sql}`);
      // Note: Cette approche nécessite que vous exécutiez ces commandes directement dans l'éditeur SQL Supabase
      console.log('Please execute this in Supabase SQL Editor:', sql);
    }

    console.log('\nPlease execute these SQL commands in Supabase SQL Editor:');
    updates.forEach(sql => console.log(sql));

  } catch (error) {
    console.error('Error:', error);
  }
}

executeDirectSQL();
