-- ============================================
-- Script pour corriger le schéma des tables de salaires d'enseignants
-- ============================================

-- Supprimer les tables existantes (attention: cela va supprimer les données)
DROP TABLE IF EXISTS teacher_salary_payments;
DROP TABLE IF EXISTS teacher_salaries;

-- Recréer la table teachers si elle n'existe pas
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'archived')),
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table teacher_salaries avec le bon schéma
CREATE TABLE teacher_salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES school_years(id) ON DELETE CASCADE,
    monthly_amount DECIMAL(10,2) NOT NULL,
    effective_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, school_year_id, effective_date)
);

-- Créer la table teacher_salary_payments avec le bon schéma
CREATE TABLE teacher_salary_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salary_id UUID REFERENCES teacher_salaries(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_month DATE NOT NULL,
    payment_date DATE NOT NULL,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    cancelled BOOLEAN DEFAULT false,
    cancelled_by UUID REFERENCES users(id),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Désactiver RLS pour ces tables
ALTER TABLE teacher_salaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_salary_payments DISABLE ROW LEVEL SECURITY;

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_teacher_salaries_teacher_id ON teacher_salaries(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_salaries_school_year_id ON teacher_salaries(school_year_id);
CREATE INDEX IF NOT EXISTS idx_teacher_salary_payments_teacher_id ON teacher_salary_payments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_salary_payments_salary_id ON teacher_salary_payments(salary_id);
CREATE INDEX IF NOT EXISTS idx_teacher_salary_payments_payment_date ON teacher_salary_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_teacher_salary_payments_payment_month ON teacher_salary_payments(payment_month);
