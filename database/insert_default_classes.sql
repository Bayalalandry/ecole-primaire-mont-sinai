-- Insérer les classes par défaut si elles n'existent pas
-- Exécuter ce script dans l'éditeur SQL Supabase

INSERT INTO classes (name, passing_grade) VALUES 
('CP1', 10.00),
('CP2', 10.00),
('CE1', 10.00),
('CE2', 10.00),
('CM1', 10.00),
('CM2', 10.00)
ON CONFLICT (name) DO NOTHING;
