# Documentation pour les Agents

## Commandes de développement

### Frontend (React + Vite)
```bash
cd frontend
npm install              # Installer les dépendances
npm run dev             # Démarrer le serveur de développement (http://localhost:5173)
npm run build           # Compiler pour la production
npm run preview         # Prévisualiser le build de production
```

### Backend (Node.js + Express + TypeScript)
```bash
cd backend
npm install              # Installer les dépendances
npm run dev             # Démarrer le serveur en mode développement (avec nodemon)
npm run build           # Compiler TypeScript en JavaScript
npm start               # Démarrer le serveur en production
```

## Configuration requise

### Backend
Créer un fichier `.env` dans le dossier `backend/` avec :
```
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret_key
```

### Base de données
Exécuter le script `database/schema.sql` dans l'éditeur SQL Supabase pour créer toutes les tables.

## Structure du projet

- `frontend/` : Application React avec TypeScript et Tailwind CSS
- `backend/` : API Express avec TypeScript
- `database/` : Schéma SQL pour Supabase
- `docs/` : Documentation technique

## Stack technique

- Frontend : React 18, TypeScript, Tailwind CSS, Vite, React Router
- Backend : Express, TypeScript, JWT, bcrypt, Supabase client
- Base de données : PostgreSQL via Supabase
- Stockage : Supabase Storage (pour photos et justificatifs)
- PDF : jsPDF, react-to-print

## Notes importantes

- L'application est entièrement en français
- La devise est le Franc CFA (XOF)
- Les montants sont toujours arrondis
- Le projet se développe étape par étape
- Chaque étape doit être validée avant de passer à la suivante

## Problèmes connus et incohérences

### Incohérence du schéma de base de données pour le passage de classe

**Problème :** Il existe une incohérence entre le schéma principal (`database/schema.sql`) et le schéma de passage de classe (`database/passage_classe_schema.sql`) :

- `schema.sql` utilise la table `student_academic_history` avec `school_year VARCHAR(20)`
- `passage_classe_schema.sql` utilise deux tables distinctes :
  - `student_annual_grades` avec `school_year_id UUID`
  - `passage_decisions` avec `school_year_id UUID`

**Impact actuel :** Le code backend (`backend/src/routes/passage.ts`) utilise les tables de `passage_classe_schema.sql` mais celles-ci ne sont pas dans le schéma principal. Cela peut causer des erreurs si les tables ne sont pas créées.

**Solution recommandée :** Unifier le schéma en choisissant une approche :
1. Soit intégrer les tables de `passage_classe_schema.sql` dans `schema.sql`
2. Soit modifier le code backend pour utiliser uniquement `student_academic_history` du schéma principal

**Note :** J'ai corrigé le code backend pour utiliser `school_year VARCHAR(20)` dans `student_academic_history` pour correspondre au schéma principal.

## Performance de chargement des pages

### Analyse des statistiques globales

Le endpoint `/api/statistics` effectue plusieurs requêtes à la base de données :
1. `tuition_payments` - tous les paiements de scolarité
2. `school_years` - année scolaire actuelle
3. `students` - élèves actifs
4. `tuition_rates` - tarifs par classe
5. `salary_payments` - tous les paiements de salaire
6. `teacher_salaries` - salaires des enseignants
7. `expenses` - toutes les dépenses
8. `students` - tous les élèves
9. `classes` - classes
10. `users` - enseignants

**Recommandations d'optimisation :**
1. Ajouter des index sur les colonnes fréquemment filtrées (payment_date, school_year_id, etc.)
2. Implémenter la pagination pour les endpoints qui retournent beaucoup de données
3. Utiliser des vues matérialisées ou du cache pour les statistiques fréquemment consultées
4. Optimiser les requêtes en utilisant des jointures au lieu de requêtes multiples
5. Implémenter un cache côté serveur (Redis) pour les statistiques temporaires

**Note :** Pour une petite école primaire, la performance actuelle est probablement acceptable. Ces optimisations sont recommandées pour une scalabilité future.

## Avertissements de lint

### meta[name=theme-color] non supporté par Firefox
- **Fichier** : `frontend/index.html` ligne 10
- **Avertissement** : `<meta name="theme-color">` n'est pas supporté par Firefox, Firefox pour Android et Opera
- **Action** : **Ignorer** - C'est un avertissement de compatibilité, pas une erreur
- **Justification** :
  - Cette balise est une fonctionnalité standard pour les PWA
  - Elle est pleinement supportée par Chrome, Edge et Safari (navigateurs les plus populaires)
  - L'absence de support dans Firefox n'affecte pas le fonctionnement de l'application
  - Supprimer cette balise dégraderait l'expérience utilisateur sur les navigateurs qui la supportent
