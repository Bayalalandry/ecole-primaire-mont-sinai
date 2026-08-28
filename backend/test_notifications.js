require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testNotifications() {
  console.log('=== Test du système de notifications ===\n');

  try {
    // 1. Récupérer un utilisateur fondateur et un enseignant
    console.log('1. Récupération des utilisateurs de test...');
    const { data: founder, error: founderError } = await supabase
      .from('users')
      .select('id, first_name, last_name, role')
      .eq('role', 'founder')
      .limit(1)
      .single();

    if (founderError || !founder) {
      console.error('Erreur: Impossible de trouver un utilisateur fondateur');
      return;
    }

    const { data: teacher, error: teacherError } = await supabase
      .from('users')
      .select('id, first_name, last_name, role')
      .eq('role', 'teacher')
      .limit(1)
      .single();

    if (teacherError || !teacher) {
      console.error('Erreur: Impossible de trouver un utilisateur enseignant');
      return;
    }

    console.log('✓ Utilisateurs trouvés');
    console.log('  Fondateur:', founder.first_name, founder.last_name);
    console.log('  Enseignant:', teacher.first_name, teacher.last_name);

    // 2. Créer une notification pour le fondateur
    console.log('\n2. Création d\'une notification pour le fondateur...');
    const { data: notification1, error: insertError1 } = await supabase
      .from('notifications')
      .insert({
        recipient_id: founder.id,
        type: 'teacher_pending',
        title: 'Test notification',
        message: 'Ceci est une notification de test pour le fondateur',
        is_read: false,
      })
      .select()
      .single();

    if (insertError1) {
      console.error('Erreur lors de l\'insertion:', insertError1);
      return;
    }

    console.log('✓ Notification créée pour le fondateur');
    console.log('  ID:', notification1.id);
    console.log('  Type:', notification1.type);
    console.log('  Titre:', notification1.title);

    // 3. Créer une notification pour l'enseignant
    console.log('\n3. Création d\'une notification pour l\'enseignant...');
    const { data: notification2, error: insertError2 } = await supabase
      .from('notifications')
      .insert({
        recipient_id: teacher.id,
        type: 'teacher_validated',
        title: 'Compte validé',
        message: 'Votre compte enseignant a été validé',
        is_read: false,
      })
      .select()
      .single();

    if (insertError2) {
      console.error('Erreur lors de l\'insertion:', insertError2);
      return;
    }

    console.log('✓ Notification créée pour l\'enseignant');
    console.log('  ID:', notification2.id);
    console.log('  Type:', notification2.type);
    console.log('  Titre:', notification2.title);

    // 4. Récupérer les notifications du fondateur
    console.log('\n4. Récupération des notifications du fondateur...');
    const { data: founderNotifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', founder.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Erreur lors de la récupération:', fetchError);
      return;
    }

    console.log(`✓ ${founderNotifications.length} notifications trouvées pour le fondateur`);

    // 5. Compter les notifications non lues
    console.log('\n5. Comptage des notifications non lues...');
    const { data: unreadNotifications, error: unreadError, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', founder.id)
      .eq('is_read', false);

    if (unreadError) {
      console.error('Erreur lors du comptage:', unreadError);
      return;
    }

    console.log(`✓ ${count} notifications non lues pour le fondateur`);

    // 6. Marquer une notification comme lue
    console.log('\n6. Marquage d\'une notification comme lue...');
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification1.id);

    if (updateError) {
      console.error('Erreur lors de la mise à jour:', updateError);
      return;
    }

    console.log('✓ Notification marquée comme lue');

    // 7. Vérifier le comptage après mise à jour
    const { count: newCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', founder.id)
      .eq('is_read', false);

    console.log(`✓ ${newCount} notifications non lues après mise à jour`);

    // 8. Nettoyage
    console.log('\n8. Nettoyage des notifications de test...');
    const { error: deleteError1 } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notification1.id);

    const { error: deleteError2 } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notification2.id);

    if (deleteError1 || deleteError2) {
      console.error('Erreur lors de la suppression:', deleteError1 || deleteError2);
    } else {
      console.log('✓ Notifications de test supprimées');
    }

    console.log('\n=== Test terminé avec succès ===');

  } catch (error) {
    console.error('Erreur inattendue:', error);
  }
}

testNotifications();
