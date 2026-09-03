-- Exécuter ce script dans l'éditeur SQL Supabase
-- PHASE 1 : Supprimer l'ancienne contrainte pour permettre la migration

-- Supprimer l'ancienne contrainte
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Vérifier que la contrainte est supprimée (version compatible PostgreSQL)
SELECT conname
FROM pg_constraint
WHERE conrelid = 'users'::regclass
  AND conname = 'users_role_check';
