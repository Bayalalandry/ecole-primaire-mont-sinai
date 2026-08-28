require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testActivityLog() {
  console.log('=== Test du journal d\'activité ===\n');

  try {
    // 0. Vérifier la structure de la table
    console.log('0. Vérification de la structure de la table activity_log...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('activity_log')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('Erreur lors de la vérification de la table:', tableError);
    } else {
      console.log('✓ Table accessible. Colonnes détectées:', tableInfo.length > 0 ? Object.keys(tableInfo[0]) : 'Table vide');
    }

    // 1. Insérer une activité de test
    console.log('\n1. Insertion d\'une activité de test...');
    const { data: testUser, error: userError } = await supabase
      .from('users')
      .select('id, first_name, last_name, role')
      .eq('role', 'founder')
      .limit(1)
      .single();

    if (userError || !testUser) {
      console.error('Erreur: Impossible de trouver un utilisateur fondateur pour le test');
      console.error(userError);
      return;
    }

    const { data: insertedActivity, error: insertError } = await supabase
      .from('activity_log')
      .insert({
        action: 'TEST_ACTION',
        entity_type: 'class',
        entity_id: null,
        user_id: testUser.id,
        details: { test: true, message: 'Test activity' },
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erreur lors de l\'insertion:', insertError);
      return;
    }

    console.log('✓ Activité insérée avec succès');
    console.log('  ID:', insertedActivity.id);
    console.log('  Action:', insertedActivity.action);
    console.log('  Auteur ID:', insertedActivity.user_id);
    console.log('  Détails:', insertedActivity.details);
    console.log('  Date:', insertedActivity.created_at);

    // 2. Récupérer les activités
    console.log('\n2. Récupération des activités...');
    const { data: activities, error: fetchError } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (fetchError) {
      console.error('Erreur lors de la récupération:', fetchError);
      return;
    }

    console.log(`✓ ${activities.length} activités récupérées`);
    console.log('\n  Dernières activités:');
    activities.forEach((activity, index) => {
      console.log(`  ${index + 1}. ${activity.action} - ${activity.entity_type}`);
      console.log(`     Auteur ID: ${activity.user_id}`);
      console.log(`     Détails: ${activity.details ? JSON.stringify(activity.details) : 'N/A'}`);
      console.log(`     Date: ${activity.created_at}`);
    });

    // 3. Filtrer par type d'entité
    console.log('\n3. Filtrage par type d\'entité (class)...');
    const { data: filteredActivities, error: filterError } = await supabase
      .from('activity_log')
      .select('*')
      .eq('entity_type', 'class')
      .order('created_at', { ascending: false })
      .limit(5);

    if (filterError) {
      console.error('Erreur lors du filtrage:', filterError);
      return;
    }

    console.log(`✓ ${filteredActivities.length} activités de type 'class' trouvées`);

    // 4. Nettoyage
    console.log('\n4. Nettoyage de l\'activité de test...');
    const { error: deleteError } = await supabase
      .from('activity_log')
      .delete()
      .eq('id', insertedActivity.id);

    if (deleteError) {
      console.error('Erreur lors de la suppression:', deleteError);
    } else {
      console.log('✓ Activité de test supprimée');
    }

    console.log('\n=== Test terminé avec succès ===');

  } catch (error) {
    console.error('Erreur inattendue:', error);
  }
}

testActivityLog();
