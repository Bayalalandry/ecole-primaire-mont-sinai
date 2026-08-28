-- Marquer 2025-2026 comme non actuelle
UPDATE school_years
SET is_current = false
WHERE year_label = '2025-2026';

-- S'assurer que 2026-2027 est actuelle
UPDATE school_years
SET is_current = true
WHERE year_label = '2026-2027';
