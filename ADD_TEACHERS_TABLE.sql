-- ============================================
-- Table des enseignants (sans compte utilisateur)
-- Pour la gestion salariale et les statistiques
-- ============================================

CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL, -- Classe assignée (optionnel)
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'archived')),
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table des salaires des enseignants
-- ============================================

CREATE TABLE IF NOT EXISTS teacher_salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    school_year_id UUID NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
    fixed_salary DECIMAL(10,2) NOT NULL, -- Salaire fixe mensuel
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, school_year_id) -- Un seul salaire par enseignant par année scolaire
);

-- ============================================
-- Table des paiements de salaire aux enseignants
-- ============================================

CREATE TABLE IF NOT EXISTS teacher_salary_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    salary_id UUID NOT NULL REFERENCES teacher_salaries(id) ON DELETE CASCADE,
    school_year_id UUID NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'check')),
    receipt_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Index pour optimiser les requêtes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_teacher_salaries_teacher_id ON teacher_salaries(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_salaries_school_year_id ON teacher_salaries(school_year_id);
CREATE INDEX IF NOT EXISTS idx_teacher_salary_payments_teacher_id ON teacher_salary_payments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_salary_payments_salary_id ON teacher_salary_payments(salary_id);
CREATE INDEX IF NOT EXISTS idx_teacher_salary_payments_school_year_id ON teacher_salary_payments(school_year_id);
CREATE INDEX IF NOT EXISTS idx_teacher_salary_payments_payment_date ON teacher_salary_payments(payment_date);

-- ============================================
-- Commentaires
-- ============================================

COMMENT ON TABLE teachers IS 'Enseignants sans compte utilisateur (pour gestion salariale et statistiques) - Nom, Prénom, Classe';
COMMENT ON TABLE teacher_salaries IS 'Salaires fixes des enseignants par année scolaire';
COMMENT ON TABLE teacher_salary_payments IS 'Paiements de salaire effectués aux enseignants';
