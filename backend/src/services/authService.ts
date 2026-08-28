import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from './supabase';

export interface User {
  id: string;
  username: string;
  role: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
}

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (user: User): string => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_SECRET || 'your_jwt_secret_key',
    { expiresIn: '24h' }
  );
};

export const getUserByUsername = async (username: string): Promise<any> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .maybeSingle(); // Utiliser maybeSingle() au lieu de single() pour éviter l'erreur quand aucun résultat

  if (error) throw error;
  return data;
};

export const getUserById = async (id: string): Promise<any> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const createUser = async (userData: any): Promise<any> => {
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateUser = async (id: string, updates: any): Promise<any> => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getFounderSettings = async (userId: string): Promise<any> => {
  const { data, error } = await supabase
    .from('founder_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const createFounderSettings = async (settings: any): Promise<any> => {
  const { data, error } = await supabase
    .from('founder_settings')
    .insert(settings)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getDirectorPermissions = async (userId: string): Promise<any> => {
  const { data, error } = await supabase
    .from('director_permissions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const createDirectorPermissions = async (permissions: any): Promise<any> => {
  const { data, error } = await supabase
    .from('director_permissions')
    .insert(permissions)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const updateDirectorPermissions = async (userId: string, permissions: any): Promise<any> => {
  const { data, error } = await supabase
    .from('director_permissions')
    .update(permissions)
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getTeacherInfo = async (userId: string): Promise<any> => {
  const { data: teacherData, error: teacherError } = await supabase
    .from('teachers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (teacherError) throw teacherError;

  // Récupérer l'année scolaire actuelle
  const { data: currentYear } = await supabase
    .from('school_years')
    .select('id')
    .eq('is_current', true)
    .maybeSingle();

  // Récupérer les classes assignées pour l'année scolaire actuelle
  const { data: assignments, error: assignError } = await supabase
    .from('teacher_class_assignments')
    .select('class_id, classes(name)')
    .eq('teacher_id', userId)
    .eq('school_year_id', currentYear?.id);

  if (assignError) throw assignError;

  const assignedClasses = assignments?.map((a: any) => a.classes?.name).filter(Boolean) || [];

  return {
    ...teacherData,
    assigned_classes: assignedClasses
  };
};

export const createTeacherInfo = async (teacherData: any): Promise<any> => {
  const { data, error } = await supabase
    .from('teachers')
    .insert(teacherData)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const updateTeacherInfo = async (userId: string, updates: any): Promise<any> => {
  const { data, error } = await supabase
    .from('teachers')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const logActivity = async (userId: string, action: string, entityType: string, entityId: string | null, details: any): Promise<void> => {
  await supabase.from('activity_log').insert({
    action,
    entity_type: entityType,
    entity_id: entityId,
    user_id: userId,
    details,
  });
};
