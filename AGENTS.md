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
