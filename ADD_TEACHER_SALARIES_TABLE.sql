-- ============================================
-- Table des salaires des enseignants (personnel sans compte)
-- ============================================

CREATE TABLE IF NOT EXISTS teacher_salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES school_years(id) ON DELETE CASCADE,
    monthly_amount DECIMAL(10,2) NOT NULL, -- Montant mensuel en XOF
    effective_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, school_year_id, effective_date)
);

-- ============================================
-- Table des paiements de salaire des enseignants
-- ============================================

CREATE TABLE IF NOT EXISTS teacher_salary_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salary_id UUID REFERENCES teacher_salaries(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_month DATE NOT NULL, -- Premier jour du mois
    payment_date DATE NOT NULL,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    cancelled BOOLEAN DEFAULT false,
    cancelled_by UUID REFERENCES users(id),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
