# Gestion École Primaire - Burkina Faso

Application web de gestion pour une école primaire au Burkina Faso.

## Stack Technique

- **Frontend** : React + TypeScript + Tailwind CSS + Vite
- **Backend** : Node.js + Express + TypeScript
- **Base de données** : PostgreSQL via Supabase
- **Authentification** : JWT avec rôles (fondateur, directeur, enseignant)
- **Génération PDF** : jsPDF + react-to-print
- **Stockage** : Supabase Storage (pour les photos et justificatifs)

## Structure du Projet

```
Ecole Primaire/
├── frontend/          # Application React
│   ├── src/
│   │   ├── components/ # Composants réutilisables
│   │   ├── pages/      # Pages de l'application
│   │   └── ...
│   ├── package.json
│   └── ...
├── backend/           # API Express
│   ├── src/
│   │   ├── routes/    # Routes API
│   │   ├── server.ts  # Point d'entrée
│   │   └── ...
│   ├── package.json
│   └── ...
├── database/          # Schéma SQL Supabase
│   └── schema.sql
└── docs/              # Documentation
```

## Installation

### Prérequis
- Node.js (v18 ou supérieur)
- Un compte Supabase
- Git

### Configuration Backend

1. Copier le fichier d'environnement :
```bash
cd backend
cp .env.example .env
```

2. Configurer les variables d'environnement dans `.env` :
```
PORT=5000
SUPABASE_URL=votre_url_supabase
SUPABASE_ANON_KEY=votre_cle_anon_supabase
JWT_SECRET=votre_cle_secrete_jwt
```

### Installation des dépendances

Frontend :
```bash
cd frontend
npm install
```

Backend :
```bash
cd backend
npm install
```

### Lancement de l'application

Backend (mode développement) :
```bash
cd backend
npm run dev
```

Frontend :
```bash
cd frontend
npm run dev
```

L'application sera accessible sur :
- Frontend : http://localhost:5173
- Backend API : http://localhost:5000

## Configuration de la Base de Données

1. Créer un projet sur Supabase
2. Exécuter le script SQL `database/schema.sql` dans l'éditeur SQL Supabase
3. Configurer les variables d'environnement avec les identifiants Supabase

## Fonctionnalités (à implémenter progressivement)

### Étape 1 ✅ : Initialisation du projet
- Structure du projet
- Configuration de la stack technique
- Schéma de base de données complet
- Configuration de base du frontend et backend

### Étape 2 ⏳ : Authentification et gestion des rôles
- Système d'authentification
- Rôles : fondateur, directeur, enseignant
- Double vérification pour le fondateur
- Validation des comptes enseignant

### Étape 3 ⏳ : Module gestion des élèves
- CRUD élèves
- Contrôle de doublon de matricule
- Gestion des photos
- Statuts et parcours multi-années
- Impression de listes

### Étape 4 ⏳ : Module gestion des enseignant(e)s
- Gestion des comptes
- Statuts (actif, en attente, congé, archivé)
- Réassignation d'élèves

### Étape 5 ⏳ : Module scolarités
- Tarifs par classe
- Versements partiels
- Reçus imprimables
- Historique et impayés

### Étape 6 ⏳ : Module salaires
- Montants des salaires
- Paiements mensuels partiels
- Historique

### Étape 7 ⏳ : Module passage de classe
- Saisie des moyennes
- Validation classe par classe

### Étape 8 ⏳ : Module dépenses
- CRUD dépenses
- Catégories prédéfinies
- Justificatifs
- Impression de liste

### Étape 9 ⏳ : Trimestres et statistiques
- Gestion des trimestres
- Statistiques par période

### Étape 10 ⏳ : Tableau de bord et fonctionnalités transverses
- Tableau de bord général
- Recherche
- Notifications
- Journal d'activité
- Export/sauvegarde globale

## Rôles et Permissions

### Fondateur
- Accès complet à toutes les fonctionnalités
- Double vérification (mot de passe + question secrète)
- Gestion des utilisateurs et permissions

### Directeur/Directrice
- Permissions personnalisables par le fondateur
- Accès aux fonctionnalités autorisées

### Enseignant(e)
- Gestion des élèves de ses classes
- Saisie des moyennes
- Consultation des scolarités de ses élèves

## Développement

Le projet se développe étape par étape. Chaque étape est validée avant de passer à la suivante.

## Licence

Ce projet est développé pour une école primaire au Burkina Faso.
