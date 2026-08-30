import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenStorage } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { teacherDashboardService } from '../services/teacherDashboardService';
import {
  LogOut,
  Bell,
  GraduationCap,
  TrendingUp,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import SchoolLogo from '../components/SchoolLogo';

export default function TeacherDashboard() {
  const [user, setUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalStudents: 0, pendingGrades: 0, overdueTuition: 0, currentTrimester: '...' });
  const [loadingStats, setLoadingStats] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = tokenStorage.getToken();
    const currentUser = tokenStorage.getUser();

    if (!token || !currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'director')) {
      navigate('/login');
      return;
    }

    setUser(currentUser);
    loadUnreadCount(token);
    loadTeacherStats(token);

    // Poll pour les notifications toutes les 30 secondes
    const interval = setInterval(() => {
      loadUnreadCount(token);
    }, 30000);

    // Écouter l'événement de mise à jour des stats via localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'teacherStatsUpdate') {
        loadTeacherStats(token);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Vérifier au montage si une mise à jour est nécessaire
    const lastUpdate = localStorage.getItem('teacherStatsUpdate');
    if (lastUpdate) {
      loadTeacherStats(token);
      localStorage.removeItem('teacherStatsUpdate');
    }

    // Recharger les stats quand la fenêtre reprend le focus
    const handleFocus = () => {
      loadTeacherStats(token);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [navigate]);

  const loadTeacherStats = async (token: string) => {
    try {
      const data = await teacherDashboardService.getTeacherStats(token);
      setStats(data);
    } catch (error) {
      console.error('Error loading teacher stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

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

  const toggleNotifications = () => {
    if (!showNotifications) {
      loadNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  const handleLogout = () => {
    tokenStorage.removeToken();
    tokenStorage.removeUser();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 shadow-xl relative z-20">
        {/* Motif subtil en arrière-plan */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-48 h-48 sm:w-64 sm:h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="bg-white rounded-full backdrop-blur-sm border-2 border-white/50 shadow-lg flex-shrink-0" style={{ padding: 0 }}>
                <SchoolLogo size={56} inCircle={true} className="text-white" />
              </div>
              <div className="flex-1 sm:flex-none">
                <h1 className="text-lg sm:text-2xl font-bold text-white drop-shadow-lg leading-tight">Tableau de bord Enseignant</h1>
                <p className="text-xs sm:text-sm text-blue-100 drop-shadow mt-0.5 sm:mt-1">Bienvenue, {user?.last_name} {user?.first_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              {/* Notification bell */}
              <div className="relative">
                <button
                  onClick={toggleNotifications}
                  className="relative p-2 rounded-lg bg-white/20 hover:bg-white/30 focus:outline-none transition-colors border border-white/30"
                >
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center shadow-lg">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-80 sm:max-h-96 overflow-y-auto z-[99999]">
                    <div className="p-3 sm:p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-blue-100">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base">Notifications</h3>
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
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-white border-2 border-white/40 hover:bg-white/25 hover:border-white/60 rounded-lg transition-colors font-medium shadow-lg backdrop-blur-sm text-sm sm:text-base"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-0">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border-l-6 border-blue-500">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Mes élèves</h3>
                <p className="text-3xl sm:text-4xl font-bold text-blue-600">{loadingStats ? '...' : stats.totalStudents}</p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex-shrink-0">
                <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border-l-6 border-indigo-500">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Moyennes à saisir</h3>
                <p className="text-3xl sm:text-4xl font-bold text-indigo-600">{loadingStats ? '...' : stats.pendingGrades}</p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex-shrink-0">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border-l-6 border-orange-500">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Scolarités en retard</h3>
                <p className="text-3xl sm:text-4xl font-bold text-orange-600">{loadingStats ? '...' : stats.overdueTuition}</p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex-shrink-0">
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border-l-6 border-teal-500">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Trimestre en cours</h3>
                <p className="text-3xl sm:text-4xl font-bold text-teal-600">{loadingStats ? '...' : stats.currentTrimester}</p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex-shrink-0">
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Bouton d'accès rapide */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/students')}
            className="bg-white p-4 sm:p-6 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-6 sm:border-l-8 border-blue-500 text-left group"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full group-hover:scale-110 transition-transform flex-shrink-0">
                <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Voir mes élèves</h3>
                <p className="text-xs sm:text-sm text-gray-600">Liste et détails</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate('/passage')}
            className="bg-white p-4 sm:p-6 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-6 sm:border-l-8 border-green-500 text-left group"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full group-hover:scale-110 transition-transform flex-shrink-0">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Passage de classe</h3>
                <p className="text-xs sm:text-sm text-gray-600">Moyennes et décisions</p>
              </div>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
