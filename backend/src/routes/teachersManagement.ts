import { Router } from 'express';
import { AuthRequest, authenticateToken, requireFounder } from '../middleware/auth';
import { teachersService } from '../services/teachersService';

const router = Router();

// Lister tous les enseignants
router.get('/', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const data = await teachersService.getAllTeachers();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Créer un enseignant
router.post('/', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const teacher = await teachersService.createTeacher(req.body);
    res.status(201).json({ teacher });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour un enseignant
router.put('/:id', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const teacher = await teachersService.updateTeacher(id, req.body);
    res.json({ teacher });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un enseignant
router.delete('/:id', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await teachersService.deleteTeacher(id);
    res.json({ message: 'Enseignant supprimé' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Fixer le salaire d'un enseignant
router.post('/:teacherId/salary', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const teacherId = Array.isArray(req.params.teacherId) ? req.params.teacherId[0] : req.params.teacherId;
    const { schoolYearId, fixedSalary, notes } = req.body;
    const salary = await teachersService.setTeacherSalary(
      teacherId,
      schoolYearId,
      fixedSalary,
      notes
    );
    res.status(201).json({ salary });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Lister les salaires des enseignants
router.get('/salaries', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const schoolYearId = Array.isArray(req.query.schoolYearId) ? req.query.schoolYearId[0] : req.query.schoolYearId;
    const data = await teachersService.getTeacherSalaries(schoolYearId as string);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Enregistrer un paiement de salaire
router.post('/:teacherId/pay', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const teacherId = Array.isArray(req.params.teacherId) ? req.params.teacherId[0] : req.params.teacherId;
    const { salaryId, schoolYearId, amount, paymentMethod, notes } = req.body;
    const payment = await teachersService.payTeacherSalary(
      teacherId,
      salaryId,
      schoolYearId,
      amount,
      paymentMethod,
      notes
    );
    res.status(201).json({ payment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Lister les paiements de salaire
router.get('/payments', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const schoolYearId = Array.isArray(req.query.schoolYearId) ? req.query.schoolYearId[0] : req.query.schoolYearId;
    const data = await teachersService.getTeacherSalaryPayments(schoolYearId as string);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir le résumé des salaires
router.get('/salaries/summary', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const schoolYearId = Array.isArray(req.query.schoolYearId) ? req.query.schoolYearId[0] : req.query.schoolYearId;
    const summary = await teachersService.getTeacherSalarySummary(schoolYearId as string);
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
