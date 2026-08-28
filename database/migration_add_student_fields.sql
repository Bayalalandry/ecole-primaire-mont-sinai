-- Migration pour ajouter les champs manquants à la table students
-- Exécuter ce script dans l'éditeur SQL Supabase

-- Ajouter les colonnes manquantes si elles n'existent pas déjà
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS unique_identifier VARCHAR(20) UNIQUE;

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS gender VARCHAR(1) CHECK (gender IN ('M', 'F'));

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS parent_name VARCHAR(100);

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS parent_address TEXT;

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Renommer les colonnes si nécessaire
DO $$
BEGIN
    -- Renommer current_class_id en class_id si la colonne existe encore
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'current_class_id') THEN
        ALTER TABLE students RENAME COLUMN current_class_id TO class_id;
    END IF;
    
    -- Renommer current_school_year_id en school_year si la colonne existe encore
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'current_school_year_id') THEN
        ALTER TABLE students RENAME COLUMN current_school_year_id TO school_year;
    END IF;
    
    -- Si school_year n'existe pas encore, l'ajouter
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'school_year') THEN
        ALTER TABLE students ADD COLUMN school_year VARCHAR(20);
    END IF;
END $$;

-- Mettre à jour la contrainte CHECK pour le status
ALTER TABLE students 
DROP CONSTRAINT IF EXISTS students_status_check;

ALTER TABLE students 
ADD CONSTRAINT students_status_check 
CHECK (status IN ('active', 'repeating', 'archived'));

-- Créer l'index pour unique_identifier s'il n'existe pas
CREATE INDEX IF NOT EXISTS idx_students_unique_identifier ON students(unique_identifier);

-- Mettre à jour l'index existant pour class_year
DROP INDEX IF EXISTS idx_students_class_year;
CREATE INDEX idx_students_class_year ON students(class_id, school_year);

-- Mettre à jour la table student_academic_history
ALTER TABLE student_academic_history 
ADD COLUMN IF NOT EXISTS school_year VARCHAR(20);

DO $$
BEGIN
    -- Renommer school_year_id en school_year si la colonne existe encore
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_academic_history' AND column_name = 'school_year_id') THEN
        ALTER TABLE student_academic_history RENAME COLUMN school_year_id TO school_year;
    END IF;
END $$;

-- Mettre à jour le statut CHECK pour student_academic_history
ALTER TABLE student_academic_history 
DROP CONSTRAINT IF EXISTS student_academic_history_status_check;

ALTER TABLE student_academic_history 
ADD CONSTRAINT student_academic_history_status_check 
CHECK (status IN ('passed', 'repeating', 'transferred', 'enrolled'));
