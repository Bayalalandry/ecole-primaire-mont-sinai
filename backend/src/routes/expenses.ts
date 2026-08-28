import { Router } from 'express';
import { AuthRequest, authenticateToken, requireFounder } from '../middleware/auth';
import { supabase } from '../services/supabase';
import { logActivity } from '../services/authService';

const router = Router();

// Utilitaire pour gérer les paramètres de route qui peuvent être des tableaux
const getParam = (param: string | string[]): string => {
  return Array.isArray(param) ? param[0] : param;
};

// ============================================
// GESTION DES DÉPENSES (FONDATEUR)
// ============================================

// Récupérer toutes les dépenses avec filtres
router.get('/', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { category, startDate, endDate } = req.query;

    let query = supabase
      .from('expenses')
      .select('*, users(first_name, last_name)')
      .order('expense_date', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (startDate) {
      query = query.gte('expense_date', startDate);
    }

    if (endDate) {
      query = query.lte('expense_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ expenses: data });
  } catch (error: any) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des dépenses' });
  }
});

// Récupérer les statistiques des dépenses
router.get('/statistics', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { category, startDate, endDate } = req.query;

    let query = supabase
      .from('expenses')
      .select('category, amount, expense_date');

    if (category) {
      query = query.eq('category', category);
    }

    if (startDate) {
      query = query.gte('expense_date', startDate);
    }

    if (endDate) {
      query = query.lte('expense_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculer les totaux par catégorie
    const totalsByCategory: any = {};
    let totalAmount = 0;

    data.forEach((expense: any) => {
      if (!totalsByCategory[expense.category]) {
        totalsByCategory[expense.category] = 0;
      }
      totalsByCategory[expense.category] += Number(expense.amount);
      totalAmount += Number(expense.amount);
    });

    // Calculer les totaux par mois
    const totalsByMonth: any = {};
    data.forEach((expense: any) => {
      const month = expense.expense_date.substring(0, 7); // YYYY-MM
      if (!totalsByMonth[month]) {
        totalsByMonth[month] = 0;
      }
      totalsByMonth[month] += Number(expense.amount);
    });

    res.json({
      totalAmount,
      totalsByCategory,
      totalsByMonth,
      count: data.length,
    });
  } catch (error: any) {
    console.error('Get expenses statistics error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// Ajouter une nouvelle dépense
router.post('/', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { category, amount, expenseDate, description, receiptUrl } = req.body;

    if (!category || !amount || !expenseDate) {
      return res.status(400).json({ error: 'Champs requis: category, amount, expenseDate' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Le montant doit être supérieur à 0' });
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        category,
        amount,
        expense_date: expenseDate,
        description,
        receipt_url: receiptUrl,
        created_by: req.user?.id,
      })
      .select()
      .maybeSingle();

    if (error) throw error;

    await logActivity(req.user!.id, 'CREATE_EXPENSE', 'expense', data.id, {
      category,
      amount,
    });

    res.json({ message: 'Dépense ajoutée avec succès', expense: data });
  } catch (error: any) {
    console.error('Add expense error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de la dépense' });
  }
});

// Modifier une dépense
router.put('/:id', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const idStr = getParam(id);
    const { category, amount, expenseDate, description, receiptUrl } = req.body;

    if (!category || !amount || !expenseDate) {
      return res.status(400).json({ error: 'Champs requis: category, amount, expenseDate' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Le montant doit être supérieur à 0' });
    }

    const { data, error } = await supabase
      .from('expenses')
      .update({
        category,
        amount,
        expense_date: expenseDate,
        description,
        receipt_url: receiptUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;

    await logActivity(req.user!.id, 'UPDATE_EXPENSE', 'expense', idStr, {
      category,
      amount,
    });

    res.json({ message: 'Dépense modifiée avec succès', expense: data });
  } catch (error: any) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de la dépense' });
  }
});

// Supprimer une dépense
router.delete('/:id', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const idStr = getParam(id);

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', idStr);

    if (error) throw error;

    await logActivity(req.user!.id, 'DELETE_EXPENSE', 'expense', idStr, {
      expenseId: idStr,
    });

    res.json({ message: 'Dépense supprimée avec succès' });
  } catch (error: any) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la dépense' });
  }
});

export const expenseRoutes = router;
