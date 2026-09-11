-- ============================================
-- Migration Teacher → Secretary - Phase 1
-- Modifier les contraintes de rôle et renommer les tables
-- ============================================

-- 1. Modifier la contrainte de rôle dans la table users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;
END $$;

ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('founder', 'director', 'secretary'));

-- 2. Renommer la table teachers en secretaries (si elle existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teachers') THEN
    ALTER TABLE teachers RENAME TO secretaries;
  END IF;
END $$;

-- 3. Renommer la table teacher_class_assignments en secretary_class_assignments (si elle existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teacher_class_assignments') THEN
    ALTER TABLE teacher_class_assignments RENAME TO secretary_class_assignments;
  END IF;
END $$;

-- 4. Renommer la table teacher_salaries en secretary_salaries (si elle existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teacher_salaries') THEN
    ALTER TABLE teacher_salaries RENAME TO secretary_salaries;
  END IF;
END $$;

-- 5. Renommer les colonnes dans secretary_class_assignments (si la colonne existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'secretary_class_assignments' 
    AND column_name = 'teacher_id'
  ) THEN
    ALTER TABLE secretary_class_assignments RENAME COLUMN teacher_id TO secretary_id;
  END IF;
END $$;

-- 6. Renommer les colonnes dans secretary_salaries (si la colonne existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'secretary_salaries' 
    AND column_name = 'teacher_id'
  ) THEN
    ALTER TABLE secretary_salaries RENAME COLUMN teacher_id TO secretary_id;
  END IF;
END $$;

-- 7. Renommer les colonnes dans tuition_payments (si la colonne existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tuition_payments' 
    AND column_name = 'teacher_id'
  ) THEN
    ALTER TABLE tuition_payments RENAME COLUMN teacher_id TO secretary_id;
  END IF;
END $$;

-- 8. Mettre à jour les index
DROP INDEX IF EXISTS idx_teacher_assignments;
CREATE INDEX IF NOT EXISTS idx_secretary_assignments ON secretary_class_assignments(secretary_id, school_year_id);

-- 9. Mettre à jour les triggers
DROP TRIGGER IF EXISTS update_teachers_updated_at ON secretaries;
DROP TRIGGER IF EXISTS update_secretaries_updated_at ON secretaries;
CREATE TRIGGER update_secretaries_updated_at BEFORE UPDATE ON secretaries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teacher_salaries_updated_at ON secretary_salaries;
DROP TRIGGER IF EXISTS update_secretary_salaries_updated_at ON secretary_salaries;
CREATE TRIGGER update_secretary_salaries_updated_at BEFORE UPDATE ON secretary_salaries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Mettre à jour les colonnes de permissions dans users (si la colonne existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'can_validate_teachers'
  ) THEN
    ALTER TABLE users RENAME COLUMN can_validate_teachers TO can_validate_secretaries;
  END IF;
END $$;