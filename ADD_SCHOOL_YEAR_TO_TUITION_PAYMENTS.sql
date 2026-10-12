-- Ajouter la colonne school_year à la table tuition_payments si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tuition_payments'
    AND column_name = 'school_year'
  ) THEN
    ALTER TABLE tuition_payments ADD COLUMN school_year VARCHAR(20);
  END IF;
END $$;
