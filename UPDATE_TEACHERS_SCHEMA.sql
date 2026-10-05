-- ============================================
-- Migration: Simplifier la table teachers (nom, prénom, classe)
-- ============================================

-- Supprimer les colonnes non nécessaires
ALTER TABLE teachers DROP COLUMN IF EXISTS subject;
ALTER TABLE teachers DROP COLUMN IF EXISTS phone;
ALTER TABLE teachers DROP COLUMN IF EXISTS notes;

-- Renommer la colonne class en class_id si elle existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' 
    AND column_name = 'class'
  ) THEN
    ALTER TABLE teachers RENAME COLUMN class TO class_id_old;
  END IF;
END $$;

-- Ajouter la colonne class_id comme foreign key si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' 
    AND column_name = 'class_id'
  ) THEN
    ALTER TABLE teachers ADD COLUMN class_id UUID REFERENCES classes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Supprimer l'ancienne colonne si elle existe
ALTER TABLE teachers DROP COLUMN IF EXISTS class_id_old;

-- Mettre à jour le commentaire
COMMENT ON TABLE teachers IS 'Enseignants sans compte utilisateur (pour gestion salariale et statistiques) - Nom, Prénom, Classe (foreign key)';
