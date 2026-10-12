-- Exécuter ce script dans l'éditeur SQL Supabase
-- Met à jour la contrainte de rôle pour inclure 'secretary'

-- 1. Supprimer l'ancienne contrainte
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Créer la nouvelle contrainte avec secretary
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('founder', 'director', 'secretary'));

-- 3. Vérifier la contrainte
SELECT conname, consrc
FROM pg_constraint
WHERE conrelid = 'users'::regclass
  AND conname = 'users_role_check';
