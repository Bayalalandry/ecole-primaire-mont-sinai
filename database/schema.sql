-- ============================================
-- Schéma de base de données pour l'école primaire
-- PostgreSQL via Supabase
-- ============================================

-- Extension pour les UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table des années scolaires
-- ============================================
CREATE TABLE school_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year_label VARCHAR(20) UNIQUE NOT NULL, -- Ex: "2024-2025"
    is_current BOOLEAN DEFAULT true,
    is_locked BOOLEAN DEFAULT false, -- Une fois terminée, les données sont verrouillées
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table des classes (niveaux)
-- ============================================
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(10) UNIQUE NOT NULL, -- CP1, CP2, CE1, CE2, CM1, CM2
    passing_grade DECIMAL(4,2) DEFAULT 10.00, -- Moyenne de passage (par défaut 10/20)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer les classes par défaut
INSERT INTO classes (name) VALUES 
('CP1'), ('CP2'), ('CE1'), ('CE2'), ('CM1'), ('CM2');

-- ============================================
-- Table des utilisateurs (authentification)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('founder', 'director', 'teacher')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    school_year_id UUID REFERENCES school_years(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table spécifique pour le fondateur (double vérification)
-- ============================================
CREATE TABLE founder_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    secret_question VARCHAR(255) NOT NULL,
    secret_answer_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table des permissions du directeur
-- ============================================
CREATE TABLE director_permissions (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    can_view_all_students BOOLEAN DEFAULT false,
    can_manage_students BOOLEAN DEFAULT false,
    can_set_tuition BOOLEAN DEFAULT false,
    can_set_salaries BOOLEAN DEFAULT false,
    can_validate_teachers BOOLEAN DEFAULT false,
    can_disable_accounts BOOLEAN DEFAULT false,
    can_reset_passwords BOOLEAN DEFAULT false,
    can_manage_expenses BOOLEAN DEFAULT false,
    can_approve_promotion BOOLEAN DEFAULT false,
    can_set_passing_grade BOOLEAN DEFAULT false,
    can_manage_trimesters BOOLEAN DEFAULT false,
    can_view_statistics BOOLEAN DEFAULT false,
    can_export_data BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table des enseignants
-- ============================================
CREATE TABLE teachers (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'on_leave', 'archived')),
    leave_start_date DATE,
    leave_end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table des affectations enseignant-classe
-- ============================================
CREATE TABLE teacher_class_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES teachers(user_id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    school_year VARCHAR(20), -- Année scolaire (ex: "2024-2025")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, class_id, school_year)
);

-- ============================================
-- Table des élèves
-- ============================================
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unique_identifier VARCHAR(20) UNIQUE NOT NULL, -- ID auto-généré unique (jamais modifiable)
    matricule VARCHAR(20) UNIQUE NOT NULL, -- Matricule saisi manuellement (avec contrôle de doublon)
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(1) CHECK (gender IN ('M', 'F')),
    photo_url TEXT, -- Photo optionnelle
    parent_name VARCHAR(100),
    parent_phone VARCHAR(20),
    parent_address TEXT,
    current_class_id UUID REFERENCES classes(id), -- Utiliser current_class_id pour compatibilité
    school_year VARCHAR(20), -- Année scolaire (ex: "2024-2025")
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'repeating', 'archived')),
    final_grade DECIMAL(4,2), -- Moyenne générale de fin d'année
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table de l'historique scolaire des élèves
-- ============================================
CREATE TABLE student_academic_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id),
    school_year VARCHAR(20), -- Année scolaire (ex: "2024-2025")
    final_grade DECIMAL(4,2),
    status VARCHAR(20) CHECK (status IN ('passed', 'repeating', 'transferred', 'enrolled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table des tarifs de scolarité par classe
-- ============================================
CREATE TABLE tuition_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    school_year VARCHAR(20), -- Année scolaire (ex: "2024-2025")
    amount DECIMAL(10,2) NOT NULL, -- Montant en XOF
    effective_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, school_year, effective_date)
);

-- ============================================
-- Table des paiements de scolarité
-- ============================================
CREATE TABLE tuition_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    school_year VARCHAR(20), -- Année scolaire (ex: "2024-2025")
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    trimester INTEGER CHECK (trimester IN (1, 2, 3)),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    cancelled BOOLEAN DEFAULT false,
    cancelled_by UUID REFERENCES users(id),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table des salaires des enseignants
-- ============================================
CREATE TABLE teacher_salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES teachers(user_id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES school_years(id) ON DELETE CASCADE,
    monthly_amount DECIMAL(10,2) NOT NULL, -- Montant mensuel en XOF
    effective_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, school_year_id, effective_date)
);

-- ============================================
-- Table des paiements de salaires
-- ============================================
CREATE TABLE salary_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salary_id UUID REFERENCES teacher_salaries(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(user_id) ON DELETE CASCADE,
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

-- ============================================
-- Table des dépenses
-- ============================================
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL CHECK (category IN ('rent', 'construction', 'supplies', 'maintenance', 'utilities', 'other')),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    receipt_url TEXT, -- Justificatif photo optionnel
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table des trimestres
-- ============================================
CREATE TABLE trimesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_year VARCHAR(20), -- Année scolaire (ex: "2024-2025")
    trimester_number INTEGER NOT NULL CHECK (trimester_number IN (1, 2, 3)),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_year, trimester_number)
);

-- ============================================
-- Table des paramètres de l'école
-- ============================================
CREATE TABLE school_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_name VARCHAR(200) NOT NULL,
    logo_url TEXT,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table du journal d'activité
-- ============================================
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table des notifications
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Index pour optimiser les performances
-- ============================================
CREATE INDEX idx_students_class_year ON students(class_id, school_year);
CREATE INDEX idx_students_matricule ON students(matricule);
CREATE INDEX idx_students_unique_identifier ON students(unique_identifier);
CREATE INDEX idx_payments_student_year ON tuition_payments(student_id, school_year_id);
CREATE INDEX idx_payments_trimester ON tuition_payments(trimester, school_year_id);
CREATE INDEX idx_teacher_assignments ON teacher_class_assignments(teacher_id, school_year_id);
CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ============================================
-- Trigger pour mettre à jour updated_at automatiquement
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger aux tables pertinentes
CREATE TRIGGER update_school_years_updated_at BEFORE UPDATE ON school_years
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_founder_settings_updated_at BEFORE UPDATE ON founder_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_director_permissions_updated_at BEFORE UPDATE ON director_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tuition_rates_updated_at BEFORE UPDATE ON tuition_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_salaries_updated_at BEFORE UPDATE ON teacher_salaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_school_settings_updated_at BEFORE UPDATE ON school_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
