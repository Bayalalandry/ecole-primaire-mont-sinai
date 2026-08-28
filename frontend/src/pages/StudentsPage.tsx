import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenStorage } from '../services/authService';
import { studentService } from '../services/studentService';
import { classService } from '../services/classService';
import jsPDF from 'jspdf';
import { Plus, FileText, ArrowLeft, Edit, X, Info, Users, CheckCircle, Archive, Clock, UserPlus } from 'lucide-react';
import SchoolLogo from '../components/SchoolLogo';
import { SCHOOL_CONFIG } from '../config/schoolConfig';
import { sortClasses, getOrderedClassNames } from '../utils/classUtils';

export default function StudentsPage() {
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedClassesForExport, setSelectedClassesForExport] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'M',
    parentName: '',
    parentPhone: '',
    parentAddress: '',
    classId: '',
    schoolYear: '2024-2025',
    photoUrl: '',
    matricule: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = tokenStorage.getToken();
    const currentUser = tokenStorage.getUser();

    if (!token || !currentUser) {
      navigate('/login');
      return;
    }

    setUser(currentUser);
    loadStudents(token);
    loadClasses(token);
    loadTeachers(token);
    if (currentUser.role === 'teacher') {
      loadAssignedClasses(token);
    }
  }, [navigate]);

  const loadStudents = async (token: string) => {
    try {
      const data = await studentService.getStudents(token);
      setFilteredStudents(data.students || []);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async (token: string) => {
    try {
      const data = await classService.getClasses(token);
      setClasses(sortClasses(data.classes || []));
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadTeachers = async (token: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/teachers', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.teachers || []);
      } else {
        console.error('Failed to load teachers:', response.status);
      }
    } catch (error: any) {
      console.error('Error loading teachers:', error);
    }
  };

  const loadAssignedClasses = async (token: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/teacher/assigned-classes', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAssignedClasses(data.classes || []);
      } else {
        console.error('Failed to load assigned classes:', response.status);
      }
    } catch (error: any) {
      console.error('Error loading assigned classes:', error);
    }
  };

  // Traduire le statut en français
  const translateStatus = (status: string): string => {
    switch (status) {
      case 'active': return 'Actif';
      case 'repeating': return 'Redoublant';
      case 'archived': return 'Archivé';
      case 'departed': return 'Parti';
      default: return status;
    }
  };

  // Obtenir les enseignants d'une classe
  const getClassTeachers = (className: string): string[] => {
    const classData = classes.find(c => c.name === className);
    if (!classData) return [];
    
    const classTeachers = teachers.filter((t: any) => {
      const assignment = t.teacher_class_assignments?.find((a: any) => a.class_id === classData.id);
      return assignment;
    });
    
    return classTeachers.map((t: any) => `${t.last_name} ${t.first_name}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenStorage.getToken();
    if (!token) return;

    try {
      if (editingStudent) {
        await studentService.updateStudent(editingStudent.id, { ...formData, gender: formData.gender as 'M' | 'F' }, token);
        setSuccessMessage('Élève modifié avec succès !');
      } else {
        await studentService.createStudent({ ...formData, gender: formData.gender as 'M' | 'F' }, token);
        setSuccessMessage('Élève inscrit avec succès !');
      }
      setShowModal(false);
      setEditingStudent(null);
      resetForm();
      loadStudents(token);
      
      // Rafraîchir les stats du dashboard directeur
      localStorage.setItem('directorStatsUpdate', Date.now().toString());
      
      // Faire disparaître le message après 3 secondes
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'M',
      parentName: '',
      parentPhone: '',
      parentAddress: '',
      classId: '',
      schoolYear: '2024-2025',
      photoUrl: '',
      matricule: '',
    });
  };

  // Grouper les élèves par classe
  const studentsByClass = filteredStudents.reduce((acc: any, student: any) => {
    const className = student.classes?.name || 'Non assigné';
    if (!acc[className]) {
      acc[className] = [];
    }
    acc[className].push(student);
    return acc;
  }, {});

  const exportToPDF = () => {
    const classesToExport = selectedClassesForExport.length > 0
      ? getOrderedClassNames(selectedClassesForExport)
      : (user?.role === 'teacher' ? getOrderedClassNames(assignedClasses) : classes.map(c => c.name));

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
    doc.text('Liste des Élèves', 14, 24);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Date de génération: ${generationDate}`, 14, 32);
    doc.text(`Exporté par: ${exportedBy}`, 110, 32);
    doc.text(`Page ${pageCount}`, 180, 32);

    let y = 45;

    classesToExport.forEach((className) => {
      const classStudents = filteredStudents.filter(s => s.classes?.name === className);

      if (classStudents.length === 0) return;

      // Nouvelle page si nécessaire pour l'en-tête de classe
      if (y > 230) {
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
        doc.text('Liste des Élèves', 14, 24);
        doc.setFontSize(9);
        doc.text(`Date de génération: ${generationDate}`, 14, 32);
        doc.text(`Exporté par: ${exportedBy}`, 110, 32);
        doc.text(`Page ${pageCount}`, 180, 32);
        y = 45;
      }

      // En-tête de classe
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Classe ${className}`, 14, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(`${classStudents.length} élève${classStudents.length > 1 ? 's' : ''}`, 14, y);
      y += 6;

      const classTeachers = getClassTeachers(className);
      if (classTeachers.length > 0) {
        doc.setTextColor(0, 0, 0);
        doc.text(`Enseignant${classTeachers.length > 1 ? 's' : ''}: ${classTeachers.join(', ')}`, 14, y);
        y += 6;
      }
      y += 6; // Espace après l'en-tête de classe

      // En-têtes de colonnes avec fond bleu clair
      doc.setFillColor(224, 231, 255);
      doc.rect(14, y - 5, 180, 8, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Matricule', 14, y);
      doc.text('Nom', 50, y);
      doc.text('Prénom', 90, y);
      doc.text('Date Naiss.', 125, y);
      doc.text('Genre', 150, y);
      doc.text('Statut', 170, y);
      y += 8;

      // Liste des élèves avec lignes alternées
      doc.setFont('helvetica', 'normal');
      classStudents.forEach((student, index) => {
        // Nouvelle page si nécessaire pour les données
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
          doc.text('Liste des Élèves', 14, 24);
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
          doc.text('Matricule', 14, y);
          doc.text('Nom', 50, y);
          doc.text('Prénom', 90, y);
          doc.text('Date Naiss.', 125, y);
          doc.text('Genre', 150, y);
          doc.text('Statut', 170, y);
          y += 8;
          doc.setFont('helvetica', 'normal');
        }

        // Ligne alternée (zebra)
        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(14, y - 4, 180, 7, 'F');
        }

        const matricule = student.matricule || '';
        const lastName = (student.last_name || '').substring(0, 20);
        const firstName = (student.first_name || '').substring(0, 20);
        const dateOfBirth = student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('fr-FR') : 'N/A';
        const gender = student.gender === 'M' ? 'M' : student.gender === 'F' ? 'F' : 'N/A';
        const status = translateStatus(student.status) || 'N/A';

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.text(matricule, 14, y);
        doc.setFontSize(10);
        doc.text(lastName, 50, y);
        doc.text(firstName, 90, y);
        doc.setFontSize(9);
        doc.text(dateOfBirth, 125, y);
        doc.text(gender, 150, y);
        doc.setFontSize(10);
        doc.text(status, 170, y);
        y += 8;
      });

      y += 40; // Espace entre les classes

      // Saut de page explicite si on est trop bas pour le prochain en-tête de classe
      if (y > 230) {
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
        doc.text('Liste des Élèves', 14, 24);
        doc.setFontSize(9);
        doc.text(`Date de génération: ${generationDate}`, 14, 32);
        doc.text(`Exporté par: ${exportedBy}`, 110, 32);
        doc.text(`Page ${pageCount}`, 180, 32);
        y = 45;
        // Réinitialiser la couleur du texte à noir après la bannière
        doc.setTextColor(0, 0, 0);
      }
    });

    doc.save('liste_eleves.pdf');
    setShowExportModal(false);
    setSelectedClassesForExport([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-blue-600 text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100 flex flex-col relative overflow-hidden">
      {/* Forme géométrique décorative en arrière-plan */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl opacity-20"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl opacity-20"></div>
      
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-[99999] bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl shadow-xl animate-pulse flex items-center gap-2 relative z-20">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 shadow-xl flex-shrink-0 relative overflow-hidden">
        {/* Motif subtil en arrière-plan */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:8 py-6 relative z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-full backdrop-blur-sm border-2 border-white/50 shadow-lg" style={{ padding: 0 }}>
                <SchoolLogo size={56} inCircle={true} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">Gestion des Élèves</h1>
                <p className="text-sm text-blue-100 drop-shadow">Liste complète des élèves</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (user?.role === 'founder') navigate('/dashboard/founder');
                  else if (user?.role === 'director') navigate('/dashboard/director');
                  else navigate('/dashboard/teacher');
                }}
                className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 transition-all font-medium shadow-lg backdrop-blur-sm flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 transition-all font-medium shadow-lg flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
              {user?.role !== 'teacher' && (
                <button
                  onClick={() => {
                    resetForm();
                    setEditingStudent(null);
                    setShowModal(true);
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white rounded-xl hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium shadow-lg flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un élève
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:8 py-8">
          {user?.role === 'teacher' ? (
            <>
              {/* Message explicatif */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 mb-6 shadow-md">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Info className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Inscription d'élèves
                    </h3>
                    <p className="text-blue-800 mb-4">
                      En tant qu'enseignant, vous pouvez inscrire de nouveaux élèves dans n'importe quelle classe.
                      Vous voyez tous les élèves de vos classes assignées.
                    </p>
                    <button
                      onClick={() => {
                        resetForm();
                        setEditingStudent(null);
                        setShowModal(true);
                      }}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white rounded-xl hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium shadow-lg flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Inscrire un élève
                    </button>
                  </div>
                </div>
              </div>

              {/* Liste des élèves créés par l'enseignant */}
              <div className="space-y-6">
                {Object.keys(studentsByClass).length === 0 ? (
                  <div className="bg-white rounded-xl shadow-card overflow-hidden">
                    <div className="px-6 py-12 text-center text-gray-500">
                      Aucun élève dans vos classes assignées
                    </div>
                  </div>
                ) : (
                  Object.entries(studentsByClass).map(([className, classStudents]) => (
                    <div key={className} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                      <div className="px-6 py-4 border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500 rounded-lg">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Classe {className} ({(classStudents as any[]).length} élève{(classStudents as any[]).length > 1 ? 's' : ''})
                            </h3>
                          </div>
                          {user?.role !== 'teacher' && getClassTeachers(className).length > 0 && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Enseignant{getClassTeachers(className).length > 1 ? 's' : ''}:</span> {getClassTeachers(className).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Matricule</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nom</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Prénom</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(classStudents as any[]).map((student) => (
                              <tr key={student.id} className="hover:bg-blue-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.matricule || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.last_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.first_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    student.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                    student.status === 'repeating' ? 'bg-amber-100 text-amber-700' :
                                    student.status === 'archived' ? 'bg-gray-100 text-gray-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {translateStatus(student.status)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <button
                                    onClick={() => {
                                      setEditingStudent(student);
                                      setFormData({
                                        firstName: student.first_name,
                                        lastName: student.last_name,
                                        dateOfBirth: student.date_of_birth,
                                        gender: student.gender,
                                        parentName: student.parent_name,
                                        parentPhone: student.parent_phone,
                                        parentAddress: student.parent_address,
                                        classId: student.current_class_id,
                                        schoolYear: '2024-2025',
                                        photoUrl: student.photo_url,
                                        matricule: student.matricule || '',
                                      });
                                      setShowModal(true);
                                    }}
                                    className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium flex items-center gap-1 transition-colors"
                                  >
                                    <Edit className="w-4 h-4" />
                                    Modifier
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              {/* Statistiques */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-md p-6 border-l-6 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Total élèves</h3>
                      <p className="text-4xl font-bold text-blue-600">{filteredStudents.length}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 border-l-6 border-emerald-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Actifs</h3>
                      <p className="text-4xl font-bold text-emerald-600">{filteredStudents.filter(s => s.status === 'active').length}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 border-l-6 border-amber-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Redoublants</h3>
                      <p className="text-4xl font-bold text-amber-600">{filteredStudents.filter(s => s.status === 'repeating').length}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full">
                      <Clock className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 border-l-6 border-gray-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Archivés</h3>
                      <p className="text-4xl font-bold text-gray-600">{filteredStudents.filter(s => s.status === 'archived').length}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full">
                      <Archive className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Table des élèves */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Élèves par classe</h2>
                {Object.keys(studentsByClass).length === 0 ? (
                  <div className="bg-white rounded-xl shadow-card overflow-hidden">
                    <div className="px-6 py-12 text-center text-gray-500">
                      Aucun élève enregistré
                    </div>
                  </div>
                ) : (
                  Object.entries(studentsByClass).map(([className, classStudents]) => (
                    <div key={className} className="bg-white rounded-xl shadow-card overflow-hidden hover:shadow-card-hover transition-shadow">
                      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">
                              {className} ({(classStudents as any[]).length} élève{(classStudents as any[]).length > 1 ? 's' : ''})
                            </h3>
                          </div>
                          {user?.role !== 'teacher' && getClassTeachers(className).length > 0 && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Enseignant{getClassTeachers(className).length > 1 ? 's' : ''}:</span> {getClassTeachers(className).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matricule</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prénom</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de naissance</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Genre</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(classStudents as any[]).map((student) => (
                              <tr key={student.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.matricule || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.last_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.first_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.date_of_birth || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.gender === 'M' ? 'Masculin' : 'Féminin'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    student.status === 'active' ? 'bg-[#10B981]/10 text-[#10B981]' :
                                    student.status === 'repeating' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                                    student.status === 'archived' ? 'bg-[#6B7280]/10 text-[#6B7280]' :
                                    'bg-[#EF4444]/10 text-[#EF4444]'
                                  }`}>
                                    {translateStatus(student.status)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.parent_name || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.parent_phone || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <button
                                    onClick={() => {
                                      setEditingStudent(student);
                                      setFormData({
                                        firstName: student.first_name,
                                        lastName: student.last_name,
                                        dateOfBirth: student.date_of_birth,
                                        gender: student.gender,
                                        parentName: student.parent_name,
                                        parentPhone: student.parent_phone,
                                        parentAddress: student.parent_address,
                                        classId: student.current_class_id,
                                        schoolYear: '2024-2025',
                                        photoUrl: student.photo_url,
                                        matricule: student.matricule,
                                      });
                                      setShowModal(true);
                                    }}
                                    className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium flex items-center gap-1 transition-colors"
                                  >
                                    <Edit className="w-4 h-4" />
                                    Modifier
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Student Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content p-6 max-w-2xl w-full mx-4 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-3">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-blue-600" />
                {editingStudent ? 'Modifier l\'élève' : 'Inscrire un nouvel élève'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingStudent(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-blue-600 transition-colors bg-gray-100 hover:bg-blue-100 rounded-full p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-input focus:shadow-input-focus"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-input focus:shadow-input-focus"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date de naissance</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-input focus:shadow-input-focus"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-input focus:shadow-input-focus"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'M' | 'F' })}
                  >
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom du parent</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-input focus:shadow-input-focus"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone du parent</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-input focus:shadow-input-focus"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse du parent</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-input focus:shadow-input-focus"
                    value={formData.parentAddress}
                    onChange={(e) => setFormData({ ...formData, parentAddress: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Classe</label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-input focus:shadow-input-focus"
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  >
                    <option value="">Sélectionner une classe</option>
                    {classes.length > 0 ? (
                      classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="cp1">CP1</option>
                        <option value="cp2">CP2</option>
                        <option value="ce1">CE1</option>
                        <option value="ce2">CE2</option>
                        <option value="cm1">CM1</option>
                        <option value="cm2">CM2</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Année scolaire</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-input focus:shadow-input-focus"
                    value={formData.schoolYear}
                    onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Matricule (optionnel - laissé vide pour génération automatique)
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-input focus:shadow-input-focus"
                    placeholder="Ex: ECO240001"
                    value={formData.matricule}
                    onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Si laissé vide, un matricule sera généré automatiquement
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL de la photo (optionnel)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-input focus:shadow-input-focus"
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingStudent(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {editingStudent ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Export Modal */}
      {showExportModal && (
        <div className='modal-overlay'>
          <div className='modal-content p-6 max-w-md w-full mx-4 border-2 border-blue-200'>
            <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-3">
              <h3 className='text-xl font-semibold text-gray-900 flex items-center gap-2'>
                <FileText className="w-6 h-6 text-blue-600" />
                Sélectionner les classes
              </h3>
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setSelectedClassesForExport([]);
                }}
                className="text-gray-400 hover:text-blue-600 transition-colors bg-gray-100 hover:bg-blue-100 rounded-full p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className='space-y-3 mb-4 max-h-64 overflow-y-auto'>
              <label className='flex items-center space-x-3 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={selectedClassesForExport.length === 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedClassesForExport([]);
                    }
                  }}
                  className='w-4 h-4 text-blue-600 rounded focus:ring-blue-500'
                />
                <span className='text-gray-700'>Toutes les classes</span>
              </label>
              {(user?.role === 'teacher' ? getOrderedClassNames(assignedClasses) : classes.map(c => c.name)).map((className) => (
                <label key={className} className='flex items-center space-x-3 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={selectedClassesForExport.includes(className)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedClassesForExport([...selectedClassesForExport, className]);
                      } else {
                        setSelectedClassesForExport(selectedClassesForExport.filter(c => c !== className));
                      }
                    }}
                    className='w-4 h-4 text-blue-600 rounded focus:ring-blue-500'
                  />
                  <span className='text-gray-700'>{className}</span>
                </label>
              ))}
            </div>
            <div className='flex justify-end space-x-3'>
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setSelectedClassesForExport([]);
                }}
                className='px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md flex items-center gap-2'
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
              <button
                onClick={exportToPDF}
                className='px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md flex items-center gap-2'
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
