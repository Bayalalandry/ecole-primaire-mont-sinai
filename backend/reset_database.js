/**
 * Script de réinitialisation complète de la base de données
 * Supprime toutes les données de production tout en gardant la structure
 *
 * ATTENTION : Ce script est DESTRUCTIF et ne peut pas être annulé
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erreur: SUPABASE_URL et SUPABASE_ANON_KEY doivent être définis dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tables à vider (dans l'ordre correct pour gérer les contraintes de clés étrangères)
const tablesToReset = [
  'notifications', // Dépend de users
  'secretary_class_assignments',
  'tuition_rates',
  'tuition_payments',
  'secretary_salaries',
  'salary_payments',
  'expenses',
  'passage_decisions',
  'student_academic_history',
  'student_annual_grades',
  'activity_log',
  'secretaries', // Dépend de users (user_id)
  'director_permissions', // Dépend de users (user_id)
  'founder_settings', // Dépend de users (user_id)
  'students',
  'users', // Doit être en dernier
];

// Tables à vérifier (doivent rester intactes)
const tablesToKeep = [
  'classes',
  'school_years',
  'trimesters'
];

async function countRows(tableName) {
  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error(`  ❌ Erreur lors du comptage de ${tableName}:`, error.message);
    return 0;
  }
  return count || 0;
}

async function deleteAllRows(tableName) {
  // Certaines tables utilisent user_id comme clé primaire au lieu de id
  const primaryKey = ['secretaries', 'founder_settings', 'director_permissions'].includes(tableName) ? 'user_id' : 'id';

  const { error } = await supabase
    .from(tableName)
    .delete()
    .neq(primaryKey, '00000000-0000-0000-0000-000000000000'); // Force delete all rows

  if (error) {
    console.error(`  ❌ Erreur lors de la suppression de ${tableName}:`, error.message);
    return false;
  }
  return true;
}

async function resetDatabase() {
  console.log('🔄 Début de la réinitialisation de la base de données...\n');

  // 1. Compter les données avant suppression
  console.log('📊 Comptage des données AVANT suppression:');
  const beforeCounts = {};
  for (const table of tablesToReset) {
    const count = await countRows(table);
    beforeCounts[table] = count;
    console.log(`  ${table}: ${count} lignes`);
  }

  console.log('\n📊 Tables à garder intactes (vérification):');
  for (const table of tablesToKeep) {
    const count = await countRows(table);
    console.log(`  ${table}: ${count} lignes`);
  }

  // 2. Supprimer les données
  console.log('\n🗑️  Suppression des données:');
  for (const table of tablesToReset) {
    console.log(`  Suppression de ${table}...`);
    const success = await deleteAllRows(table);
    if (success) {
      console.log(`  ✅ ${table} supprimé avec succès`);
    } else {
      console.log(`  ⚠️  ${table}: erreur (continuons)`);
    }
  }

  // 3. Compter les données après suppression
  console.log('\n📊 Comptage des données APRÈS suppression:');
  const afterCounts = {};
  for (const table of tablesToReset) {
    const count = await countRows(table);
    afterCounts[table] = count;
    const diff = beforeCounts[table] - count;
    console.log(`  ${table}: ${count} lignes (supprimé: ${diff})`);
  }

  console.log('\n📊 Tables gardées intactes (vérification):');
  for (const table of tablesToKeep) {
    const count = await countRows(table);
    console.log(`  ${table}: ${count} lignes`);
  }

  // 4. Résumé
  console.log('\n✅ Réinitialisation terminée !');
  console.log('\n📋 Résumé des suppressions:');
  let totalDeleted = 0;
  for (const table of tablesToReset) {
    const deleted = beforeCounts[table] - afterCounts[table];
    totalDeleted += deleted;
    console.log(`  ${table}: ${deleted} lignes supprimées`);
  }
  console.log(`\n  Total: ${totalDeleted} lignes supprimées`);

  console.log('\n🎯 État de l\'application:');
  console.log('  ✅ Base de données réinitialisée');
  console.log('  ✅ Classes conservées');
  console.log('  ✅ Années scolaires conservées');
  console.log('  ✅ Trimestres conservés');
  console.log('  ✅ Écran de création du compte fondateur accessible');
}

resetDatabase().catch(console.error);
