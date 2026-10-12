-- ============================================
-- Migration Teacher → Secretary - Phase 2
-- Convertir les données existantes et mettre à jour les références
-- ============================================

-- 1. Convertir les utilisateurs avec rôle 'teacher' en 'secretary'
UPDATE users SET role = 'secretary' WHERE role = 'teacher';

-- 2. Mettre à jour les types de notifications
-- Supprimer l'ancienne contrainte
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Ajouter la nouvelle contrainte avec secretary
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('secretary_pending', 'secretary_validated', 'class_assigned'));

-- 3. Mettre à jour les notifications existantes
UPDATE notifications SET type = 'secretary_pending' WHERE type = 'teacher_pending';
UPDATE notifications SET type = 'secretary_validated' WHERE type = 'teacher_validated';

-- 4. Mettre à jour l'activity_log
ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_entity_type_check;
ALTER TABLE activity_log ADD CONSTRAINT activity_log_entity_type_check 
CHECK (entity_type IN ('student', 'secretary', 'class', 'tuition_rate', 'salary', 'expense', 'passage', 'school_year'));

-- 5. Mettre à jour les logs d'activité existants
UPDATE activity_log SET entity_type = 'secretary' WHERE entity_type = 'teacher';

-- 6. Vérifier qu'il n'y a qu'un seul secrétaire actif
-- (Cette requête doit être exécutée manuellement pour vérifier)
-- SELECT COUNT(*) FROM users WHERE role = 'secretary' AND is_active = true;

-- Si plusieurs secrétaires existent, désactiver les doublons
-- (À adapter selon les données réelles)
-- WITH ranked_secretaries AS (
--   SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn 
--   FROM users WHERE role = 'secretary' AND is_active = true
-- )
-- UPDATE users SET is_active = false 
-- WHERE id IN (SELECT id FROM ranked_secretaries WHERE rn > 1);