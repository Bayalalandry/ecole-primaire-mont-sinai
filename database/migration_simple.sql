-- Migration simplifiée pour ajouter les champs manquants
-- Exécuter ce script dans l'éditeur SQL Supabase

-- Ajouter les colonnes manquantes à la table students
ALTER TABLE students ADD COLUMN IF NOT EXISTS unique_identifier VARCHAR(20) UNIQUE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS gender VARCHAR(1);
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_name VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_address TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS created_by UUID;

-- Ajouter school_year VARCHAR(20) s'il n'existe pas
ALTER TABLE students ADD COLUMN IF NOT EXISTS school_year VARCHAR(20);

-- Créer l'index pour unique_identifier
CREATE INDEX IF NOT EXISTS idx_students_unique_identifier ON students(unique_identifier);

-- Pour student_academic_history
ALTER TABLE student_academic_history ADD COLUMN IF NOT EXISTS school_year VARCHAR(20);

-- Note: current_class_id existe déjà dans la base, pas besoin de le modifier
