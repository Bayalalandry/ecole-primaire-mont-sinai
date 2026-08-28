-- Script pour insérer les classes par défaut en contournant le RLS
-- Exécuter ce script dans l'éditeur SQL Supabase avec un compte admin

-- Désactiver temporairement le RLS pour la table classes
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;

-- Insérer les classes par défaut
INSERT INTO classes (name, passing_grade) VALUES 
('CP1', 10.00),
('CP2', 10.00),
('CE1', 10.00),
('CE2', 10.00),
('CM1', 10.00),
('CM2', 10.00)
ON CONFLICT (name) DO NOTHING;

-- Réactiver le RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre la lecture à tous
CREATE POLICY "Enable read access for all users" ON classes
FOR SELECT
TO public
USING (true);

-- Créer une politique pour permettre l'insertion uniquement aux fondateurs/directeurs
CREATE POLICY "Enable insert for founders and directors" ON classes
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('founder', 'director')
  )
);
