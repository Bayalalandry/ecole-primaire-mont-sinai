import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenStorage } from '../services/authService';
import { passageService } from '../services/passageService';
import { schoolYearService } from '../services/schoolYearService';
import { Save, FileText, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import SchoolLogo from '../components/SchoolLogo';
import { sortClasses } from '../utils/classUtils';

export default function PassagePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'grades' | 'thresholds' | 'validation'>('grades');

  // État pour la saisie des moyennes
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]); // Classes assignées à l'enseignant
  const [founderClasses, setFounderClasses] = useState<any[]>([]); // Toutes les classes pour le fondateur
  const [selectedClass, setSelectedClass] = useState('');
  const [schoolYear, setSchoolYear] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<Record<string, number>>({});

  // État pour les seuils de passage
  const [passingGrades, setPassingGrades] = useState<Record<string, number>>({});

  // État pour la validation
  const [proposals, setProposals] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<Record<string, 'passed' | 'repeating'>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const token = tokenStorage.getToken();
    const currentUser = tokenStorage.getUser();

    if (!token || !currentUser) {
      navigate('/login');
      return;
    }

    setUser(currentUser);

    // Définir l'onglet par défaut selon le rôle
    if (currentUser.role === 'teacher' || currentUser.role === 'director') {
      setActiveTab('grades');
    } else if (currentUser.role === 'founder') {
      setActiveTab('thresholds');
    }

    // Charger l'année scolaire actuelle depuis la base de données
    schoolYearService.getCurrentSchoolYear(token)
      .then(currentYear => {
        setSchoolYear(currentYear);
        
        // Charger les données selon le rôle
        if (currentUser.role === 'teacher' || currentUser.role === 'director') {
          loadTeacherClasses(token);
        } else if (currentUser.role === 'founder') {
          loadPassingGrades(token);
        }
      })
      .catch(error => {
        console.error('Error loading school year:', error);
        // Fallback to current year calculation if API fails
        const fallbackYear = new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString();
        setSchoolYear(fallbackYear);
        
        if (currentUser.role === 'teacher' || currentUser.role === 'director') {
          loadTeacherClasses(token);
        } else if (currentUser.role === 'founder') {
          loadPassingGrades(token);
        }
      });

    setLoading(false);
  }, [navigate]);

  const loadTeacherClasses = async (token: string) => {
    try {
      const classesData = await passageService.getMyClasses(schoolYear, token);
      setTeacherClasses(sortClasses(classesData.classes || []));
    } catch (error: any) {
      console.error('Error loading classes:', error);
    }
  };

  const loadPassingGrades = async (token: string) => {
    try {
      const data = await passageService.getPassingGrades(token);
      const gradesMap: Record<string, number> = {};
      data.classes.forEach((c: any) => {
        gradesMap[c.id] = c.passing_grade;
      });
      setPassingGrades(gradesMap);
      setFounderClasses(sortClasses(data.classes || []));
    } catch (error: any) {
      console.error('Error loading passing grades:', error);
    }
  };

  const loadStudentsForGrades = async () => {
    if (!selectedClass || !schoolYear) return;

    const token = tokenStorage.getToken();
    if (!token) return;

    try {
      const data = await passageService.getStudentsForGrades(selectedClass, schoolYear, token);
      setStudents(data.students || []);

      // Initialiser les grades
      const gradesMap: Record<string, number> = {};
      data.students.forEach((s: any) => {
        if (s.annualGrade !== null) {
          gradesMap[s.id] = s.annualGrade;
        }
      });
      setGrades(gradesMap);
    } catch (error: any) {
      console.error('Error loading students:', error);
      alert(error.message);
    }
  };

  const handleGradeChange = (studentId: string, value: string) => {
    const grade = parseFloat(value);
    if (grade >= 0 && grade <= 10) {
      setGrades({ ...grades, [studentId]: grade });
    }
  };

  const saveGrades = async () => {
    const token = tokenStorage.getToken();
    if (!token) return;

    try {
      for (const [studentId, grade] of Object.entries(grades)) {
        await passageService.saveGrade(studentId, schoolYear, grade, token);
      }
      alert('Moyennes enregistrées avec succès');
      
      // Marquer que les stats doivent être rafraîchies
      localStorage.setItem('teacherStatsUpdate', Date.now().toString());
    } catch (error: any) {
      console.error('Error saving grades:', error);
      alert(error.message);
    }
  };

  const handlePassingGradeChange = (classId: string, value: string) => {
    const grade = parseFloat(value);
    if (grade >= 0 && grade <= 10) {
      setPassingGrades({ ...passingGrades, [classId]: grade });
    }
  };

  const savePassingGrades = async () => {
    const token = tokenStorage.getToken();
    if (!token) return;

    try {
      console.log('Saving passing grades:', passingGrades);
      for (const [classId, grade] of Object.entries(passingGrades)) {
        console.log(`Updating class ${classId} to grade ${grade}`);
        await passageService.updatePassingGrade(classId, grade, token);
      }
      alert('Seuils mis à jour avec succès');
      // Recharger les seuils pour confirmer la mise à jour
      loadPassingGrades(token);
    } catch (error: any) {
      console.error('Error saving passing grades:', error);
      alert(error.message);
    }
  };

  const generateProposals = async () => {
    if (!selectedClass || !schoolYear) {
      alert('Veuillez sélectionner une classe');
      return;
    }

    const token = tokenStorage.getToken();
    if (!token) return;

    try {
      const data = await passageService.generateProposals(selectedClass, schoolYear, token);
      setProposals(data.proposals || []);

      // Initialiser les décisions avec les propositions
      const decisionsMap: Record<string, 'passed' | 'repeating'> = {};
      data.proposals.forEach((p: any) => {
        decisionsMap[p.studentId] = p.proposedStatus;
      });
      setDecisions(decisionsMap);
    } catch (error: any) {
      console.error('Error generating proposals:', error);
      alert(error.message);
    }
  };

  const handleDecisionChange = (studentId: string, status: 'passed' | 'repeating') => {
    setDecisions({ ...decisions, [studentId]: status });
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setNotes({ ...notes, [studentId]: note });
  };

  const validatePassage = async () => {
    if (!selectedClass || !schoolYear) {
      alert('Veuillez sélectionner une classe');
      return;
    }

    const token = tokenStorage.getToken();
    if (!token) return;

    // Vérifier si des élèves n'ont pas de moyenne
    const studentsWithoutGrades = proposals.filter((p: any) => p.finalGrade === null || p.finalGrade === undefined);
    if (studentsWithoutGrades.length > 0) {
      const studentNames = studentsWithoutGrades.map((p: any) => p.studentName).join(', ');
      if (!confirm(`ATTENTION : ${studentsWithoutGrades.length} élève(s) n'ont pas de moyenne (${studentNames}). Voulez-vous vraiment valider ?`)) {
        return;
      }
    }

    if (!confirm('Êtes-vous sûr de vouloir valider ces décisions de passage ? Cette action est irréversible.')) {
      return;
    }

    try {
      const decisionsArray = proposals.map((p: any) => ({
        studentId: p.studentId,
        proposedStatus: p.proposedStatus,
        finalStatus: decisions[p.studentId],
        finalGrade: p.finalGrade,
        notes: notes[p.studentId] || null,
      }));

      await passageService.validatePassage(selectedClass, schoolYear, decisionsArray, token);
      alert('Validation effectuée avec succès');
      setProposals([]);
      setDecisions({});
      setNotes({});
    } catch (error: any) {
      console.error('Error validating passage:', error);
      alert(error.message);
    }
  };

  const loadAllClasses = async () => {
    const token = tokenStorage.getToken();
    if (!token) return;

    try {
      const data = await passageService.getPassingGrades(token);
      setFounderClasses(sortClasses(data.classes || []));
    } catch (error: any) {
      console.error('Error loading classes:', error);
    }
  };

  useEffect(() => {
    if (user?.role === 'founder' && (activeTab === 'validation' || activeTab === 'thresholds')) {
      loadAllClasses();
    }
  }, [activeTab, user, schoolYear]);

  // Recharger les classes de l'enseignant quand schoolYear change
  useEffect(() => {
    if ((user?.role === 'teacher' || user?.role === 'director') && schoolYear) {
      const token = tokenStorage.getToken();
      if (token) {
        loadTeacherClasses(token);
      }
    }
  }, [schoolYear, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-blue-600 text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-xl flex-shrink-0 relative z-20">

        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 relative z-30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-white rounded-full backdrop-blur-sm border-2 border-white/50 shadow-lg flex-shrink-0" style={{ padding: 0, pointerEvents: 'none' }}>
                <SchoolLogo size={56} inCircle={true} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">Passage de Classe</h1>
                <p className="text-xs sm:text-sm text-blue-100 drop-shadow">Moyennes, seuils et validations</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (user?.role === 'founder') navigate('/dashboard/founder');
                else if (user?.role === 'director') navigate('/dashboard/director');
                else navigate('/dashboard/teacher');
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 transition-all font-medium shadow-lg backdrop-blur-sm flex items-center justify-center gap-2 relative z-40"
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

        {/* Onglets */}
        {(user?.role === 'founder' || user?.role === 'teacher' || user?.role === 'director') && (
          <div className="bg-white rounded-xl shadow-card border border-gray-200 mb-4 sm:mb-6">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {user?.role === 'founder' && (
                <>
                  <button
                    onClick={() => setActiveTab('thresholds')}
                    className={`px-4 sm:px-6 py-3 sm:py-4 font-medium transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-300 whitespace-nowrap ${
                      activeTab === 'thresholds'
                        ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Seuils de Passage
                  </button>
                  <button
                    onClick={() => setActiveTab('validation')}
                    className={`px-4 sm:px-6 py-3 sm:py-4 font-medium transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-300 whitespace-nowrap ${
                      activeTab === 'validation'
                        ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Validation de Passage
                  </button>
                </>
              )}
              {(user?.role === 'teacher' || user?.role === 'director') && (
                <button
                  onClick={() => setActiveTab('grades')}
                  className={`px-4 sm:px-6 py-3 sm:py-4 font-medium transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-300 whitespace-nowrap ${
                    activeTab === 'grades'
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Saisie des Moyennes
                </button>
              )}
            </div>
          </div>
        )}

        {/* Onglet Saisie des moyennes (enseignant ou directeur) */}
        {activeTab === 'grades' && (user?.role === 'teacher' || user?.role === 'director') && (
          <div className="bg-white rounded-xl shadow-card p-4 sm:p-6 border border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              Saisie des Moyennes Annuelles
            </h2>

            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Classe</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm"
              >
                <option value="">Sélectionner une classe</option>
                {teacherClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Année scolaire</label>
              <input
                type="text"
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm"
              />
            </div>

            <button
              onClick={loadStudentsForGrades}
              className="mb-4 sm:mb-6 w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Charger les élèves
            </button>

            {students.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Élève</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Moyenne</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 font-medium">
                          {student.last_name} {student.first_name}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.01"
                            value={grades[student.id] || ''}
                            onChange={(e) => handleGradeChange(student.id, e.target.value)}
                            className="w-20 sm:w-24 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm"
                            placeholder="0-10"
                          />
                          <span className="ml-1 sm:ml-2 text-gray-900 font-medium text-xs sm:text-sm">/10</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {students.length > 0 && (
              <button
                onClick={saveGrades}
                className="mt-4 sm:mt-6 w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm"
              >
                <Save className="w-4 h-4" />
                Enregistrer les moyennes
              </button>
            )}
          </div>
        )}

        {/* Onglet Seuils de passage (fondateur) */}
        {activeTab === 'thresholds' && user?.role === 'founder' && (
          <div className="bg-white rounded-xl shadow-card p-4 sm:p-6 border border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              Seuils de Passage par Classe
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Classe</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Seuil de passage</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {founderClasses.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 font-medium">
                        {c.name}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.01"
                          value={passingGrades[c.id] || 5}
                          onChange={(e) => handlePassingGradeChange(c.id, e.target.value)}
                          className="w-20 sm:w-24 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm"
                        />
                        <span className="ml-1 sm:ml-2 text-gray-900 font-medium text-xs sm:text-sm">/10</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={savePassingGrades}
              className="mt-4 sm:mt-6 w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm"
            >
              <Save className="w-4 h-4" />
              Enregistrer les seuils
            </button>
          </div>
        )}

        {/* Onglet Validation de passage (fondateur) */}
        {activeTab === 'validation' && user?.role === 'founder' && (
          <div className="bg-white rounded-xl shadow-card p-4 sm:p-6 border border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              Validation de Passage
            </h2>

            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Classe</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm"
              >
                <option value="">Sélectionner une classe</option>
                {founderClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Année scolaire</label>
              <input
                type="text"
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm"
              />
            </div>

            <button
              onClick={generateProposals}
              className="mb-4 sm:mb-6 w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Générer les propositions
            </button>

            {proposals.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Élève</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Moyenne</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Seuil</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Proposition</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Décision finale</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {proposals.map((p) => (
                      <tr key={p.studentId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 font-medium">
                          {p.studentName}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 font-semibold">
                          {p.finalGrade.toFixed(2)}/10
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {p.passingGrade.toFixed(2)}/10
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                          <span className={`px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            p.proposedStatus === 'passed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {p.proposedStatus === 'passed' ? 'Admis' : 'Redoublant'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                          <select
                            value={decisions[p.studentId]}
                            onChange={(e) => handleDecisionChange(p.studentId, e.target.value as 'passed' | 'repeating')}
                            className="px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-xs sm:text-sm"
                          >
                            <option value="passed">Admis</option>
                            <option value="repeating">Redoublant</option>
                          </select>
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                          <input
                            type="text"
                            value={notes[p.studentId] || ''}
                            onChange={(e) => handleNoteChange(p.studentId, e.target.value)}
                            className="w-24 sm:w-32 px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-xs sm:text-sm"
                            placeholder="Notes..."
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {proposals.length > 0 && (
              <button
                onClick={validatePassage}
                className="mt-4 sm:mt-6 w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Valider les décisions
              </button>
            )}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
