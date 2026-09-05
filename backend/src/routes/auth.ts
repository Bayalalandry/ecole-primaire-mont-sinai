import { Router } from 'express';
import { AuthRequest, authenticateToken, requireFounder, requireFounderOrDirector, requireFounderOrDirectorOrSecretary } from '../middleware/auth';
import {
  hashPassword,
  comparePassword,
  generateToken,
  getUserByUsername,
  getUserById,
  createUser,
  updateUser,
  getFounderSettings,
  createFounderSettings,
  getDirectorPermissions,
  createDirectorPermissions,
  updateDirectorPermissions,
  getTeacherInfo,
  createTeacherInfo,
  updateTeacherInfo,
  logActivity,
} from '../services/authService';
import { supabase } from '../services/supabase';
import { createNotification } from '../services/notificationService';

const router = Router();

// Utilitaire pour gérer les paramètres de route qui peuvent être des tableaux
const getParam = (param: string | string[]): string => {
  return Array.isArray(param) ? param[0] : param;
};

// Login (pour tous les rôles)
router.post('/login', async (req, res) => {
  try {
    const { username, password, secretAnswer } = req.body;

    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Compte désactivé' });
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    // Double vérification pour le fondateur
    if (user.role === 'founder') {
      const founderSettings = await getFounderSettings(user.id);
      if (!founderSettings) {
        return res.status(500).json({ error: 'Configuration du fondateur manquante' });
      }

      if (!secretAnswer) {
        return res.status(200).json({
          requiresSecretAnswer: true,
          secretQuestion: founderSettings.secret_question,
        });
      }

      const isSecretValid = await comparePassword(secretAnswer, founderSettings.secret_answer_hash);
      if (!isSecretValid) {
        return res.status(401).json({ error: 'Réponse secrète incorrecte' });
      }
    }

    const token = generateToken(user);

    // Log l'activité
    await logActivity(user.id, 'LOGIN', 'user', user.id, { username });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Créer le compte fondateur (une seule fois)
router.post('/create-founder', async (req, res) => {
  console.log('=== CREATE-FOUNDER ROUTE CALLED ===');
  try {
    console.log('create-founder request received:', req.body);
    const { username, password, firstName, lastName, secretQuestion, secretAnswer } = req.body;

    console.log('Checking if founder already exists...');
    // Vérifier si un fondateur existe déjà
    const { data: existingFounders, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'founder');

    if (checkError) {
      throw checkError;
    }

    if (existingFounders && existingFounders.length > 0) {
      return res.status(400).json({ error: 'Un compte fondateur existe déjà' });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Nom d\'utilisateur déjà utilisé' });
    }

    const passwordHash = await hashPassword(password);
    const secretAnswerHash = await hashPassword(secretAnswer);

    // Créer l'utilisateur fondateur
    const newUser = await createUser({
      username,
      password_hash: passwordHash,
      role: 'founder',
      first_name: firstName,
      last_name: lastName,
      is_active: true,
    });

    // Créer les settings du fondateur
    await createFounderSettings({
      user_id: newUser.id,
      secret_question: secretQuestion,
      secret_answer_hash: secretAnswerHash,
    });

    // Log l'activité
    await logActivity(newUser.id, 'CREATE_FOUNDER', 'user', newUser.id, { username });

    res.status(201).json({
      message: 'Compte fondateur créé avec succès',
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
      },
    });
  } catch (error: any) {
    console.error('Create founder error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du compte fondateur' });
  }
});

// Créer un compte directeur (réservé au fondateur)
router.post('/create-director', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { username, password, firstName, lastName, permissions } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Nom d\'utilisateur déjà utilisé' });
    }

    const passwordHash = await hashPassword(password);

    // Créer l'utilisateur directeur
    const newUser = await createUser({
      username,
      password_hash: passwordHash,
      role: 'director',
      first_name: firstName,
      last_name: lastName,
      is_active: true,
    });

    // Créer l'entrée dans la table teachers pour permettre l'assignation de classe
    try {
      await createTeacherInfo({
        user_id: newUser.id,
        status: 'active', // Les directeurs sont actifs par défaut
      });
    } catch (teacherError) {
      console.error('Error creating teacher entry for director:', teacherError);
      // Ne pas échouer si l'entrée teachers échoue
    }

    // Créer les permissions du directeur (si erreur, log mais ne pas empêcher la création)
    try {
      await createDirectorPermissions({
        user_id: newUser.id,
        ...permissions,
      });
    } catch (permError) {
      console.error('Error creating director permissions:', permError);
      // Ne pas échouer si les permissions échouent - l'utilisateur est créé
      // Les permissions par défaut seront utilisées si nécessaire
    }

    // Log l'activité
    await logActivity(req.user!.id, 'CREATE_DIRECTOR', 'user', newUser.id, { username, permissions });

    res.status(201).json({
      message: 'Compte directeur créé avec succès',
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
      },
    });
  } catch (error: any) {
    console.error('Create director error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du compte directeur' });
  }
});

// Créer le compte secrétaire (réservé au fondateur)
router.post('/create-secretary', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { username, password, firstName, lastName } = req.body;

    // Vérifier si un secrétaire existe déjà
    const { data: existingSecretaries } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'secretary');

    if (existingSecretaries && existingSecretaries.length > 0) {
      return res.status(400).json({ error: 'Un compte secrétaire existe déjà' });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Nom d\'utilisateur déjà utilisé' });
    }

    const passwordHash = await hashPassword(password);

    // Créer l'utilisateur secrétaire
    const newUser = await createUser({
      username,
      password_hash: passwordHash,
      role: 'secretary',
      first_name: firstName,
      last_name: lastName,
      is_active: true,
    });

    // Créer l'entrée dans la table teachers pour permettre l'assignation de classe
    try {
      await createTeacherInfo({
        user_id: newUser.id,
        status: 'active', // Les secrétaires sont actifs par défaut
      });
    } catch (teacherError) {
      console.error('Error creating teacher entry for secretary:', teacherError);
      // Ne pas échouer si l'entrée teachers échoue
    }

    // Log l'activité
    await logActivity(req.user!.id, 'CREATE_SECRETARY', 'user', newUser.id, { username });

    res.status(201).json({
      message: 'Compte secrétaire créé avec succès',
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
      },
    });
  } catch (error: any) {
    console.error('Create secretary error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du compte secrétaire' });
  }
});

// Réinitialiser le mot de passe (réservé au fondateur uniquement)
router.post('/reset-password/:userId', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    const userIdStr = getParam(userId);

    const user = await getUserById(userIdStr);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const passwordHash = await hashPassword(newPassword);
    await updateUser(userIdStr, { password_hash: passwordHash });

    // Log l'activité
    await logActivity(req.user!.id, 'RESET_PASSWORD', 'user', userIdStr, { username: user.username });

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation du mot de passe' });
  }
});

// Désactiver un compte (réservé au fondateur)
router.post('/disable-account/:userId', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const userIdStr = getParam(userId);

    const user = await getUserById(userIdStr);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    await updateUser(userIdStr, { is_active: false });

    // Log l'activité
    await logActivity(req.user!.id, 'DISABLE_ACCOUNT', 'user', userIdStr, { username: user.username });

    res.json({ message: 'Compte désactivé avec succès' });
  } catch (error: any) {
    console.error('Disable account error:', error);
    res.status(500).json({ error: 'Erreur lors de la désactivation du compte' });
  }
});

// Modifier les permissions du directeur (réservé au fondateur)
router.put('/director-permissions/:userId', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;
    const userIdStr = getParam(userId);

    const user = await getUserById(userIdStr);
    if (!user || user.role !== 'director') {
      return res.status(404).json({ error: 'Directeur non trouvé' });
    }

    await updateDirectorPermissions(userIdStr, permissions);

    // Log l'activité
    await logActivity(req.user!.id, 'UPDATE_DIRECTOR_PERMISSIONS', 'user', userIdStr, { 
      username: user.username,
      permissions,
    });

    res.json({ message: 'Permissions du directeur mises à jour avec succès' });
  } catch (error: any) {
    console.error('Update director permissions error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des permissions' });
  }
});

// Obtenir les informations de l'utilisateur connecté
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await getUserById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    let additionalInfo: any = {};

    if (user.role === 'founder') {
      const founderSettings = await getFounderSettings(user.id);
      additionalInfo.founderSettings = founderSettings;
    } else if (user.role === 'director') {
      const directorPermissions = await getDirectorPermissions(user.id);
      additionalInfo.directorPermissions = directorPermissions;
    } else if (user.role === 'secretary') {
      const teacherInfo = await getTeacherInfo(user.id);
      additionalInfo.teacherInfo = teacherInfo;
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        is_active: user.is_active,
        ...additionalInfo,
      },
    });
  } catch (error: any) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des informations' });
  }
});

// Lister tous les enseignants et directeurs (réservé au fondateur, directeur et secrétaire)
router.get('/teachers', authenticateToken, requireFounderOrDirectorOrSecretary, async (req: AuthRequest, res) => {
  try {
    console.log('GET /auth/teachers - fetching teachers');
    console.log('User making request:', req.user);
    
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        username,
        first_name,
        last_name,
        role,
        is_active,
        created_at,
        teachers (
          status
        )
      `)
      .in('role', ['secretary', 'director'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching teachers:', error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} users (teachers + directors)`);
    console.log('Users found:', data?.map((u: any) => ({ id: u.id, username: u.username, role: u.role })));

    // Récupérer les affectations de classe pour chaque enseignant
    const teacherIds = (data || []).map((u: any) => u.id);
    let assignments: any[] = [];
    if (teacherIds.length > 0) {
      const { data: assignData } = await supabase
        .from('teacher_class_assignments')
        .select('teacher_id, class_id')
        .in('teacher_id', teacherIds);
      assignments = assignData || [];
    }

    // Récupérer les noms des classes
    const classIds = [...new Set(assignments.map((a: any) => a.class_id))];
    let classMap: any = {};
    if (classIds.length > 0) {
      const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .in('id', classIds);
      classMap = (classes || []).reduce((acc: any, cls: any) => {
        acc[cls.id] = cls.name;
        return acc;
      }, {});
    }

    // Ajouter les classes assignées à chaque enseignant
    const teachersWithClasses = (data || []).map((teacher: any) => {
      const teacherAssignments = assignments.filter((a: any) => a.teacher_id === teacher.id);
      const assignedClasses = teacherAssignments.map((a: any) => classMap[a.class_id]).filter(Boolean);
      console.log(`Teacher ${teacher.username}: ${teacherAssignments.length} assignments, classes: ${JSON.stringify(assignedClasses)}`);
      return {
        ...teacher,
        assigned_class: assignedClasses.length > 0 ? assignedClasses.join(', ') : null,
        assigned_classes: assignedClasses
      };
    });

    console.log('Sending response with teachers/directors:', teachersWithClasses.length);
    console.log('Response data:', teachersWithClasses.map((t: any) => ({ id: t.id, username: t.username, role: t.role })));
    res.json({ teachers: teachersWithClasses });
  } catch (error: any) {
    console.error('Get teachers error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des enseignants' });
  }
});

// Mettre à jour le statut d'un enseignant
router.put('/teacher-status/:userId', authenticateToken, requireFounderOrDirector, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    const { error } = await supabase
      .from('teachers')
      .update({ 
        status,
        leave_start_date: status === 'on_leave' ? req.body.leaveStartDate : null,
        leave_end_date: status === 'on_leave' ? req.body.leaveEndDate : null
      })
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'Statut mis à jour avec succès' });
  } catch (error: any) {
    console.error('Update teacher status error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
});

// Assigner un secrétaire ou un directeur à une classe
router.post('/assign-teacher', authenticateToken, requireFounderOrDirector, async (req: AuthRequest, res) => {
  try {
    const { teacherId, classId, schoolYear } = req.body;
    console.log('Assign staff request:', { teacherId, classId, schoolYear });

    // Récupérer l'ID de l'année scolaire
    let schoolYearId = null;
    if (schoolYear) {
      const { data: schoolYearData } = await supabase
        .from('school_years')
        .select('id')
        .eq('year_label', schoolYear)
        .maybeSingle();

      if (schoolYearData) {
        schoolYearId = schoolYearData.id;
      }
    } else {
      // Si schoolYear n'est pas fourni, utiliser l'année scolaire actuelle
      const { data: currentYear } = await supabase
        .from('school_years')
        .select('id')
        .eq('is_current', true)
        .maybeSingle();

      if (currentYear) {
        schoolYearId = currentYear.id;
      }
    }

    // Vérifier si l'assignation existe déjà
    const { data: existingAssignment } = await supabase
      .from('teacher_class_assignments')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('class_id', classId)
      .maybeSingle();

    if (existingAssignment) {
      console.log('Assignment already exists, skipping');
      return res.json({ message: 'Personnel déjà assigné à cette classe' });
    }

    // Créer la nouvelle assignation avec school_year_id
    const assignmentData: any = {
      teacher_id: teacherId,
      class_id: classId,
    };

    if (schoolYearId) {
      assignmentData.school_year_id = schoolYearId;
    }

    const { error } = await supabase
      .from('teacher_class_assignments')
      .insert(assignmentData);

    if (error) {
      console.error('Error inserting assignment:', error);
      throw error;
    }

    await logActivity(req.user!.id, 'ASSIGN_TEACHER', 'class', classId, {
      teacherId,
      classId,
      schoolYearId,
    });

    // Notifier l'enseignant
    await createNotification(
      teacherId,
      'class_assigned',
      'Classe assignée',
      'Une classe vous a été assignée par le fondateur.',
      'class',
      classId
    );

    console.log('Assignment successful');
    res.json({ message: 'Personnel assigné avec succès' });
  } catch (error: any) {
    console.error('Assign staff error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'assignation' });
  }
});

// Désassigner un secrétaire d'une classe
router.post('/unassign-teacher', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { teacherId, classId } = req.body;
    console.log('Unassign staff request:', { teacherId, classId });

    if (!teacherId || !classId) {
      return res.status(400).json({ error: 'Champs requis: teacherId, classId' });
    }

    // Supprimer l'assignation
    const { error } = await supabase
      .from('teacher_class_assignments')
      .delete()
      .eq('teacher_id', teacherId)
      .eq('class_id', classId);

    if (error) {
      console.error('Error deleting assignment:', error);
      throw error;
    }

    console.log('Unassignment successful');
    res.json({ message: 'Personnel désassigné avec succès' });
  } catch (error: any) {
    console.error('Unassign staff error:', error);
    res.status(500).json({ error: 'Erreur lors de la désassignation' });
  }
});

// Réassigner les élèves d'un secrétaire à un autre
router.post('/reassign-students', authenticateToken, requireFounderOrDirector, async (req: AuthRequest, res) => {
  try {
    const { fromTeacherId, toTeacherId } = req.body;

    // Récupérer les classes assignées au secrétaire de départ
    const { data: teacherAssignments } = await supabase
      .from('teacher_class_assignments')
      .select('class_id')
      .eq('teacher_id', fromTeacherId);

    if (!teacherAssignments || teacherAssignments.length === 0) {
      return res.json({ message: 'Aucune classe assignée à ce secrétaire' });
    }
    
    const assignedClassIds = teacherAssignments.map((a: any) => a.class_id);
    
    // Réassigner tous les élèves de ces classes
    const { error } = await supabase
      .from('students')
      .update({ created_by: toTeacherId })
      .in('current_class_id', assignedClassIds);

    if (error) throw error;

    res.json({ message: 'Élèves réassignés avec succès' });
  } catch (error: any) {
    console.error('Reassign students error:', error);
    res.status(500).json({ error: 'Erreur lors de la réassignation' });
  }
});

// Lister tous les utilisateurs (réservé au fondateur)
router.get('/users', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        username,
        first_name,
        last_name,
        role,
        is_active,
        created_at,
        teachers (
          status
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ users: data });
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
  }
});

// Endpoint temporaire pour réinitialiser le mot de passe secrétaire (à supprimer après Phase 4)
router.post('/reset-secretary-password', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'Mot de passe requis' });
    }

    // Récupérer le secrétaire
    const { data: secretary } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'secretary')
      .limit(1)
      .maybeSingle();

    if (!secretary) {
      return res.status(404).json({ error: 'Aucun secrétaire trouvé' });
    }

    // Hasher le nouveau mot de passe
    const passwordHash = await hashPassword(newPassword);

    // Mettre à jour
    const { error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', secretary.id);

    if (error) throw error;

    await logActivity(req.user!.id, 'RESET_SECRETARY_PASSWORD', 'user', secretary.id, { username: secretary.username });

    res.json({ message: 'Mot de passe secrétaire réinitialisé avec succès' });
  } catch (error: any) {
    console.error('Reset secretary password error:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation' });
  }
});

export { router as authRoutes };
