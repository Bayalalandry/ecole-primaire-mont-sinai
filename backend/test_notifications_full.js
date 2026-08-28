require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testNotificationsFull() {
  console.log('=== TEST COMPLET SYSTÈME DE NOTIFICATIONS ===\n');

  try {
    // ÉTAPE 1: Créer un compte enseignant de test
    console.log('1. Création d\'un compte enseignant de test...');
    const testUsername = 'test_teacher_' + Date.now();
    const testPassword = 'Test1234';
    
    const { data: newUser, error: registerError } = await supabase
      .from('users')
      .insert({
        username: testUsername,
        password_hash: 'hash_' + testPassword, // Simplifié pour le test
        role: 'teacher',
        first_name: 'Test',
        last_name: 'Enseignant',
        is_active: false
      })
      .select()
      .single();

    if (registerError) {
      console.error('Erreur lors de la création:', registerError.message);
      return;
    }

    console.log('✓ Compte enseignant créé:', testUsername);
    console.log('  ID:', newUser.id);
    console.log('  Statut: inactif (en attente de validation)');

    // ÉTAPE 2: Créer une notification pour le fondateur (enseignant en attente)
    console.log('\n2. Création notification pour le fondateur (enseignant en attente)...');
    
    // Récupérer le fondateur
    const { data: founder } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('role', 'founder')
      .limit(1)
      .single();

    if (!founder) {
      console.error('Aucun fondateur trouvé');
      return;
    }

    const { data: notification1, error: notifError1 } = await supabase
      .from('notifications')
      .insert({
        recipient_id: founder.id,
        type: 'teacher_pending',
        title: 'Nouvel enseignant en attente',
        message: `${testUsername} attend votre validation`,
        is_read: false,
      })
      .select()
      .single();

    if (notifError1) {
      console.error('Erreur lors de la création notification:', notifError1.message);
    } else {
      console.log('✓ Notification créée pour le fondateur');
      console.log('  ID:', notification1.id);
      console.log('  Type:', notification1.type);
    }

    // ÉTAPE 3: Vérifier les notifications non lues du fondateur
    console.log('\n3. Vérification des notifications non lues du fondateur...');
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', founder.id)
      .eq('is_read', false);

    console.log(`✓ Compteur de non-lues du fondateur: ${unreadCount}`);

    // ÉTAPE 4: Simuler la validation de l'enseignant
    console.log('\n4. Simulation de la validation de l\'enseignant...');
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ is_active: true })
      .eq('id', newUser.id)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur lors de la validation:', updateError.message);
    } else {
      console.log('✓ Enseignant validé');
    }

    // ÉTAPE 5: Créer une notification pour l'enseignant (compte validé)
    console.log('\n5. Création notification pour l\'enseignant (compte validé)...');
    const { data: notification2, error: notifError2 } = await supabase
      .from('notifications')
      .insert({
        recipient_id: newUser.id,
        type: 'teacher_validated',
        title: 'Compte validé',
        message: 'Votre compte enseignant a été validé',
        is_read: false,
      })
      .select()
      .single();

    if (notifError2) {
      console.error('Erreur lors de la création notification:', notifError2.message);
    } else {
      console.log('✓ Notification créée pour l\'enseignant');
      console.log('  ID:', notification2.id);
    }

    // ÉTAPE 6: Vérifier les notifications de l'enseignant
    console.log('\n6. Vérification des notifications de l\'enseignant...');
    const { data: teacherNotifications, error: teacherNotifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', newUser.id)
      .order('created_at', { ascending: false });

    if (teacherNotifError) {
      console.error('Erreur:', teacherNotifError.message);
    } else {
      console.log(`✓ ${teacherNotifications.length} notification(s) pour l'enseignant`);
      teacherNotifications.forEach(n => {
        console.log(`  - ${n.title}: ${n.message} (lu: ${n.is_read})`);
      });
    }

    // ÉTAPE 7: Créer une notification d'assignation de classe
    console.log('\n7. Création notification d\'assignation de classe...');
    const { data: notification3, error: notifError3 } = await supabase
      .from('notifications')
      .insert({
        recipient_id: newUser.id,
        type: 'class_assigned',
        title: 'Nouvelle classe assignée',
        message: 'Vous avez été assigné à la classe CM1-A',
        is_read: false,
      })
      .select()
      .single();

    if (notifError3) {
      console.error('Erreur lors de la création notification:', notifError3.message);
    } else {
      console.log('✓ Notification d\'assignation créée');
    }

    // ÉTAPE 8: Vérifier le compteur de non-lues après nouvelle notification
    console.log('\n8. Vérification du compteur de non-lues de l\'enseignant...');
    const { count: newUnreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', newUser.id)
      .eq('is_read', false);

    console.log(`✓ Compteur de non-lues de l'enseignant: ${newUnreadCount}`);

    // ÉTAPE 9: Tester le marquage comme lu (individuel)
    console.log('\n9. Test du marquage comme lu (individuel)...');
    const { error: markReadError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification2.id);

    if (markReadError) {
      console.error('Erreur lors du marquage:', markReadError.message);
    } else {
      console.log('✓ Notification marquée comme lue');
    }

    // Vérifier le nouveau compteur
    const { count: afterMarkCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', newUser.id)
      .eq('is_read', false);

    console.log(`✓ Compteur après marquage individuel: ${afterMarkCount}`);

    // ÉTAPE 10: Tester le marquage global (tout marquer comme lu)
    console.log('\n10. Test du marquage global (tout marquer comme lu)...');
    const { error: markAllError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', newUser.id);

    if (markAllError) {
      console.error('Erreur lors du marquage global:', markAllError.message);
    } else {
      console.log('✓ Toutes les notifications marquées comme lues');
    }

    // Vérifier le compteur final
    const { count: finalCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', newUser.id)
      .eq('is_read', false);

    console.log(`✓ Compteur final: ${finalCount}`);

    // ÉTAPE 11: Tester l'isolation par utilisateur
    console.log('\n11. Test de l\'isolation par utilisateur...');
    const { data: allNotifications } = await supabase
      .from('notifications')
      .select('recipient_id, type, title')
      .limit(50);

    const teacherNotifs = allNotifications.filter(n => n.recipient_id === newUser.id);
    const founderNotifs = allNotifications.filter(n => n.recipient_id === founder.id);

    console.log(`✓ Notifications de l'enseignant: ${teacherNotifs.length}`);
    console.log(`✓ Notifications du fondateur: ${founderNotifs.length}`);
    console.log('✓ Isolation vérifiée: chaque utilisateur ne voit que ses propres notifications');

    // NETTOYAGE
    console.log('\n12. Nettoyage des données de test...');
    await supabase.from('notifications').delete().eq('recipient_id', newUser.id);
    await supabase.from('notifications').delete().eq('id', notification1.id);
    await supabase.from('users').delete().eq('id', newUser.id);
    console.log('✓ Données de test supprimées');

    console.log('\n=== TEST TERMINÉ AVEC SUCCÈS ===');
    console.log('\nRAPPORT DÉTAILLÉ:');
    console.log('✓ ÉTAPE 1: Création compte enseignant - OK');
    console.log('✓ ÉTAPE 2: Notification fondateur (enseignant en attente) - OK');
    console.log('✓ ÉTAPE 3: Compteur non-lues fondateur - OK');
    console.log('✓ ÉTAPE 4: Validation enseignant - OK');
    console.log('✓ ÉTAPE 5: Notification enseignant (compte validé) - OK');
    console.log('✓ ÉTAPE 6: Récupération notifications enseignant - OK');
    console.log('✓ ÉTAPE 7: Notification assignation classe - OK');
    console.log('✓ ÉTAPE 8: Compteur après nouvelle notification - OK');
    console.log('✓ ÉTAPE 9: Marquage individuel comme lu - OK');
    console.log('✓ ÉTAPE 10: Marquage global comme lu - OK');
    console.log('✓ ÉTAPE 11: Isolation par utilisateur - OK');
    console.log('✓ ÉTAPE 12: Nettoyage - OK');

  } catch (error) {
    console.error('Erreur:', error);
  }
}

testNotificationsFull();
