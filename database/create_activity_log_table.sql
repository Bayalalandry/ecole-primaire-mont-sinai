-- Table du journal d'activite
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('student', 'teacher', 'class', 'tuition_rate', 'salary', 'expense', 'passage', 'school_year')),
    entity_id UUID,
    description TEXT,
    user_id UUID REFERENCES users(id),
    user_name TEXT,
    user_role TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les filtres
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);
