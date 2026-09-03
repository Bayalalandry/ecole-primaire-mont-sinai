# Analyse du changement Teacher → Secretary

## Impact de la migration

### Fichiers Backend principaux
1. `backend/src/middleware/auth.ts` - Rôle 'teacher' dans les middlewares
2. `backend/src/routes/auth.ts` - Endpoints de création/connexion teacher
3. `backend/src/routes/dashboard.ts` - Dashboard teacher avec restrictions de classe
4. `backend/src/routes/teachers.ts` - Endpoints spécifiques aux teachers
5. `backend/src/routes/salaries.ts` - Salaires des teachers
6. `backend/src/routes/passage.ts` - Passage de classe (teacher references)
7. `backend/src/routes/students.ts` - Gestion élèves (teacher restrictions)
8. `backend/src/routes/classes.ts` - Classes (teacher references)
9. `backend/src/routes/statistics.ts` - Stats (teacher references)
10. `backend/src/routes/search.ts` - Recherche (teacher references)
11. `backend/src/services/authService.ts` - Rôle teacher dans auth

### Fichiers Frontend principaux
1. `frontend/src/pages/RegisterPage.tsx` - **À SUPPRIMER**
2. `frontend/src/pages/LoginPage.tsx` - Supprimer lien inscription
3. `frontend/src/pages/TeacherDashboard.tsx` - Renommer en SecretaryDashboard.tsx
4. `frontend/src/pages/TeachersPage.tsx` - Renommer en SecretariesPage.tsx
5. `frontend/src/App.tsx` - Supprimer route RegisterPage
6. `frontend/src/services/teacherService.ts` - Renommer en secretaryService.ts
7. `frontend/src/services/teacherDashboardService.ts` - Renommer en secretaryDashboardService.ts
8. `frontend/src/services/authService.ts` - Rôle teacher
9. `frontend/src/pages/StudentsPage.tsx` - Teacher references
10. `frontend/src/pages/PassagePage.tsx` - Teacher references
11. `frontend/src/pages/SalaryPage.tsx` - Teacher references
12. `frontend/src/pages/ProfilePage.tsx` - Teacher references
13. `frontend/src/pages/ActivityLogPage.tsx` - Teacher references

### Changements de logique
1. **Suppression restrictions de classe** : Le secrétaire voit TOUTES les classes
2. **Suppression assignation classe** : Plus besoin de teacher_class_assignments pour le secrétaire
3. **Suppression circuit validation** : Plus besoin de validation de compte teacher
4. **Accès Salaires/Dépenses** : Le secrétaire N'A PAS accès à ces modules

### Stratégie de migration
1. Phase 1 : Migration base de données (teacher → secretary)
2. Phase 2 : Backend middleware et auth
3. Phase 3 : Backend routes (dashboard, students, classes)
4. Phase 4 : Backend routes (salaries, passage, others)
5. Phase 5 : Frontend suppression RegisterPage
6. Phase 6 : Frontend LoginPage
7. Phase 7 : Frontend SecretaryDashboard
8. Phase 8 : Frontend SecretariesPage
9. Phase 9 : Frontend services et autres pages
10. Phase 10 : Tests et optimisations
