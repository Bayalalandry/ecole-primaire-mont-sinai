-- Ajouter le champ status à la table tuition_payments
ALTER TABLE tuition_payments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'paid' CHECK (status IN ('paid', 'partial', 'cancelled'));

-- Mettre à jour les versements existants pour qu'ils aient le statut 'paid'
UPDATE tuition_payments SET status = 'paid' WHERE status IS NULL OR status = '';
