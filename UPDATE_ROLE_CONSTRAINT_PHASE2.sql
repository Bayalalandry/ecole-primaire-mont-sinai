-- Exécuter ce script dans l'éditeur SQL Supabase
-- PHASE 2 : Migrer les données teacher → secretary

-- Migrer tous les teachers en secretaries
UPDATE users
SET role = 'secretary'
WHERE role = 'teacher';

-- Vérifier la migration
SELECT role, COUNT(*)
FROM users
GROUP BY role;

-- Créer la nouvelle contrainte avec secretary
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('founder', 'director', 'secretary'));

-- Vérifier la contrainte (version compatible PostgreSQL)
SELECT conname
FROM pg_constraint
WHERE conrelid = 'users'::regclass
  AND conname = 'users_role_check';
