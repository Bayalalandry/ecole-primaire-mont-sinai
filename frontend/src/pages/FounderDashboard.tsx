import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenStorage } from '../services/authService';
import { statisticsService } from '../services/statisticsService';
import { searchService } from '../services/searchService';
import { notificationService } from '../services/notificationService';
import { backupService } from '../services/backupService';
import {
  Search,
  Bell,
  LogOut,
  Users,
  GraduationCap,
  DollarSign,
  TrendingUp,
  Wallet,
  FileText,
  BarChart3,
  Activity,
  Save,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import SchoolLogo from '../components/SchoolLogo';

export default function FounderDashboard() {
  const [user, setUser] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const navigate = useNavigate();

  const formatAmount = (amount: number): string => {
    const rounded = Math.round(amount);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
  };

  useEffect(() => {
    const token = tokenStorage.getToken();
    const currentUser = tokenStorage.getUser();

    if (!token || !currentUser || currentUser.role !== 'founder') {
      navigate('/login');
      return;
    }

    setUser(currentUser);
    loadStatistics(token);
    loadUnreadCount(token);

    // Poll pour les notifications toutes les 30 secondes
    const interval = setInterval(() => {
      loadUnreadCount(token);
    }, 30000);

    // Écouter l'événement de mise à jour des stats via localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'globalStatsUpdate' || e.key === 'directorStatsUpdate') {
        loadStatistics(token);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Vérifier au montage si une mise à jour est nécessaire
    const lastUpdate = localStorage.getItem('globalStatsUpdate') || localStorage.getItem('directorStatsUpdate');
    if (lastUpdate) {
      loadStatistics(token);
      localStorage.removeItem('globalStatsUpdate');
      localStorage.removeItem('directorStatsUpdate');
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  const loadUnreadCount = async (token: string) => {
    try {
      const count = await notificationService.getUnreadCount(token);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const loadNotifications = async () => {
    const token = tokenStorage.getToken();
    if (token) {
      try {
        const data = await notificationService.getNotifications(token);
        setNotifications(data);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    const token = tokenStorage.getToken();
    if (token) {
      try {
        await notificationService.markAsRead(notificationId, token);
        loadNotifications();
        loadUnreadCount(token);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    const token = tokenStorage.getToken();
    if (token) {
      try {
        await notificationService.markAllAsRead(token);
        loadNotifications();
        loadUnreadCount(token);
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
      }
    }
  };

  const loadStatistics = async (token: string) => {
    try {
      const data = await statisticsService.getGlobalStatistics({}, token);
      setStatistics(data);
    } catch (error: any) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    tokenStorage.removeToken();
    tokenStorage.removeUser();
    navigate('/login');
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const token = tokenStorage.getToken();
      if (token) {
        try {
          const data = await searchService.globalSearch(query, token);
          setSearchResults(data.results || []);
          setShowSearchResults(true);
        } catch (error) {
          console.error('Search error:', error);
        }
      }
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleResultClick = (result: any) => {
    setShowSearchResults(false);
    setSearchQuery('');
    if (result.type === 'student') {
      navigate(`/students?studentId=${result.id}`);
    } else if (result.type === 'teacher') {
      navigate(`/teachers?teacherId=${result.id}`);
    }
  };

  const toggleNotifications = () => {
    if (!showNotifications) {
      loadNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  const handleBackup = async () => {
    const token = tokenStorage.getToken();
    if (token) {
      try {
        const blob = await backupService.exportBackup(token);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_ecole_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Backup error:', error);
        alert('Erreur lors de la sauvegarde');
      }
    }
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 shadow-xl relative overflow-visible">
        {/* Motif subtil en arrière-plan */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-full backdrop-blur-sm border-2 border-white/50 shadow-lg" style={{ padding: 0 }}>
                <SchoolLogo size={56} inCircle={true} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">Tableau de bord Fondateur</h1>
                <p className="text-sm text-blue-100 drop-shadow">Bienvenue, {user?.last_name} {user?.first_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Barre de recherche */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600" />
                  <input
                    type="text"
                    placeholder="Rechercher (élève, enseignant...)"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-64 pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 bg-white text-gray-800 placeholder:text-gray-500 shadow-lg"
                  />
                </div>
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-[9999]">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        onClick={() => handleResultClick(result)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center gap-2 font-semibold text-gray-900">
                          {result.type === 'student' ? <GraduationCap className="w-4 h-4 text-blue-600" /> : <Users className="w-4 h-4 text-blue-600" />}
                          {result.name}
                        </div>
                        <div className="text-sm text-gray-600 ml-6">
                          {result.type === 'student' ? `Matricule: ${result.matricule || 'N/A'}` : `@${result.username}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Notification bell */}
              <div className="relative">
                <button
                  onClick={toggleNotifications}
                  className="relative p-2 rounded-lg bg-white/20 hover:bg-white/30 focus:outline-none transition-colors border border-white/30"
                >
                  <Bell className="w-6 h-6 text-white" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-96 overflow-y-auto z-[9999]">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-blue-100">
                      <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{unreadCount}</span>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-xs bg-white hover:bg-gray-100 text-blue-600 px-3 py-1.5 rounded-lg font-medium transition-colors border border-blue-200"
                        >
                          Tout marquer comme lu
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <Bell className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-gray-500 text-sm">Aucune notification</p>
                        </div>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleMarkAsRead(notification.id)}
                          className={`px-4 py-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                            !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              notification.type === 'success' ? 'bg-green-100 text-green-600' :
                              notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                              notification.type === 'error' ? 'bg-red-100 text-red-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
                               notification.type === 'warning' ? <AlertCircle className="w-4 h-4" /> :
                               notification.type === 'error' ? <AlertCircle className="w-4 h-4" /> :
                               <Bell className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-sm text-gray-900">{notification.title}</div>
                              <div className="text-sm text-gray-600 mt-1">{notification.message}</div>
                              <div className="flex items-center gap-2 mt-2">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <div className="text-xs text-gray-400">
                                  {new Date(notification.created_at).toLocaleString('fr-FR', { 
                                    day: '2-digit', 
                                    month: '2-digit', 
                                    year: 'numeric', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-white border-2 border-white/40 hover:bg-white/25 hover:border-white/60 rounded-lg transition-colors font-medium shadow-lg backdrop-blur-sm"
              >
                <LogOut className="w-5 h-5" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Statistiques globales */}
        {statistics && (
          <div className="space-y-6 mb-8">
            {/* Bilan financier */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Bilan Financier</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Recettes (Scolarités)</p>
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-700">{formatAmount(statistics.financial.totalRevenue)}</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Dépenses (Salaires + Autres)</p>
                    <TrendingUp className="w-5 h-5 text-red-600 rotate-180" />
                  </div>
                  <p className="text-2xl font-bold text-red-700">{formatAmount(statistics.financial.totalExpenses)}</p>
                </div>
                <div className={`bg-gradient-to-br ${statistics.financial.balance >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-orange-50 to-orange-100 border-orange-200'} p-4 rounded-xl border`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Bilan</p>
                    {statistics.financial.balance >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-orange-600 rotate-180" />
                    )}
                  </div>
                  <p className={`text-2xl font-bold ${statistics.financial.balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                    {formatAmount(statistics.financial.balance)}
                  </p>
                </div>
              </div>
            </div>

            {/* Statistiques par module */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Scolarités */}
              <div className="bg-white rounded-xl shadow-md p-6 border-l-6 border-emerald-400">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-300 to-emerald-500 rounded-full">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Scolarités</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Encaissé</span>
                    <span className="font-semibold text-emerald-600">{formatAmount(statistics.tuition.totalCollected)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Impayés</span>
                    <span className="font-semibold text-red-600">{formatAmount(statistics.tuition.totalOutstanding)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Élèves impayés</span>
                    <span className="font-semibold text-orange-600">{statistics.tuition.outstandingStudentsCount}</span>
                  </div>
                </div>
              </div>

              {/* Salaires */}
              <div className="bg-white rounded-xl shadow-md p-6 border-l-6 border-amber-400">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Salaires</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Versés</span>
                    <span className="font-semibold text-green-600">{formatAmount(statistics.salaries.totalPaid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Restant à payer</span>
                    <span className="font-semibold text-orange-600">{formatAmount(statistics.salaries.totalOutstanding)}</span>
                  </div>
                </div>
              </div>

              {/* Dépenses */}
              <div className="bg-white rounded-xl shadow-md p-6 border-l-6 border-rose-400">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-rose-300 to-rose-500 rounded-full">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Dépenses</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="font-semibold text-rose-600">{formatAmount(statistics.expenses.total)}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Par catégorie:
                    {Object.entries(statistics.expenses.byCategory).slice(0, 2).map(([cat, amount]) => (
                      <div key={cat} className="flex justify-between">
                        <span className="capitalize">{cat}</span>
                        <span>{formatAmount(Number(amount))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Effectifs */}
              <div className="bg-white rounded-xl shadow-md p-6 border-l-6 border-sky-400">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gradient-to-br from-sky-300 to-sky-500 rounded-full">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Effectifs</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Élèves actifs</span>
                    <span className="font-semibold text-sky-600">{statistics.students.active}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Redoublants</span>
                    <span className="font-semibold text-orange-600">{statistics.students.repeating}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Enseignants</span>
                    <span className="font-semibold text-sky-600">{statistics.teachers.total}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bouton d'accès rapide */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/students')}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-8 border-blue-500 text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full group-hover:scale-110 transition-transform">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Gérer les élèves</h3>
                <p className="text-sm text-gray-600">Inscriptions et fiches</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate('/teachers')}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-8 border-purple-500 text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Gérer les enseignants</h3>
                <p className="text-sm text-gray-600">Personnel et absences</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate('/tuition')}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-8 border-green-500 text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full group-hover:scale-110 transition-transform">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Gérer les scolarités</h3>
                <p className="text-sm text-gray-600">Paiements et tarifs</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate('/salaries')}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-8 border-orange-500 text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full group-hover:scale-110 transition-transform">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Gérer les salaires</h3>
                <p className="text-sm text-gray-600">Versements enseignants</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate('/passage')}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-8 border-indigo-500 text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Passage de classe</h3>
                <p className="text-sm text-gray-600">Moyennes et promotions</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate('/expenses')}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-8 border-red-500 text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-red-400 to-red-600 rounded-full group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Gérer les dépenses</h3>
                <p className="text-sm text-gray-600">Budget et justificatifs</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate('/statistics')}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-8 border-teal-500 text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full group-hover:scale-110 transition-transform">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Statistiques détaillées</h3>
                <p className="text-sm text-gray-600">Rapports et analyses</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate('/activity-log')}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-8 border-pink-500 text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full group-hover:scale-110 transition-transform">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Journal d'activité</h3>
                <p className="text-sm text-gray-600">Historique des actions</p>
              </div>
            </div>
          </button>
          <button
            onClick={handleBackup}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-8 border-cyan-500 text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full group-hover:scale-110 transition-transform">
                <Save className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Sauvegarde globale</h3>
                <p className="text-sm text-gray-600">Export et restauration</p>
              </div>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
