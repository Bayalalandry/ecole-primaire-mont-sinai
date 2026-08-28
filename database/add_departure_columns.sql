-- Ajouter les colonnes pour gérer les départs d'élèves
ALTER TABLE students
ADD COLUMN IF NOT EXISTS departure_date DATE,
ADD COLUMN IF NOT EXISTS departure_reason TEXT;
