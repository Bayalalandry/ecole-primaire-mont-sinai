# Instructions pour la Migration Teacher → Secretary

## Étape 1: Se connecter au Dashboard Supabase

1. Allez sur https://supabase.com/dashboard
2. Connectez-vous avec votre compte
3. Sélectionnez le projet "ecole-primaire-mont-sinai"

## Étape 2: Ouvrir l'éditeur SQL

1. Cliquez sur "SQL Editor" dans la barre latérale gauche
2. Cliquez sur "New query"

## Étape 3: Exécuter la Phase 1

Copiez et collez le contenu du fichier `UPDATE_TEACHER_TO_SECRETARY_PHASE1.sql` :

```sql
-- ============================================
-- Migration Teacher → Secretary - Phase 1
-- Modifier les contraintes de rôle et renommer les tables
-- ============================================

-- 1. Modifier la contrainte de rôle dans la table users
ALTER TABLE users DROP CONSTRAINT users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('founder', 'director', 'secretary'));

-- 2. Renommer la table teachers en secretaries
ALTER TABLE teachers RENAME TO secretaries;

-- 3. Renommer la table teacher_class_assignments en secretary_class_assignments
ALTER TABLE teacher_class_assignments RENAME TO secretary_class_assignments;

-- 4. Renommer la table teacher_salaries en secretary_salaries
ALTER TABLE teacher_salaries RENAME TO secretary_salaries;

-- 5. Renommer les colonnes dans secretary_class_assignments
ALTER TABLE secretary_class_assignments RENAME COLUMN teacher_id TO secretary_id;

-- 6. Renommer les colonnes dans secretary_salaries
ALTER TABLE secretary_salaries RENAME COLUMN teacher_id TO secretary_id;

-- 7. Renommer les colonnes dans tuition_payments qui référencent teacher_id
ALTER TABLE tuition_payments RENAME COLUMN teacher_id TO secretary_id;

-- 8. Mettre à jour les index
DROP INDEX IF EXISTS idx_teacher_assignments;
CREATE INDEX idx_secretary_assignments ON secretary_class_assignments(secretary_id, school_year_id);

-- 9. Mettre à jour les triggers
DROP TRIGGER IF EXISTS update_teachers_updated_at ON secretaries;
CREATE TRIGGER update_secretaries_updated_at BEFORE UPDATE ON secretaries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teacher_salaries_updated_at ON secretary_salaries;
CREATE TRIGGER update_secretary_salaries_updated_at BEFORE UPDATE ON secretary_salaries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Mettre à jour les colonnes de permissions dans users
ALTER TABLE users RENAME COLUMN can_validate_teachers TO can_validate_secretaries;
```

Cliquez sur "Run" pour exécuter.

## Étape 4: Exécuter la Phase 2

Ouvrez une nouvelle requête SQL et copiez le contenu du fichier `UPDATE_TEACHER_TO_SECRETARY_PHASE2.sql` :

```sql
-- ============================================
-- Migration Teacher → Secretary - Phase 2
-- Convertir les données existantes
-- ============================================

-- 1. Convertir les utilisateurs avec rôle 'teacher' en 'secretary'
UPDATE users SET role = 'secretary' WHERE role = 'teacher';

-- 2. Vérifier la conversion
SELECT id, username, role FROM users WHERE role IN ('founder', 'director', 'secretary');
```

Cliquez sur "Run" pour exécuter.

## Étape 5: Vérifier la migration

Exécutez cette requête pour vérifier que tout est correct :

```sql
-- Vérifier les tables renommées
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('secretaries', 'secretary_class_assignments', 'secretary_salaries');

-- Vérifier les colonnes renommées
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'secretary_class_assignments'
AND column_name = 'secretary_id';

-- Vérifier les rôles des utilisateurs
SELECT role, COUNT(*) FROM users GROUP BY role;
```

## Étape 6: Déployer le backend

Une fois la migration SQL terminée avec succès :

```bash
cd backend
npm run build
npm start
```

## Étape 7: Tester

1. Testez la connexion avec le compte fondateur
2. Testez la création d'un compte secrétaire
3. Testez l'accès secrétaire aux classes et élèves
4. Vérifiez que les salaires fonctionnent toujours

## En cas d'erreur

Si une erreur survient pendant la migration, vérifiez :

1. Que les tables existent bien avant de les renommer
2. Que les contraintes existent avant de les supprimer
3. Que vous avez les droits d'administration sur la base de données

Pour annuler la migration (rollback), vous pouvez utiliser les commandes inverses, mais il est recommandé de faire une sauvegarde de la base de données avant de commencer.
