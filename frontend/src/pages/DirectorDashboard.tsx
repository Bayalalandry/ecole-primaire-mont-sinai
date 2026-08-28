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
      <header className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 shadow-xl relative overflow-hidden">
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
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">Tableau de bord Directeur</h1>
                <p className="text-sm text-blue-100 drop-shadow">Bienvenue, {user?.last_name} {user?.first_name}</p>
              </div>
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
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-6 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Total enseignants</h3>
                <p className="text-4xl font-bold text-purple-600">{loadingStats ? '...' : stats.totalTeachers}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-6 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Total élèves</h3>
                <p className="text-4xl font-bold text-blue-600">{loadingStats ? '...' : stats.totalStudents}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-6 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Trimestre en cours</h3>
                <p className="text-4xl font-bold text-indigo-600">{loadingStats ? '...' : stats.currentTrimester}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Bouton d'accès rapide */}
        <div className={`mb-8 grid gap-4 ${hasAssignedClasses ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
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
          {!loadingClasses && hasAssignedClasses && (
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
          )}
        </div>
      </main>
    </div>
  );
}
