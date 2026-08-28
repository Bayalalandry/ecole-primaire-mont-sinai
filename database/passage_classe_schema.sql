-- ============================================
-- Schema pour le passage de classe
-- ============================================

-- Table pour stocker les moyennes annuelles par élève
CREATE TABLE student_annual_grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES school_years(id) ON DELETE CASCADE,
    final_grade DECIMAL(4,2) NOT NULL, -- Moyenne générale sur 20
    recorded_by UUID REFERENCES users(id), -- Enseignant qui a saisi la moyenne
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, school_year_id)
);

-- Table pour stocker les décisions de passage
CREATE TABLE passage_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES school_years(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id), -- Classe de départ
    proposed_status VARCHAR(20) NOT NULL CHECK (proposed_status IN ('passed', 'repeating')), -- Statut proposé automatiquement
    final_status VARCHAR(20) NOT NULL CHECK (final_status IN ('passed', 'repeating')), -- Statut final validé par le fondateur
    validated_by UUID REFERENCES users(id), -- Fondateur qui a validé
    validated_at TIMESTAMP WITH TIME ZONE,
    notes TEXT, -- Notes optionnelles (ex: cas limite)
    UNIQUE(student_id, school_year_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_annual_grades_student_year ON student_annual_grades(student_id, school_year_id);
CREATE INDEX idx_passage_decisions_student_year ON passage_decisions(student_id, school_year_id);
CREATE INDEX idx_passage_decisions_class ON passage_decisions(class_id);
