-- Ajouter la colonne 'notes' à la table tuition_payments
ALTER TABLE tuition_payments ADD COLUMN IF NOT EXISTS notes TEXT;
