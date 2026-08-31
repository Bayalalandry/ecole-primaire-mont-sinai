import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenStorage } from '../services/authService';
import { directorDashboardService } from '../services/directorDashboardService';
import { passageService } from '../services/passageService';
import { schoolYearService } from '../services/schoolYearService';
import {
  LogOut,
  GraduationCap,
  Users,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import SchoolLogo from '../components/SchoolLogo';

export default function DirectorDashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ totalTeachers: 0, totalStudents: 0, currentTrimester: '' });
  const [loadingStats, setLoadingStats] = useState(true);
  const [hasAssignedClasses, setHasAssignedClasses] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = tokenStorage.getToken();
    const currentUser = tokenStorage.getUser();

    if (!token || !currentUser || currentUser.role !== 'director') {
      navigate('/login');
      return;
    }

    setUser(currentUser);
    loadDirectorStats(token);
    checkAssignedClasses(token);

    // Écouter l'événement de mise à jour des stats via localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'directorStatsUpdate') {
        loadDirectorStats(token);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Vérifier au montage si une mise à jour est nécessaire
    const lastUpdate = localStorage.getItem('directorStatsUpdate');
    if (lastUpdate) {
      loadDirectorStats(token);
      localStorage.removeItem('directorStatsUpdate');
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  const loadDirectorStats = async (token: string) => {
    try {
      const data = await directorDashboardService.getDirectorStats(token);
      setStats(data);
    } catch (error) {
      console.error('Error loading director stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const checkAssignedClasses = async (token: string) => {
    try {
      const currentYear = await schoolYearService.getCurrentSchoolYear(token);
      const classesData = await passageService.getMyClasses(currentYear, token);
      setHasAssignedClasses(classesData.classes && classesData.classes.length > 0);
    } catch (error) {
      console.error('Error checking assigned classes:', error);
      setHasAssignedClasses(false);
    } finally {
      setLoadingClasses(false);
    }
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
              <div className="bg-white rounded-full backdrop-blur-sm border-2 border-white/50 shadow-lg flex-shrink-0" style={{ padding: 0, pointerEvents: 'none' }}>
                <SchoolLogo size={56} inCircle={true} className="text-white" />
              </div>
              <div className="flex-1 sm:flex-none">
                <h1 className="text-lg sm:text-2xl font-bold text-white drop-shadow-lg leading-tight">Tableau de bord Directeur</h1>
                <p className="text-xs sm:text-sm text-blue-100 drop-shadow mt-0.5 sm:mt-1">Bienvenue, {user?.last_name} {user?.first_name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-white border-2 border-white/40 hover:bg-white/25 hover:border-white/60 rounded-lg transition-colors font-medium shadow-lg backdrop-blur-sm text-sm sm:text-base relative z-40"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-0">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border-l-6 border-purple-500">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Total enseignants</h3>
                <p className="text-3xl sm:text-4xl font-bold text-purple-600">{loadingStats ? '...' : stats.totalTeachers}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border-l-6 border-blue-500">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Total élèves</h3>
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
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Trimestre en cours</h3>
                <p className="text-3xl sm:text-4xl font-bold text-indigo-600">{loadingStats ? '...' : stats.currentTrimester}</p>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex-shrink-0">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Bouton d'accès rapide */}
        <div className={`mb-6 sm:mb-8 grid gap-3 sm:gap-4 ${hasAssignedClasses ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
          <button
            onClick={() => navigate('/students')}
            className="bg-white p-4 sm:p-6 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-6 sm:border-l-8 border-blue-500 text-left group"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full group-hover:scale-110 transition-transform flex-shrink-0">
                <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Gérer les élèves</h3>
                <p className="text-xs sm:text-sm text-gray-600">Inscriptions et fiches</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate('/teachers')}
            className="bg-white p-4 sm:p-6 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-6 sm:border-l-8 border-purple-500 text-left group"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full group-hover:scale-110 transition-transform flex-shrink-0">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Gérer les enseignants</h3>
                <p className="text-xs sm:text-sm text-gray-600">Personnel et absences</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate('/tuition')}
            className="bg-white p-4 sm:p-6 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-6 sm:border-l-8 border-green-500 text-left group"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full group-hover:scale-110 transition-transform flex-shrink-0">
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Gérer les scolarités</h3>
                <p className="text-xs sm:text-sm text-gray-600">Paiements et tarifs</p>
              </div>
            </div>
          </button>
          {!loadingClasses && hasAssignedClasses && (
            <button
              onClick={() => navigate('/passage')}
              className="bg-white p-4 sm:p-6 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-6 sm:border-l-8 border-indigo-500 text-left group"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full group-hover:scale-110 transition-transform flex-shrink-0">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Passage de classe</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Moyennes et promotions</p>
                </div>
              </div>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
