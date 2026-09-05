import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenStorage } from '../services/authService';
import { expenseService } from '../services/expenseService';
import jsPDF from 'jspdf';
import { FileText, Plus, Filter, Calendar, DollarSign, Receipt, Edit, Trash2, CheckCircle, X, ArrowLeft } from 'lucide-react';
import SchoolLogo from '../components/SchoolLogo';
import { SCHOOL_CONFIG } from '../config/schoolConfig';

const EXPENSE_CATEGORIES = [
  { value: 'fournitures', label: 'Fournitures scolaires' },
  { value: 'entretien', label: 'Entretien/Réparations' },
  { value: 'electricite_eau', label: 'Électricité/Eau' },
  { value: 'transport', label: 'Transport' },
  { value: 'cantine', label: 'Alimentation/Cantine' },
  { value: 'autres', label: 'Autres' },
];

export default function ExpensesPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  const [form, setForm] = useState({
    category: 'fournitures_scolaires',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    description: '',
    receiptUrl: '',
  });

  const [filters, setFilters] = useState({
    category: '',
    startDate: '',
    endDate: '',
  });

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatAmount = (amount: number): string => {
    const rounded = Math.round(amount);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
  };

  const loadExpenses = async (token: string) => {
    try {
      const data = await expenseService.getExpenses(filters, token);
      setExpenses(data.expenses || []);
    } catch (error: any) {
      console.error('Error loading expenses:', error);
    }
  };

  const loadStatistics = async (token: string) => {
    try {
      const data = await expenseService.getStatistics(filters, token);
      setStatistics(data);
    } catch (error: any) {
      console.error('Error loading statistics:', error);
    }
  };

  const loadData = async (token: string) => {
    setLoading(true);
    await Promise.all([loadExpenses(token), loadStatistics(token)]);
    setLoading(false);
  };

  useEffect(() => {
    const token = tokenStorage.getToken();
    const currentUser = tokenStorage.getUser();

    if (!token || !currentUser) {
      navigate('/login');
      return;
    }

    if (currentUser.role !== 'founder') {
      alert('Accès refusé. Seul le fondateur peut accéder à cette page.');
      navigate('/dashboard/founder');
      return;
    }

    setUser(currentUser);
    loadData(token);
  }, [navigate]);

  useEffect(() => {
    const token = tokenStorage.getToken();
    if (token) {
      loadData(token);
    }
  }, [filters]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenStorage.getToken();
    if (!token) return;

    try {
      if (editingExpense) {
        await expenseService.updateExpense(editingExpense.id, form, token);
        alert('Dépense modifiée avec succès');
      } else {
        await expenseService.addExpense(form, token);
        alert('Dépense ajoutée avec succès');
      }
      setShowForm(false);
      setEditingExpense(null);
      setForm({
        category: 'fournitures',
        amount: '',
        expenseDate: new Date().toISOString().split('T')[0],
        description: '',
        receiptUrl: '',
      });
      loadData(token);
      localStorage.setItem('globalStatsUpdate', Date.now().toString());
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setForm({
      category: expense.category,
      amount: expense.amount,
      expenseDate: expense.expense_date,
      description: expense.description || '',
      receiptUrl: expense.receipt_url || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;

    const token = tokenStorage.getToken();
    if (!token) return;

    try {
      await expenseService.deleteExpense(id, token);
      alert('Dépense supprimée avec succès');
      loadData(token);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      category: '',
      startDate: '',
      endDate: '',
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const schoolName = SCHOOL_CONFIG.name;
    const generationDate = new Date().toLocaleDateString('fr-FR');
    const exportedBy = `${user?.last_name} ${user?.first_name}`;
    let pageCount = 1;

    // Bannière bleue
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, 210, 35, 'F');

    // En-tête global
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(schoolName, 14, 15);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Liste des Dépenses', 14, 24);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Date de génération: ${generationDate}`, 14, 32);
    doc.text(`Exporté par: ${exportedBy}`, 110, 32);
    doc.text(`Page ${pageCount}`, 180, 32);

    let y = 45;

    // En-têtes de colonnes avec fond bleu clair
    doc.setFillColor(224, 231, 255);
    doc.rect(14, y - 5, 180, 8, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Date', 14, y);
    doc.text('Catégorie', 40, y);
    doc.text('Description', 80, y);
    doc.text('Montant', 130, y);
    doc.text('Justif.', 160, y);
    y += 10;

    expenses.forEach((expense, index) => {
      if (y > 280) {
        doc.addPage();
        pageCount++;
        y = 20;
        // Bannière bleue
        doc.setFillColor(30, 64, 175);
        doc.rect(0, 0, 210, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(schoolName, 14, 15);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('Liste des Dépenses', 14, 24);
        doc.setFontSize(9);
        doc.text(`Date de génération: ${generationDate}`, 14, 32);
        doc.text(`Exporté par: ${exportedBy}`, 110, 32);
        doc.text(`Page ${pageCount}`, 180, 32);
        y = 45;
        // En-têtes de colonnes avec fond bleu clair
        doc.setFillColor(224, 231, 255);
        doc.rect(14, y - 5, 180, 8, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Date', 14, y);
        doc.text('Catégorie', 40, y);
        doc.text('Description', 80, y);
        doc.text('Montant', 130, y);
        doc.text('Justif.', 160, y);
        y += 10;
        doc.setFont('helvetica', 'normal');
      }

      // Ligne alternée (zebra)
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(14, y - 4, 180, 7, 'F');
      }

      const category = (expense.category || '').substring(0, 20);
      const description = (expense.description || '').substring(0, 35);
      const hasJustification = expense.receipt_url ? 'Oui' : 'Non';
      const recordedBy = expense.users ? `${expense.users.last_name} ${expense.users.first_name}` : (expense.created_by || 'N/A');

      doc.setFontSize(9);
      doc.text(formatDate(expense.expense_date), 14, y);
      doc.text(category, 40, y);
      doc.text(description, 80, y);
      doc.setFontSize(10);
      doc.text(formatAmount(parseFloat(expense.amount)), 130, y);
      doc.setFontSize(9);
      doc.text(hasJustification, 160, y);
      y += 10;

      if (y > 280) {
        doc.addPage();
        pageCount++;
        y = 20;
        // Bannière bleue
        doc.setFillColor(30, 64, 175);
        doc.rect(0, 0, 210, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(schoolName, 14, 15);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('Liste des Dépenses', 14, 24);
        doc.setFontSize(9);
        doc.text(`Date de génération: ${generationDate}`, 14, 32);
        doc.text(`Exporté par: ${exportedBy}`, 110, 32);
        doc.text(`Page ${pageCount}`, 180, 32);
        y = 45;
      }
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`Enregistré par: ${recordedBy}`, 40, y);
      doc.setFont('helvetica', 'normal');
      y += 10;
    });

    doc.save('liste_depenses.pdf');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-blue-600 text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-xl flex-shrink-0 relative z-20">

        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 relative z-30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-white rounded-full backdrop-blur-sm border-2 border-white/50 shadow-lg flex-shrink-0" style={{ padding: 0, pointerEvents: 'none' }}>
                <SchoolLogo size={56} inCircle={true} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">Gestion des Dépenses</h1>
                <p className="text-xs sm:text-sm text-blue-100 drop-shadow">Suivi des dépenses et justificatifs</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto relative z-40">
              <button
                onClick={exportToPDF}
                className="w-full sm:w-auto px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 transition-all font-medium shadow-lg backdrop-blur-sm flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Exporter PDF
              </button>
              <button
                onClick={() => {
                  if (user?.role === 'founder') navigate('/dashboard/founder');
                  else if (user?.role === 'director') navigate('/dashboard/director');
                  else if (user?.role === 'secretary') navigate('/dashboard/secretary');
                  else navigate('/dashboard/teacher');
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 transition-all font-medium shadow-lg backdrop-blur-sm flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
          {statistics && (
            <div className="bg-white rounded-xl shadow-card p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Statistiques</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
                <div className="bg-white rounded-xl shadow-card p-3 sm:p-4 border-l-4 sm:border-l-6 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">Total des dépenses</h3>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-600">{formatAmount(statistics.totalAmount)}</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-card p-3 sm:p-4 border-l-4 sm:border-l-6 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">Nombre de dépenses</h3>
                      <p className="text-2xl sm:text-3xl font-bold text-green-600">{statistics.count}</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-card p-3 sm:p-4 border-l-4 sm:border-l-6 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">Période</h3>
                      <p className="text-base sm:text-lg font-bold text-purple-600">
                        {filters.startDate && filters.endDate
                          ? `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`
                          : 'Tout'}
                      </p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 sm:mt-4">
                <h3 className="font-semibold mb-2 text-gray-900 text-sm sm:text-base">Par catégorie</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(statistics.totalsByCategory).map(([category, amount]) => (
                    <div key={category} className="bg-gray-50 p-2 rounded-xl border border-gray-200 text-xs sm:text-sm">
                      <span className="font-medium text-gray-800">{EXPENSE_CATEGORIES.find(c => c.value === category)?.label || category}:</span>{' '}
                      <span className="font-bold text-gray-900">{formatAmount(Number(amount))}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-card p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Filtres</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Catégorie</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm"
                >
                  <option value="">Toutes</option>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Date début</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Date fin</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleResetFilters}
                  className="w-full bg-gray-500 text-white px-4 py-2 sm:py-2.5 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow text-sm"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingExpense(null);
              setForm({
                category: 'fournitures',
                amount: '',
                expenseDate: new Date().toISOString().split('T')[0],
                description: '',
                receiptUrl: '',
              });
              setShowForm(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium shadow-lg text-sm"
          >
            <Plus className="w-4 h-4" />
            Ajouter une dépense
          </button>

          {showForm && (
            <div className="modal-overlay">
              <div className="modal-content p-4 sm:p-6 max-w-2xl w-full mx-2 sm:mx-4 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-3 sm:mb-4 border-b border-gray-200 pb-2 sm:pb-3">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    {editingExpense ? 'Modifier la dépense' : 'Ajouter une dépense'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingExpense(null);
                    }}
                    className="text-gray-400 hover:text-blue-600 transition-colors bg-gray-100 hover:bg-blue-100 rounded-full p-2"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Catégorie *</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-input focus:shadow-input-focus transition-shadow text-sm"
                      required
                    >
                      {EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Montant (FCFA) *</label>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-input focus:shadow-input-focus transition-shadow text-sm"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Date *</label>
                    <input
                      type="date"
                      value={form.expenseDate}
                      onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-input focus:shadow-input-focus transition-shadow text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Justificatif (URL)</label>
                    <input
                      type="text"
                      value={form.receiptUrl}
                      onChange={(e) => setForm({ ...form, receiptUrl: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-input focus:shadow-input-focus transition-shadow text-sm"
                      placeholder="URL du justificatif"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1 text-gray-700">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-input focus:shadow-input-focus transition-shadow text-sm"
                      rows={3}
                    />
                  </div>
                  <div className="sm:col-span-2 flex flex-col-reverse sm:flex-row gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {editingExpense ? 'Modifier' : 'Ajouter'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingExpense(null);
                      }}
                      className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 text-sm"
                    >
                      <X className="w-4 h-4" />
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-card border border-gray-200">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Historique des dépenses</h2>
              {expenses.length === 0 ? (
                <p className="text-gray-800 text-sm sm:text-base">Aucune dépense trouvée</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Catégorie</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Justificatif</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {expenses.map((expense) => {
                        const categoryColor: Record<string, string> = {
                          fournitures: 'bg-blue-100 text-blue-800',
                          entretien: 'bg-orange-100 text-orange-800',
                          electricite_eau: 'bg-yellow-100 text-yellow-800',
                          transport: 'bg-purple-100 text-purple-800',
                          cantine: 'bg-green-100 text-green-800',
                          autres: 'bg-gray-100 text-gray-800',
                        };

                        return (
                          <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 font-medium">{formatDate(expense.expense_date)}</td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                              <span className={`px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${categoryColor[expense.category] || 'bg-gray-100 text-gray-800'}`}>
                                {EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label || expense.category}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{expense.description || '-'}</td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right font-semibold text-gray-900">{formatAmount(parseFloat(expense.amount))}</td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-center">
                              {expense.receipt_url ? (
                                <a
                                  href={expense.receipt_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm"
                                >
                                  <Receipt className="w-3 h-3 sm:w-4 sm:h-4" />
                                  Voir
                                </a>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-center">
                              <button
                                onClick={() => handleEdit(expense)}
                                className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium flex items-center gap-1 transition-colors mr-1 sm:mr-2 text-xs sm:text-sm"
                              >
                                <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                                Modifier
                              </button>
                              <button
                                onClick={() => handleDelete(expense.id)}
                                className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium flex items-center gap-1 transition-colors text-xs sm:text-sm"
                              >
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                Supprimer
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
