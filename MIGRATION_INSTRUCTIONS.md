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

Le script a été mis à jour pour être robuste et ignorer les erreurs si les tables/colonnes n'existent pas déjà. Il utilise des blocs DO $$ pour vérifier l'existence avant de renommer.

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

-- Vérifier que la contrainte a été mise à jour
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
WHERE conname = 'users_role_check';
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

Le script Phase 1 a été mis à jour pour être robuste et ignorer les erreurs si :
- Les tables n'existent pas déjà (peut-être déjà renommées)
- Les colonnes n'existent pas (peut-être déjà renommées)
- Les contraintes n'existent pas

Si vous obtenez encore une erreur, vérifiez :
1. Que vous avez les droits d'administration sur la base de données
2. Exécutez les requêtes de vérification pour voir l'état actuel
3. Certains éléments peuvent déjà avoir été migrés lors d'une tentative précédente

Pour annuler la migration (rollback), il est recommandé de faire une sauvegarde de la base de données avant de commencer.
