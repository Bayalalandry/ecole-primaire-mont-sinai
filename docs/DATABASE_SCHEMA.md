# Schéma de Base de Données

## Vue d'ensemble

Le schéma de base de données est conçu pour gérer une école primaire avec support multi-années, gestion des rôles, et traçabilité complète.

## Tables Principales

### 1. school_years (Années scolaires)
Gestion des années scolaires avec verrouillage.
- `id`: UUID (primary key)
- `year_label`: Label unique (ex: "2024-2025")
- `is_current`: Année en cours
- `is_locked`: Année verrouillée (plus de modifications)
- `start_date` / `end_date`: Dates de l'année scolaire

### 2. classes (Niveaux)
Les 6 classes de l'école primaire (CP1 à CM2).
- `id`: UUID (primary key)
- `name`: Nom unique (CP1, CP2, CE1, CE2, CM1, CM2)
- `passing_grade`: Moyenne de passage (défaut: 10/20)

### 3. users (Utilisateurs)
Table d'authentification pour tous les utilisateurs.
- `id`: UUID (primary key)
- `username`: Nom d'utilisateur unique
- `password_hash`: Mot de passe hashé
- `role`: 'founder', 'director', ou 'teacher'
- `first_name` / `last_name`: Nom et prénom
- `is_active`: Statut du compte
- `school_year_id`: Année scolaire de référence

### 4. founder_settings (Paramètres fondateur)
Double vérification pour le fondateur.
- `user_id`: Référence vers users
- `secret_question`: Question secrète
- `secret_answer_hash`: Réponse hashée

### 5. director_permissions (Permissions directeur)
Permissions personnalisables pour le directeur.
- `user_id`: Référence vers users
- Plusieurs flags booléens pour chaque permission

### 6. teachers (Enseignants)
Informations spécifiques aux enseignants.
- `user_id`: Référence vers users
- `status`: 'active', 'pending', 'on_leave', 'archived'
- `leave_start_date` / `leave_end_date`: Dates de congé

### 7. teacher_class_assignments (Affectations)
Relation plusieurs-à-plusieurs enseignants/classes.
- `teacher_id`: Référence vers teachers
- `class_id`: Référence vers classes
- `school_year_id`: Référence vers school_years

### 8. students (Élèves)
Informations des élèves.
- `id`: UUID (primary key)
- `unique_identifier`: ID auto-généré unique
- `matricule`: Matricule saisi manuellement (unique)
- `first_name` / `last_name`: Nom et prénom
- `photo_url`: Photo optionnelle
- `parent_phone`: Téléphone du parent/tuteur
- `current_class_id`: Classe actuelle
- `current_school_year_id`: Année scolaire actuelle
- `status`: 'active', 'repeating', 'archived'
- `final_grade`: Moyenne générale de fin d'année

### 9. student_academic_history (Historique scolaire)
Parcours complet de l'élève à travers les années.
- `student_id`: Référence vers students
- `class_id`: Classe fréquentée
- `school_year_id`: Année scolaire
- `final_grade`: Moyenne obtenue
- `status`: 'passed', 'repeating', 'transferred'

### 10. tuition_rates (Tarifs de scolarité)
Tarifs par classe et par année.
- `class_id`: Référence vers classes
- `school_year_id`: Référence vers school_years
- `amount`: Montant en XOF
- `effective_date`: Date d'effet

### 11. tuition_payments (Paiements de scolarité)
Historique des paiements des élèves.
- `student_id`: Référence vers students
- `school_year_id`: Référence vers school_years
- `amount`: Montant payé
- `payment_date`: Date du paiement
- `trimester`: Trimestre (1, 2, ou 3)
- `receipt_number`: Numéro de reçu unique
- `cancelled`: Paiement annulé
- `cancelled_by` / `cancelled_at`: Qui a annulé et quand
- `created_by`: Qui a créé le paiement

### 12. teacher_salaries (Salaires enseignants)
Salaires par enseignant et par année.
- `teacher_id`: Référence vers teachers
- `school_year_id`: Référence vers school_years
- `monthly_amount`: Montant mensuel en XOF
- `effective_date`: Date d'effet

### 13. salary_payments (Paiements de salaires)
Historique des paiements de salaires.
- `salary_id`: Référence vers teacher_salaries
- `teacher_id`: Référence vers teachers
- `amount`: Montant payé
- `payment_month`: Mois concerné
- `payment_date`: Date du paiement
- `created_by`: Qui a enregistré le paiement

### 14. expenses (Dépenses)
Dépenses de l'école.
- `category`: 'rent', 'construction', 'supplies', 'maintenance', 'utilities', 'other'
- `description`: Description
- `amount`: Montant en XOF
- `expense_date`: Date de la dépense
- `receipt_url`: Justificatif photo optionnel
- `created_by`: Qui a ajouté la dépense

### 15. trimesters (Trimestres)
Définition des trimestres par année.
- `school_year_id`: Référence vers school_years
- `trimester_number`: 1, 2, ou 3
- `start_date` / `end_date`: Dates du trimestre

### 16. school_settings (Paramètres de l'école)
Informations générales de l'école.
- `school_name`: Nom de l'école
- `logo_url`: URL du logo
- `address`: Adresse
- `phone`: Téléphone
- `email`: Email

### 17. activity_log (Journal d'activité)
Traçabilité des actions sensibles.
- `user_id`: Qui a effectué l'action
- `action`: Type d'action
- `entity_type`: Type d'entité concernée
- `entity_id`: ID de l'entité
- `details`: Détails supplémentaires (JSON)
- `created_at`: Quand l'action a été effectuée

### 18. notifications (Notifications)
Notifications pour les utilisateurs.
- `user_id`: Destinataire
- `title`: Titre
- `message`: Message
- `is_read`: Lu ou non
- `created_at`: Date de création

## Index

Des index ont été créés pour optimiser les performances :
- Recherche d'élèves par classe et année
- Recherche par matricule
- Recherche de paiements par élève/année/trimestre
- Recherche d'affectations enseignants
- Journal d'activité et notifications

## Triggers

Un trigger automatique met à jour le champ `updated_at` des tables principales à chaque modification.

## Sécurité

- Tous les mots de passe sont hashés avec bcrypt
- Les relations avec onDelete CASCADE assurent l'intégrité
- Les contraintes CHECK valident les valeurs des énumérations
- Les contraintes UNIQUE empêchent les doublons
