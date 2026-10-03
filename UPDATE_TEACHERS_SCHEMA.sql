-- ============================================
-- Migration: Simplifier la table teachers (nom, prénom, classe)
-- ============================================

-- Supprimer les colonnes non nécessaires
ALTER TABLE teachers DROP COLUMN IF EXISTS subject;
ALTER TABLE teachers DROP COLUMN IF EXISTS phone;
ALTER TABLE teachers DROP COLUMN IF EXISTS notes;

-- Ajouter la colonne class si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teachers' 
    AND column_name = 'class'
  ) THEN
    ALTER TABLE teachers ADD COLUMN class VARCHAR(20);
  END IF;
END $$;

-- Mettre à jour le commentaire
COMMENT ON TABLE teachers IS 'Enseignants sans compte utilisateur (pour gestion salariale et statistiques) - Nom, Prénom, Classe';
