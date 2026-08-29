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
