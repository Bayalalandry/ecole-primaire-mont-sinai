import { Router } from 'express';
import { AuthRequest, authenticateToken, requireFounder, requireFounderOrDirector } from '../middleware/auth';
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

    // Pour les enseignants, vérifier si le compte est validé
    if (user.role === 'teacher') {
      const teacherInfo = await getTeacherInfo(user.id);
      if (teacherInfo && teacherInfo.status === 'pending') {
        return res.status(403).json({ error: 'Compte en attente de validation par le fondateur' });
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

// Register (pour les enseignants uniquement)
router.post('/register', async (req, res) => {
  try {
    const { username, password, firstName, lastName, classId } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Nom d\'utilisateur déjà utilisé' });
    }

    const passwordHash = await hashPassword(password);

    // Créer l'utilisateur
    const newUser = await createUser({
      username,
      password_hash: passwordHash,
      role: 'teacher',
      first_name: firstName,
      last_name: lastName,
      is_active: true,
    });

    // Créer les infos enseignant (statut pending par défaut)
    await createTeacherInfo({
      user_id: newUser.id,
      status: 'pending',
    });

    // Log l'activité
    await logActivity(newUser.id, 'REGISTER', 'user', newUser.id, { username, role: 'teacher' });

    // Notifier le fondateur
    const { data: founder } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'founder')
      .limit(1)
      .single();

    if (founder) {
      await createNotification(
        founder.id,
        'teacher_pending',
        'Nouvel enseignant en attente',
        `${firstName} ${lastName} (${username}) a créé un compte enseignant et attend votre validation.`,
        'user',
        newUser.id
      );
    }

    res.status(201).json({
      message: 'Compte créé avec succès. En attente de validation par le fondateur.',
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du compte' });
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

    // Créer les permissions du directeur
    await createDirectorPermissions({
      user_id: newUser.id,
      ...permissions,
    });

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

// Valider un compte enseignant (réservé au fondateur)
router.post('/validate-teacher/:userId', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const userIdStr = getParam(userId);

    const user = await getUserById(userIdStr);
    if (!user || user.role !== 'teacher') {
      return res.status(404).json({ error: 'Enseignant non trouvé' });
    }

    await updateTeacherInfo(userIdStr, { status: 'active' });

    // Log l'activité
    await logActivity(req.user!.id, 'VALIDATE_TEACHER', 'user', userIdStr, { username: user.username });

    // Notifier l'enseignant
    await createNotification(
      userIdStr,
      'teacher_validated',
      'Compte validé',
      'Votre compte enseignant a été validé par le fondateur. Vous pouvez maintenant accéder à votre tableau de bord.',
      'user',
      userIdStr
    );

    res.json({ message: 'Compte enseignant validé avec succès' });
  } catch (error: any) {
    console.error('Validate teacher error:', error);
    res.status(500).json({ error: 'Erreur lors de la validation du compte enseignant' });
  }
});

// Refuser un compte enseignant (réservé au fondateur)
router.post('/reject-teacher/:userId', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const userIdStr = getParam(userId);

    const user = await getUserById(userIdStr);
    if (!user || user.role !== 'teacher') {
      return res.status(404).json({ error: 'Enseignant non trouvé' });
    }

    await updateTeacherInfo(userIdStr, { status: 'archived' });
    await updateUser(userIdStr, { is_active: false });

    // Log l'activité
    await logActivity(req.user!.id, 'REJECT_TEACHER', 'user', userIdStr, { username: user.username });

    res.json({ message: 'Compte enseignant refusé' });
  } catch (error: any) {
    console.error('Reject teacher error:', error);
    res.status(500).json({ error: 'Erreur lors du refus du compte enseignant' });
  }
});

// Mettre en congé un enseignant (réservé au fondateur)
router.post('/teacher-leave/:userId', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { leaveStartDate, leaveEndDate } = req.body;
    const userIdStr = getParam(userId);

    const user = await getUserById(userIdStr);
    if (!user || user.role !== 'teacher') {
      return res.status(404).json({ error: 'Enseignant non trouvé' });
    }

    await updateTeacherInfo(userIdStr, {
      status: 'on_leave',
      leave_start_date: leaveStartDate,
      leave_end_date: leaveEndDate,
    });

    // Log l'activité
    await logActivity(req.user!.id, 'TEACHER_LEAVE', 'user', userIdStr, { 
      username: user.username,
      leaveStartDate,
      leaveEndDate,
    });

    res.json({ message: 'Congé enregistré avec succès' });
  } catch (error: any) {
    console.error('Teacher leave error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du congé' });
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
    } else if (user.role === 'teacher') {
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

// Lister les enseignants en attente de validation (réservé au fondateur)
router.get('/pending-teachers', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        username,
        first_name,
        last_name,
        teachers (
          status,
          created_at
        )
      `)
      .eq('role', 'teacher')
      .eq('is_active', true);

    if (error) throw error;

    const pendingTeachers = data?.filter((u: any) => u.teachers?.status === 'pending') || [];

    res.json({ teachers: pendingTeachers });
  } catch (error: any) {
    console.error('Get pending teachers error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des enseignants en attente' });
  }
});

// Lister tous les enseignants (réservé au fondateur et directeur)
router.get('/teachers', authenticateToken, requireFounderOrDirector, async (req: AuthRequest, res) => {
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
      .in('role', ['teacher', 'director'])
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

// Assigner un enseignant ou un directeur à une classe
router.post('/assign-teacher', authenticateToken, requireFounderOrDirector, async (req: AuthRequest, res) => {
  try {
    const { teacherId, classId, schoolYear } = req.body;
    console.log('Assign teacher request:', { teacherId, classId, schoolYear });

    // Vérifier si l'assignation existe déjà
    const { data: existingAssignment } = await supabase
      .from('teacher_class_assignments')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('class_id', classId)
      .maybeSingle();

    if (existingAssignment) {
      console.log('Assignment already exists, skipping');
      return res.json({ message: 'Enseignant déjà assigné à cette classe' });
    }

    // Créer la nouvelle assignation sans school_year pour éviter les conflits
    const { error } = await supabase
      .from('teacher_class_assignments')
      .insert({
        teacher_id: teacherId,
        class_id: classId
      });

    if (error) {
      console.error('Error inserting assignment:', error);
      throw error;
    }

    await logActivity(req.user!.id, 'ASSIGN_TEACHER', 'class', classId, {
      teacherId,
      classId,
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
    res.json({ message: 'Enseignant assigné avec succès' });
  } catch (error: any) {
    console.error('Assign teacher error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'assignation' });
  }
});

// Désassigner un enseignant d'une classe
router.post('/unassign-teacher', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { teacherId, classId } = req.body;
    console.log('Unassign teacher request:', { teacherId, classId });

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
    res.json({ message: 'Enseignant désassigné avec succès' });
  } catch (error: any) {
    console.error('Unassign teacher error:', error);
    res.status(500).json({ error: 'Erreur lors de la désassignation' });
  }
});

// Réassigner les élèves d'un enseignant à un autre
router.post('/reassign-students', authenticateToken, requireFounderOrDirector, async (req: AuthRequest, res) => {
  try {
    const { fromTeacherId, toTeacherId } = req.body;

    // Récupérer les classes assignées à l'enseignant de départ
    const { data: teacherAssignments } = await supabase
      .from('teacher_class_assignments')
      .select('class_id')
      .eq('teacher_id', fromTeacherId);
    
    if (!teacherAssignments || teacherAssignments.length === 0) {
      return res.json({ message: 'Aucune classe assignée à cet enseignant' });
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

export { router as authRoutes };
