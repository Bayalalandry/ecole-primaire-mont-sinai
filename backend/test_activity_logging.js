require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testActivityLogging() {
  console.log('=== TEST LOGGING ACTIVITÉ ===\n');

  try {
    // 1. Vérifier les actions existantes dans le journal
    console.log('1. Vérification des actions existantes...');
    const { data: existingActivities, error: activitiesError } = await supabase
      .from('activity_log')
      .select(`
        *,
        users!activity_log_user_id_fkey(first_name, last_name, username)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (activitiesError) {
      console.error('Erreur:', activitiesError.message);
      return;
    }

    console.log(`✓ ${existingActivities.length} activités trouvées`);

    // Regrouper par type d'action
    const actionCounts = {};
    existingActivities.forEach(a => {
      actionCounts[a.action] = (actionCounts[a.action] || 0) + 1;
    });

    console.log('\nActions par type:');
    Object.entries(actionCounts).forEach(([action, count]) => {
      console.log(`  ${action}: ${count}`);
    });

    // 2. Vérifier que les jointures utilisateurs fonctionnent
    console.log('\n2. Vérification des jointures utilisateurs...');
    const activitiesWithUsers = existingActivities.filter(a => a.users);
    console.log(`✓ ${activitiesWithUsers.length} activités avec informations utilisateur`);

    if (activitiesWithUsers.length > 0) {
      console.log('\nExemple d\'activité avec utilisateur:');
      const example = activitiesWithUsers[0];
      console.log(`  Action: ${example.action}`);
      console.log(`  Auteur: ${example.users?.first_name} ${example.users?.last_name} (@${example.users?.username})`);
      console.log(`  Entité: ${example.entity_type}`);
      console.log(`  Date: ${example.created_at}`);
    }

    // 3. Vérifier les nouveaux types d'actions attendus
    console.log('\n3. Vérification des nouveaux types d\'actions...');
    const expectedActions = [
      'LOGIN',
      'CREATE_PAYMENT',
      'CREATE_SALARY_PAYMENT',
      'CREATE_SALARY',
      'UPDATE_SALARY',
      'CANCEL_SALARY_PAYMENT',
      'CREATE_TUITION_RATE',
      'UPDATE_TUITION_RATE',
      'CREATE_EXPENSE',
      'UPDATE_EXPENSE',
      'DELETE_EXPENSE',
      'VALIDATE_PASSAGE',
      'VALIDATE_TEACHER',
      'REJECT_TEACHER'
    ];

    const foundActions = new Set(existingActivities.map(a => a.action));
    const missingActions = expectedActions.filter(action => !foundActions.has(action));

    if (missingActions.length > 0) {
      console.log('⚠️ Actions manquantes (pas encore enregistrées):');
      missingActions.forEach(action => console.log(`  - ${action}`));
    } else {
      console.log('✓ Tous les types d\'actions attendus sont présents');
    }

    // 4. Créer une activité de test
    console.log('\n4. Création d\'une activité de test...');
    const { data: testUser } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('role', 'founder')
      .limit(1)
      .single();

    if (testUser) {
      const { data: testActivity, error: insertError } = await supabase
        .from('activity_log')
        .insert({
          user_id: testUser.id,
          action: 'TEST_ACTION',
          entity_type: 'test',
          entity_id: null,
          details: { message: 'Test de logging' }
        })
        .select(`
          *,
          users!activity_log_user_id_fkey(first_name, last_name, username)
        `)
        .single();

      if (insertError) {
        console.error('Erreur lors de l\'insertion:', insertError.message);
      } else {
        console.log('✓ Activité de test créée');
        console.log(`  ID: ${testActivity.id}`);
        console.log(`  Auteur: ${testActivity.users?.first_name} ${testActivity.users?.last_name}`);
        console.log(`  Action: ${testActivity.action}`);

        // Nettoyer
        await supabase.from('activity_log').delete().eq('id', testActivity.id);
        console.log('✓ Activité de test supprimée');
      }
    }

    console.log('\n=== TEST TERMINÉ ===');
    console.log('\nRÉSUMÉ DES CORRECTIONS:');
    console.log('1. Ajout de logActivity dans tuition.ts pour CREATE_PAYMENT');
    console.log('2. Ajout de logActivity dans salaries.ts pour:');
    console.log('   - CREATE_SALARY_PAYMENT');
    console.log('   - CANCEL_SALARY_PAYMENT');
    console.log('   - CREATE_SALARY');
    console.log('   - UPDATE_SALARY');
    console.log('3. Jointure avec users dans activityLog.ts pour afficher le nom');
    console.log('4. Mise à jour de ActivityLogPage.tsx pour afficher le nom au lieu de l\'ID');
    console.log('5. Ajout des labels pour les nouveaux types d\'actions');

  } catch (error) {
    console.error('Erreur:', error);
  }
}

testActivityLogging();
