/**
 * Script pour mettre à jour la contrainte de rôle dans la table users
 * Ajoute 'secretary' comme rôle valide
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

async function updateRoleConstraint() {
  console.log('🔄 Mise à jour de la contrainte de rôle...\n');

  try {
    // Supprimer l'ancienne contrainte
    console.log('🗑️  Suppression de l\'ancienne contrainte users_role_check...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;'
    });

    if (dropError) {
      console.error('⚠️  Erreur suppression contrainte (peut être normal):', dropError.message);
    } else {
      console.log('✅ Ancienne contrainte supprimée');
    }

    // Créer la nouvelle contrainte avec secretary
    console.log('\n➕ Création de la nouvelle contrainte avec secretary...');
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: "ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('founder', 'director', 'secretary'));"
    });

    if (addError) {
      console.error('❌ Erreur création contrainte:', addError);
      process.exit(1);
    } else {
      console.log('✅ Nouvelle contrainte créée');
    }

    console.log('\n✅ Contrainte mise à jour avec succès !');
    console.log('   Rôles valides: founder, director, secretary');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

updateRoleConstraint();
