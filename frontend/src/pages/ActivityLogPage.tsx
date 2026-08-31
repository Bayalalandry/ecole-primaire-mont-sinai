import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, X, Clock, User, FileText, ArrowLeft, LogIn, Plus, Edit, Trash2, CheckCircle, Shield, DollarSign, LogOut } from 'lucide-react';
import { tokenStorage } from '../services/authService';
import { getActivityLog, type ActivityLog } from '../services/activityLogService';
import SchoolLogo from '../components/SchoolLogo';

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = tokenStorage.getToken();
    const currentUser = tokenStorage.getUser();

    if (!token || !currentUser || currentUser.role !== 'founder') {
      navigate('/login');
      return;
    }

    loadActivities();
  }, [navigate, entityTypeFilter]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await getActivityLog(entityTypeFilter || undefined, 50);
      setActivities(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du journal d\'activité');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionLabel = (action: string): string => {
    const labels: { [key: string]: string } = {
      'LOGIN': 'Connexion',
      'CREATE_FOUNDER': 'Création fondateur',
      'REGISTER': 'Inscription enseignant',
      'VALIDATE_TEACHER': 'Validation enseignant',
      'REJECT_TEACHER': 'Rejet enseignant',
      'TEACHER_LEAVE': 'Départ enseignant',
      'CREATE_TUITION_RATE': 'Création tarif scolarité',
      'UPDATE_TUITION_RATE': 'Modification tarif scolarité',
      'VALIDATE_PASSAGE': 'Validation passage',
      'CREATE_EXPENSE': 'Création dépense',
      'UPDATE_EXPENSE': 'Modification dépense',
      'DELETE_EXPENSE': 'Suppression dépense',
      'ASSIGN_TEACHER': 'Assignation enseignant',
      'CREATE_PAYMENT': 'Versement scolarité',
      'CREATE_SALARY_PAYMENT': 'Versement salaire',
    };
    return labels[action] || action;
  };

  const getEntityTypeLabel = (entityType: string): string => {
    const labels: { [key: string]: string } = {
      'student': 'Élève',
      'teacher': 'Enseignant',
      'class': 'Classe',
      'tuition_rate': 'Tarif scolarité',
      'tuition_payment': 'Versement scolarité',
      'salary': 'Salaire',
      'salary_payment': 'Versement salaire',
      'expense': 'Dépense',
      'passage': 'Passage',
      'school_year': 'Année scolaire',
      'user': 'Utilisateur',
    };
    return labels[entityType] || entityType;
  };

  const getActionIcon = (action: string) => {
    const iconMap: { [key: string]: any } = {
      'LOGIN': LogIn,
      'CREATE_FOUNDER': Shield,
      'REGISTER': User,
      'VALIDATE_TEACHER': CheckCircle,
      'REJECT_TEACHER': X,
      'TEACHER_LEAVE': ArrowLeft,
      'CREATE_TUITION_RATE': DollarSign,
      'UPDATE_TUITION_RATE': Edit,
      'VALIDATE_PASSAGE': CheckCircle,
      'CREATE_EXPENSE': Plus,
      'UPDATE_EXPENSE': Edit,
      'DELETE_EXPENSE': Trash2,
      'ASSIGN_TEACHER': ArrowLeft,
      'CREATE_PAYMENT': DollarSign,
      'CREATE_SALARY_PAYMENT': DollarSign,
    };
    return iconMap[action] || FileText;
  };

  const getActionColor = (action: string): string => {
    const colorMap: { [key: string]: string } = {
      'LOGIN': 'from-green-400 to-green-600',
      'CREATE_FOUNDER': 'from-purple-400 to-purple-600',
      'REGISTER': 'from-blue-400 to-blue-600',
      'VALIDATE_TEACHER': 'from-green-400 to-green-600',
      'REJECT_TEACHER': 'from-red-400 to-red-600',
      'TEACHER_LEAVE': 'from-orange-400 to-orange-600',
      'CREATE_TUITION_RATE': 'from-cyan-400 to-cyan-600',
      'UPDATE_TUITION_RATE': 'from-amber-400 to-amber-600',
      'VALIDATE_PASSAGE': 'from-green-400 to-green-600',
      'CREATE_EXPENSE': 'from-blue-400 to-blue-600',
      'UPDATE_EXPENSE': 'from-amber-400 to-amber-600',
      'DELETE_EXPENSE': 'from-red-400 to-red-600',
      'ASSIGN_TEACHER': 'from-indigo-400 to-indigo-600',
      'CREATE_PAYMENT': 'from-green-400 to-green-600',
      'CREATE_SALARY_PAYMENT': 'from-green-400 to-green-600',
    };
    return colorMap[action] || 'from-gray-400 to-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-xl flex-shrink-0 relative z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 relative z-30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-white rounded-full backdrop-blur-sm border-2 border-white/50 shadow-lg flex-shrink-0" style={{ padding: 0, pointerEvents: 'none' }}>
                <SchoolLogo size={56} inCircle={true} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">Journal d'activité</h1>
                <p className="text-xs sm:text-sm text-blue-100 drop-shadow">Historique des actions importantes</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard/founder')}
              className="w-full sm:w-auto px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 transition-all font-medium shadow-lg backdrop-blur-sm flex items-center justify-center gap-2 relative z-40"
            >
              <LogOut className="w-4 h-4" />
              Retour
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
          {/* Filtres */}
          <div className="mb-4 sm:mb-6 bg-white rounded-xl shadow-card p-3 sm:p-4 border border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <label className="text-sm font-medium text-gray-700">Filtrer par type d'entité:</label>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={entityTypeFilter}
                  onChange={(e) => setEntityTypeFilter(e.target.value)}
                  className="flex-1 sm:flex-none border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-input transition-shadow text-sm"
                >
                  <option value="">Tous</option>
                  <option value="student">Élève</option>
                  <option value="teacher">Enseignant</option>
                  <option value="class">Classe</option>
                  <option value="tuition_rate">Tarif scolarité</option>
                  <option value="expense">Dépense</option>
                  <option value="passage">Passage</option>
                  <option value="user">Utilisateur</option>
                </select>
                {entityTypeFilter && (
                  <button
                    onClick={() => setEntityTypeFilter('')}
                    className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                    title="Effacer le filtre"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Liste des activités */}
          {loading ? (
            <div className="text-center py-8 sm:py-12">
              <div className="text-blue-600 text-sm sm:text-base">Chargement...</div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 text-red-700 flex items-center gap-3 text-sm sm:text-base">
              <X className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : activities.length === 0 ? (
            <div className="bg-white rounded-xl shadow-card p-6 sm:p-8 text-center text-gray-800 border border-gray-200">
              <FileText className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 text-sm sm:text-base">Aucune activité enregistrée</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-card overflow-hidden border border-gray-200">
              <div className="overflow-x-auto overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          Date/Heure
                        </div>
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <User className="w-3 h-3 sm:w-4 sm:h-4" />
                          Auteur
                        </div>
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entité
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Détails
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activities.map((activity, index) => {
                      const ActionIcon = getActionIcon(activity.action);
                      const actionColor = getActionColor(activity.action);
                      return (
                        <tr
                          key={activity.id}
                          className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                        >
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                            {formatDate(activity.created_at)}
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                            <span className="font-semibold text-gray-900">
                              {activity.users ? `${activity.users.first_name} ${activity.users.last_name}` : activity.user_id || 'N/A'}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <div className={`p-1 sm:p-1.5 rounded-lg bg-gradient-to-br ${actionColor}`}>
                                <ActionIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                              </div>
                              <span className="text-gray-900 text-xs sm:text-sm">{getActionLabel(activity.action)}</span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                            {getEntityTypeLabel(activity.entity_type)}
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-900 max-w-xs sm:max-w-md truncate">
                            {activity.details ? JSON.stringify(activity.details) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
