-- Ajouter la colonne school_year à secretary_class_assignments si elle n'existe pas
ALTER TABLE secretary_class_assignments
ADD COLUMN IF NOT EXISTS school_year VARCHAR(20);

-- Mettre à jour les enregistrements existants avec l'année scolaire actuelle
UPDATE secretary_class_assignments
SET school_year = '2024-2025'
WHERE school_year IS NULL;
