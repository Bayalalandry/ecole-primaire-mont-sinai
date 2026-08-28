const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function executeSQL(sql) {
  console.log('=== EXECUTION SQL ===');
  console.log(sql);
  console.log('\nNOTE: Ce script ne peut pas exécuter directement le SQL.');
  console.log('Veuillez copier et exécuter le SQL suivant dans l\'éditeur Supabase:\n');
  console.log(sql);
  console.log('\n=====================================\n');
}

async function updateStatusConstraint() {
  const sql = `
-- Supprimer l'ancienne contrainte et en créer une nouvelle acceptant 'departed'
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_status_check;

ALTER TABLE students
ADD CONSTRAINT students_status_check
CHECK (status IN ('active', 'repeating', 'departed'));
  `;

  await executeSQL(sql);
}

async function addDepartureColumns() {
  const sql = `
-- Ajouter les colonnes pour gérer les départs d'élèves
ALTER TABLE students
ADD COLUMN IF NOT EXISTS departure_date DATE,
ADD COLUMN IF NOT EXISTS departure_reason TEXT;
  `;

  await executeSQL(sql);
}

async function main() {
  console.log('SCRIPTS SQL À EXÉCUTER DANS L\'ÉDITEUR SUPABASE\n');
  console.log('========================================\n');

  await updateStatusConstraint();
  console.log('\n');
  await addDepartureColumns();

  console.log('\n========================================');
  console.log('INSTRUCTIONS:');
  console.log('1. Connectez-vous à votre projet Supabase');
  console.log('2. Allez dans l\'éditeur SQL');
  console.log('3. Copiez et exécutez les scripts SQL ci-dessus');
  console.log('4. Une fois exécutés, appuyez sur Entrée ici pour continuer');
}

main();
