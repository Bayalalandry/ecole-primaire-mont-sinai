-- Table des dépenses de l'école
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('fournitures_scolaires', 'entretien_reparations', 'electricite_eau', 'transport', 'alimentation_cantine', 'autres')),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL,
    description TEXT,
    receipt_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les filtres
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);

-- Commentaires
COMMENT ON TABLE expenses IS 'Depenses de l''ecole';
COMMENT ON COLUMN expenses.category IS 'Categorie de la depense';
COMMENT ON COLUMN expenses.amount IS 'Montant de la depense en FCFA';
COMMENT ON COLUMN expenses.expense_date IS 'Date de la depense';
COMMENT ON COLUMN expenses.description IS 'Description courte de la depense';
COMMENT ON COLUMN expenses.receipt_url IS 'URL du justificatif (facture/recu)';
COMMENT ON COLUMN expenses.created_by IS 'Utilisateur qui a cree la depense';
