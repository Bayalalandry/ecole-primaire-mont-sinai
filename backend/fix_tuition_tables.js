const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

(async () => {
  console.log('=== FIXING TUITION TABLES ===');

  try {
    // Vérifier si la table tuition_rates existe
    console.log('\n1. Checking tuition_rates table...');
    const { data: existingRates, error: ratesError } = await supabase
      .from('tuition_rates')
      .select('*')
      .limit(1);

    if (ratesError) {
      console.log('Table does not exist or has no access:', ratesError.message);
      console.log('Creating table tuition_rates...');

      // Créer la table
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS tuition_rates (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
            school_year VARCHAR(20),
            amount DECIMAL(10,2) NOT NULL,
            effective_date DATE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(class_id, school_year, effective_date)
          );
        `
      });

      if (createError) {
        console.error('Error creating table:', createError);
      } else {
        console.log('Table created successfully');
      }
    } else {
      console.log('Table exists, checking columns...');
      console.log('Sample data:', existingRates);
    }

    // Vérifier si la table tuition_payments existe
    console.log('\n2. Checking tuition_payments table...');
    const { data: existingPayments, error: paymentsError } = await supabase
      .from('tuition_payments')
      .select('*')
      .limit(1);

    if (paymentsError) {
      console.log('Table does not exist or has no access:', paymentsError.message);
      console.log('Creating table tuition_payments...');

      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS tuition_payments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            student_id UUID REFERENCES students(id) ON DELETE CASCADE,
            school_year VARCHAR(20),
            amount DECIMAL(10,2) NOT NULL,
            payment_date DATE NOT NULL,
            trimester INTEGER CHECK (trimester IN (1, 2, 3)),
            receipt_number VARCHAR(50) UNIQUE NOT NULL,
            cancelled BOOLEAN DEFAULT false,
            cancelled_by UUID REFERENCES users(id),
            cancelled_at TIMESTAMP WITH TIME ZONE,
            created_by UUID REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (createError) {
        console.error('Error creating table:', createError);
      } else {
        console.log('Table created successfully');
      }
    } else {
      console.log('Table exists');
      console.log('Sample data:', existingPayments);
    }

    console.log('\n=== FINISHED ===');
  } catch (error) {
    console.error('Error:', error);
  }
})();
