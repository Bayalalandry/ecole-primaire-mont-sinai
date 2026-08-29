import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenStorage } from '../services/authService';
import { statisticsService } from '../services/statisticsService';
import { schoolYearService } from '../services/schoolYearService';
import { Users, DollarSign, Calendar, RefreshCw, ArrowUpRight, ArrowDownRight, Minus, ArrowLeft } from 'lucide-react';
import SchoolLogo from '../components/SchoolLogo';

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    schoolYear: '',
    period: 'all',
    startDate: '',
    endDate: '',
  });

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const loadStatistics = async (token: string) => {
    try {
      const data = await statisticsService.getGlobalStatistics(filters, token);
      setStatistics(data);
    } catch (error: any) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
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

    schoolYearService.getCurrentSchoolYear(token)
      .then(currentYear => {
        setFilters(prev => ({ ...prev, schoolYear: currentYear }));
        loadStatistics(token);
      })
      .catch(error => {
        console.error('Error loading school year:', error);
        const fallbackYear = new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString();
        setFilters(prev => ({ ...prev, schoolYear: fallbackYear }));
        loadStatistics(token);
      });
  }, [navigate]);

  useEffect(() => {
    const token = tokenStorage.getToken();
    if (token && filters.schoolYear) {
      loadStatistics(token);
    }
  }, [filters]);

  const handleResetFilters = () => {
    const token = tokenStorage.getToken();
    if (token) {
      schoolYearService.getCurrentSchoolYear(token)
        .then(currentYear => {
          setFilters({
            schoolYear: currentYear,
            period: 'all',
            startDate: '',
            endDate: '',
          });
        })
        .catch(error => {
          console.error('Error loading school year:', error);
          const fallbackYear = new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString();
          setFilters({
            schoolYear: fallbackYear,
            period: 'all',
            startDate: '',
            endDate: '',
          });
        });
    }
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
      {/* Forme géométrique décorative en arrière-plan */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl opacity-20"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl opacity-20"></div>
      
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-xl flex-shrink-0 relative overflow-visible">
        {/* Motif subtil en arrière-plan */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-white rounded-full backdrop-blur-sm border-2 border-white/50 shadow-lg flex-shrink-0" style={{ padding: 0 }}>
                <SchoolLogo size={56} inCircle={true} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">Statistiques Globales</h1>
                <p className="text-xs sm:text-sm text-blue-100 drop-shadow">Vue d'ensemble de l'école</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard/founder')}
              className="w-full sm:w-auto px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 transition-all font-medium shadow-lg backdrop-blur-sm flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
          {/* Filtres */}
          <div className="bg-white rounded-xl shadow-card p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Filtres</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Année scolaire</label>
                <select
                  value={filters.schoolYear}
                  onChange={(e) => setFilters({ ...filters, schoolYear: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                >
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                  <option value="2027-2028">2027-2028</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Période</label>
                <select
                  value={filters.period}
                  onChange={(e) => setFilters({ ...filters, period: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                >
                  <option value="all">Tout</option>
                  <option value="month">Ce mois</option>
                  <option value="trimester">Ce trimestre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                />
              </div>
              <div className="flex items-end sm:col-span-4">
                <button
                  onClick={handleResetFilters}
                  className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 shadow-sm transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          {statistics && (
            <div className="space-y-4 sm:space-y-6">
              {/* Bilan financier */}
              <div className="bg-white rounded-xl shadow-card p-4 sm:p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg">
                    <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Bilan Financier</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 rounded-xl border-l-4 border-green-500">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                      <p className="text-xs sm:text-sm text-gray-700">Recettes (Scolarités)</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">{formatAmount(statistics.financial.totalRevenue)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 sm:p-4 rounded-xl border-l-4 border-red-500">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                      <p className="text-xs sm:text-sm text-gray-700">Dépenses (Salaires + Autres)</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-red-600">{formatAmount(statistics.financial.totalExpenses)}</p>
                  </div>
                  <div className={`p-3 sm:p-4 rounded-xl border-l-4 ${statistics.financial.balance >= 0 ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-500' : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-500'}`}>
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      {statistics.financial.balance >= 0 ? (
                        <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                      )}
                      <p className="text-xs sm:text-sm text-gray-700">Bilan</p>
                    </div>
                    <p className={`text-xl sm:text-2xl font-bold ${statistics.financial.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {formatAmount(statistics.financial.balance)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Scolarités */}
              <div className="bg-white rounded-xl shadow-card p-4 sm:p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg">
                    <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Scolarités</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 rounded-xl border-l-4 border-blue-500">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                      <p className="text-xs sm:text-sm text-gray-700">Encaissé</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">{formatAmount(statistics.tuition.totalCollected)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 sm:p-4 rounded-xl border-l-4 border-amber-500">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600" />
                      <p className="text-xs sm:text-sm text-gray-700">Attendu</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-amber-600">{formatAmount(statistics.tuition.totalExpected)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 sm:p-4 rounded-xl border-l-4 border-red-500">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                      <p className="text-xs sm:text-sm text-gray-700">Impayés</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-red-600">{formatAmount(statistics.tuition.totalOutstanding)}</p>
                    <p className="text-xs sm:text-sm text-gray-600">{statistics.tuition.outstandingStudentsCount} élèves</p>
                  </div>
                </div>
              </div>

              {/* Salaires */}
              <div className="bg-white rounded-xl shadow-card p-4 sm:p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg">
                    <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Salaires</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 rounded-xl border-l-4 border-green-500">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                      <p className="text-xs sm:text-sm text-gray-700">Versés</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">{formatAmount(statistics.salaries.totalPaid)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 sm:p-4 rounded-xl border-l-4 border-amber-500">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600" />
                      <p className="text-xs sm:text-sm text-gray-700">Total attendu</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-amber-600">{formatAmount(statistics.salaries.totalExpected)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 sm:p-4 rounded-xl border-l-4 border-red-500">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                      <p className="text-xs sm:text-sm text-gray-700">Restant à payer</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-red-600">{formatAmount(statistics.salaries.totalOutstanding)}</p>
                  </div>
                </div>
              </div>

              {/* Dépenses */}
              <div className="bg-white rounded-xl shadow-card p-4 sm:p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg">
                    <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Dépenses</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-4 rounded-xl border-l-4 border-purple-500">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                      <p className="text-xs sm:text-sm text-gray-700">Total dépenses</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-purple-600">{formatAmount(statistics.expenses.total)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2">Par catégorie</p>
                    <div className="space-y-1">
                      {Object.entries(statistics.expenses.byCategory).map(([category, amount]) => (
                        <div key={category} className="flex justify-between text-xs sm:text-sm">
                          <span className="capitalize text-gray-800">{category}</span>
                          <span className="font-semibold text-gray-900">{formatAmount(Number(amount))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Élèves */}
              <div className="bg-white rounded-xl shadow-card p-4 sm:p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg">
                    <Users className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Élèves</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 rounded-xl border-l-4 border-blue-500">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                      <p className="text-xs sm:text-sm text-gray-700">Total</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">{statistics.students.total}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 rounded-xl border-l-4 border-green-500">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                      <p className="text-xs sm:text-sm text-gray-700">Actifs</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">{statistics.students.active}</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 sm:p-4 rounded-xl border-l-4 border-amber-500">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600" />
                      <p className="text-xs sm:text-sm text-gray-700">Redoublants</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-amber-600">{statistics.students.repeating}</p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 rounded-xl border-l-4 border-gray-500">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                      <p className="text-xs sm:text-sm text-gray-700">Partis</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-600">{statistics.students.departed}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Par classe</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left p-2 text-gray-700 font-medium text-xs sm:text-sm">Classe</th>
                          <th className="text-right p-2 text-gray-700 font-medium text-xs sm:text-sm">Actifs</th>
                          <th className="text-right p-2 text-gray-700 font-medium text-xs sm:text-sm">Redoublants</th>
                          <th className="text-right p-2 text-gray-700 font-medium text-xs sm:text-sm">Partis</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statistics.students.byClass.map((classStats: any) => (
                          <tr key={classStats.className} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-2 text-gray-900 text-xs sm:text-sm">{classStats.className}</td>
                            <td className="p-2 text-right font-semibold text-green-600 text-xs sm:text-sm">{classStats.active}</td>
                            <td className="p-2 text-right text-orange-600 text-xs sm:text-sm">{classStats.repeating}</td>
                            <td className="p-2 text-right text-gray-600 text-xs sm:text-sm">{classStats.departed}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Enseignants */}
              <div className="bg-white rounded-xl shadow-card p-4 sm:p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg">
                    <Users className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Enseignants</h2>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 rounded-xl border-l-4 border-blue-500">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                    <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                    <p className="text-xs sm:text-sm text-gray-700">Total enseignants actifs</p>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{statistics.teachers.total}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
